"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { logActivity } from "@/lib/services/activity-service";
import { getAIProvider } from "@/lib/ai";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import { createResumeVersion } from "./resumes";
import {
  analyzeMatchInputSchema,
  tailorResumeInputSchema,
  saveTailoredResumeSchema,
  createConversationSchema,
  sendMessageSchema,
} from "@/lib/validation/ai";
import type { MatchAnalysis, TailorResult } from "@/lib/ai/provider";

async function loadApplicationAndResume(
  userId: string,
  applicationId: string,
  resumeId: string
) {
  const [application, resume] = await Promise.all([
    prisma.application.findFirst({ where: { id: applicationId, userId } }),
    prisma.resume.findFirst({ where: { id: resumeId, userId } }),
  ]);
  if (!application) throw new Error("Application not found");
  if (!resume) throw new Error("Resume not found");
  if (!application.jobDescription) {
    throw new Error("This application has no job description to compare against.");
  }
  if (!resume.extractedText) {
    throw new Error(
      "This resume has no extracted text. Upload a PDF/DOCX/TXT file or create it from pasted text."
    );
  }
  return { application, resume };
}

export async function analyzeResumeMatch(input: unknown): Promise<MatchAnalysis> {
  const userId = await requireUserId();
  checkAIRateLimit(userId);
  const { applicationId, resumeId } = analyzeMatchInputSchema.parse(input);

  const { application, resume } = await loadApplicationAndResume(userId, applicationId, resumeId);
  const provider = getAIProvider();

  return provider.analyzeMatch({
    resumeText: resume.extractedText!,
    jobTitle: application.jobTitle,
    company: application.company,
    jobDescription: application.jobDescription!,
    requirements: application.requirements,
    preferredQualifications: application.preferredQualifications,
    skills: application.skills,
  });
}

export async function tailorResume(input: unknown): Promise<TailorResult> {
  const userId = await requireUserId();
  checkAIRateLimit(userId);
  const { applicationId, resumeId } = tailorResumeInputSchema.parse(input);

  const { application, resume } = await loadApplicationAndResume(userId, applicationId, resumeId);
  const provider = getAIProvider();

  return provider.tailorResume({
    resumeText: resume.extractedText!,
    jobTitle: application.jobTitle,
    company: application.company,
    jobDescription: application.jobDescription!,
    requirements: application.requirements,
    preferredQualifications: application.preferredQualifications,
    skills: application.skills,
  });
}

export async function saveTailoredResume(input: unknown, applicationId?: string) {
  const userId = await requireUserId();
  const { resumeId, tailoredText, name } = saveTailoredResumeSchema.parse(input);

  let resume = await createResumeVersion(resumeId, tailoredText, "tailored");

  if (name && name !== resume.name) {
    resume = await prisma.resume.update({ where: { id: resume.id }, data: { name } });
  }

  await logActivity({
    userId,
    type: "RESUME_TAILORED",
    description: `Tailored ${resume.name}`,
    applicationId: applicationId ?? null,
  });

  return resume;
}

export async function createConversation(input: unknown) {
  const userId = await requireUserId();
  const data = createConversationSchema.parse(input);

  if (data.applicationId) {
    const application = await prisma.application.findFirst({
      where: { id: data.applicationId, userId },
    });
    if (!application) throw new Error("Application not found");
  }
  if (data.resumeId) {
    const resume = await prisma.resume.findFirst({ where: { id: data.resumeId, userId } });
    if (!resume) throw new Error("Resume not found");
  }

  const conversation = await prisma.conversation.create({
    data: {
      userId,
      applicationId: data.applicationId || null,
      resumeId: data.resumeId || null,
      title: data.title || null,
    },
  });

  revalidatePath("/ai");
  if (data.applicationId) revalidatePath(`/applications/${data.applicationId}`);
  return conversation;
}

export async function getConversationMessages(id: string) {
  const userId = await requireUserId();
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) throw new Error("Conversation not found");
  return conversation.messages;
}

export async function deleteConversation(id: string) {
  const userId = await requireUserId();
  const conversation = await prisma.conversation.findFirst({ where: { id, userId } });
  if (!conversation) throw new Error("Conversation not found");

  await prisma.conversation.delete({ where: { id } });
  revalidatePath("/ai");
  if (conversation.applicationId) revalidatePath(`/applications/${conversation.applicationId}`);
}

export async function sendMessage(input: unknown) {
  const userId = await requireUserId();
  checkAIRateLimit(userId);
  const { conversationId, content } = sendMessageSchema.parse(input);

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      application: { select: { jobTitle: true, company: true, jobDescription: true } },
      resume: { select: { extractedText: true } },
    },
  });
  if (!conversation) throw new Error("Conversation not found");

  const userMessage = await prisma.message.create({
    data: { conversationId, role: "USER", content },
  });

  // Auto-title the conversation from the first message.
  if (!conversation.title && conversation.messages.length === 0) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: content.slice(0, 80) },
    });
  }

  const provider = getAIProvider();
  const history = [...conversation.messages, userMessage].map((m) => ({
    role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  let assistantText: string;
  try {
    assistantText = await provider.chat({
      messages: history,
      context: {
        jobTitle: conversation.application?.jobTitle,
        company: conversation.application?.company,
        jobDescription: conversation.application?.jobDescription ?? undefined,
        resumeText: conversation.resume?.extractedText ?? undefined,
      },
    });
  } catch (err) {
    // Keep the user's message even if the AI call fails, so nothing is lost.
    revalidatePath("/ai");
    throw err;
  }

  const assistantMessage = await prisma.message.create({
    data: { conversationId, role: "ASSISTANT", content: assistantText },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/ai");
  if (conversation.applicationId) revalidatePath(`/applications/${conversation.applicationId}`);

  return { userMessage, assistantMessage };
}
