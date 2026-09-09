import { z } from "zod";

export const resumeMetaSchema = z.object({
  name: z.string().trim().min(1, "Resume name is required").max(200),
  tags: z.string().trim().max(500).optional().nullable(),
  isBaseResume: z.boolean().optional(),
});

export const resumeUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  tags: z.string().trim().max(500).optional().nullable(),
  isBaseResume: z.boolean().optional(),
  extractedText: z.string().max(200000).optional(),
});

export const resumeCreateTextSchema = z.object({
  name: z.string().trim().min(1, "Resume name is required").max(200),
  extractedText: z.string().trim().min(1, "Resume content is required").max(200000),
  tags: z.string().trim().max(500).optional().nullable(),
  isBaseResume: z.boolean().optional(),
});

export const linkResumeSchema = z.object({
  resumeId: z.string().min(1),
});
