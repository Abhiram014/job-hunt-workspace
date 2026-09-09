"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { logActivity } from "@/lib/services/activity-service";
import { storageProvider } from "@/lib/storage";
import { extractResumeText } from "@/lib/services/resume-text";
import {
  resumeUpdateSchema,
  resumeCreateTextSchema,
} from "@/lib/validation/resume";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function fileTypeLabel(contentType: string): string {
  if (contentType === "application/pdf") return "pdf";
  if (contentType.includes("wordprocessingml")) return "docx";
  return "txt";
}

export async function uploadResume(formData: FormData) {
  const userId = await requireUserId();

  const file = formData.get("file");
  const name = String(formData.get("name") ?? "").trim();
  const tags = formData.get("tags")?.toString() || null;
  const isBaseResume = formData.get("isBaseResume") === "true";

  if (!(file instanceof File)) throw new Error("No file provided");
  if (!name) throw new Error("Resume name is required");
  if (file.size === 0) throw new Error("File is empty");
  if (file.size > MAX_SIZE_BYTES) throw new Error("File exceeds 10MB limit");
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only PDF, DOCX, and plain text files are supported");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storageProvider.save({
    userId,
    fileName: file.name,
    contentType: file.type,
    data: buffer,
  });

  const extractedText = await extractResumeText(buffer, file.type);

  const resume = await prisma.resume.create({
    data: {
      userId,
      name,
      fileURL: stored.key,
      fileType: fileTypeLabel(file.type),
      extractedText: extractedText || null,
      tags,
      isBaseResume,
      version: 1,
    },
  });

  revalidatePath("/resumes");
  return resume;
}

export async function createResumeFromText(input: unknown) {
  const userId = await requireUserId();
  const data = resumeCreateTextSchema.parse(input);

  const resume = await prisma.resume.create({
    data: {
      userId,
      name: data.name,
      extractedText: data.extractedText,
      fileType: "txt",
      tags: data.tags,
      isBaseResume: data.isBaseResume ?? false,
      version: 1,
    },
  });

  revalidatePath("/resumes");
  return resume;
}

// Creates a new version of an existing resume (e.g. after tailoring). Never
// mutates the original row, so any application referencing it is unaffected.
export async function createResumeVersion(
  parentResumeId: string,
  extractedText: string,
  nameSuffix = "tailored"
) {
  const userId = await requireUserId();

  const parent = await prisma.resume.findFirst({
    where: { id: parentResumeId, userId },
  });
  if (!parent) throw new Error("Resume not found");

  const rootId = parent.parentResumeId ?? parent.id;
  const latestVersion = await prisma.resume.aggregate({
    where: { OR: [{ id: rootId }, { parentResumeId: rootId }] },
    _max: { version: true },
  });

  const resume = await prisma.resume.create({
    data: {
      userId,
      name: `${parent.name} (${nameSuffix})`,
      extractedText,
      fileType: parent.fileType,
      tags: parent.tags,
      isBaseResume: false,
      parentResumeId: rootId,
      version: (latestVersion._max.version ?? parent.version) + 1,
    },
  });

  revalidatePath("/resumes");
  return resume;
}

export async function updateResume(id: string, input: unknown) {
  const userId = await requireUserId();
  const data = resumeUpdateSchema.parse(input);

  const existing = await prisma.resume.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Resume not found");

  const resume = await prisma.resume.update({ where: { id }, data });
  revalidatePath("/resumes");
  return resume;
}

export async function deleteResume(id: string) {
  const userId = await requireUserId();
  const existing = await prisma.resume.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Resume not found");

  const usageCount = await prisma.applicationResume.count({
    where: { resumeId: id },
  });
  if (usageCount > 0) {
    throw new Error(
      "This resume version was submitted to an application and can't be deleted. Remove the application link first."
    );
  }

  if (existing.fileURL) {
    await storageProvider.delete(existing.fileURL).catch(() => {});
  }

  await prisma.resume.delete({ where: { id } });
  revalidatePath("/resumes");
}

export async function duplicateResume(id: string, newName: string) {
  const userId = await requireUserId();
  const existing = await prisma.resume.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Resume not found");

  const resume = await prisma.resume.create({
    data: {
      userId,
      name: newName,
      extractedText: existing.extractedText,
      fileType: existing.fileType,
      tags: existing.tags,
      isBaseResume: false,
      version: 1,
    },
  });

  revalidatePath("/resumes");
  return resume;
}

// Immutable link: records exactly which resume version was submitted to an
// application. A new submission adds a new row rather than overwriting.
export async function linkResumeToApplication(
  applicationId: string,
  resumeId: string
) {
  const userId = await requireUserId();

  const [application, resume] = await Promise.all([
    prisma.application.findFirst({ where: { id: applicationId, userId } }),
    prisma.resume.findFirst({ where: { id: resumeId, userId } }),
  ]);
  if (!application) throw new Error("Application not found");
  if (!resume) throw new Error("Resume not found");

  const link = await prisma.applicationResume.create({
    data: { applicationId, resumeId },
  });

  await logActivity({
    userId,
    type: "RESUME_SUBMITTED",
    description: `${resume.name} (v${resume.version}) attached to ${application.jobTitle} — ${application.company}`,
    applicationId,
  });

  revalidatePath(`/applications/${applicationId}`);
  return link;
}

export async function unlinkResumeFromApplication(applicationResumeId: string) {
  const userId = await requireUserId();
  const link = await prisma.applicationResume.findFirst({
    where: { id: applicationResumeId, application: { userId } },
  });
  if (!link) throw new Error("Link not found");

  await prisma.applicationResume.delete({ where: { id: applicationResumeId } });
  revalidatePath(`/applications/${link.applicationId}`);
}
