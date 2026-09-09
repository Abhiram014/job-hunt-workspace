import { z } from "zod";

const categoryEnum = z.enum([
  "GENERAL",
  "REFERRAL",
  "RECRUITER",
  "INTERVIEW",
  "FOLLOW_UP",
  "RESEARCH",
]);

export const noteInputSchema = z.object({
  applicationId: z.string().min(1),
  content: z.string().trim().min(1, "Note content is required").max(10000),
  category: categoryEnum.optional(),
  pinned: z.boolean().optional(),
});

export const noteUpdateSchema = z.object({
  content: z.string().trim().min(1).max(10000).optional(),
  category: categoryEnum.optional(),
  pinned: z.boolean().optional(),
});
