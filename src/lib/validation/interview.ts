import { z } from "zod";

const stageEnum = z.enum([
  "RECRUITER_SCREEN",
  "TECHNICAL_SCREEN",
  "CODING_ASSESSMENT",
  "HIRING_MANAGER",
  "BEHAVIORAL",
  "SYSTEM_DESIGN",
  "ONSITE",
  "FINAL_ROUND",
  "OTHER",
]);

const resultEnum = z.enum(["PENDING", "PASSED", "FAILED", "CANCELLED", "NO_SHOW"]);

const nullableString = z
  .string()
  .trim()
  .max(10000)
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v));

const nullableDate = z
  .union([z.string(), z.date()])
  .optional()
  .nullable()
  .transform((v) => (v ? new Date(v) : null));

export const interviewInputSchema = z.object({
  applicationId: z.string().min(1),
  stage: stageEnum.optional(),
  scheduledAt: nullableDate,
  interviewer: nullableString,
  meetingURL: nullableString,
  notes: nullableString,
  questionsAsked: nullableString,
  myAnswers: nullableString,
  followUpRequired: z.boolean().optional(),
  result: resultEnum.optional(),
});

export const interviewUpdateSchema = interviewInputSchema.partial().omit({
  applicationId: true,
});
