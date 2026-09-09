import { z } from "zod";

export const analyzeMatchInputSchema = z.object({
  applicationId: z.string().min(1),
  resumeId: z.string().min(1),
});

export const tailorResumeInputSchema = z.object({
  applicationId: z.string().min(1),
  resumeId: z.string().min(1),
});

export const saveTailoredResumeSchema = z.object({
  resumeId: z.string().min(1),
  tailoredText: z.string().trim().min(1).max(200000),
  name: z.string().trim().max(200).optional(),
});

export const createConversationSchema = z.object({
  applicationId: z.string().optional().nullable(),
  resumeId: z.string().optional().nullable(),
  title: z.string().trim().max(200).optional().nullable(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().trim().min(1, "Message can't be empty").max(8000),
});
