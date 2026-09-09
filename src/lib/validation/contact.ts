import { z } from "zod";

const contactTypeEnum = z.enum([
  "RECRUITER",
  "HIRING_MANAGER",
  "REFERRAL",
  "EMPLOYEE",
  "ALUMNI",
  "FRIEND",
  "OTHER",
]);

const nullableString = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v));

const nullableDate = z
  .union([z.string(), z.date()])
  .optional()
  .nullable()
  .transform((v) => (v ? new Date(v) : null));

export const contactInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  company: nullableString,
  jobTitle: nullableString,
  linkedinURL: nullableString,
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Invalid email"),
  relationship: nullableString,
  contactType: contactTypeEnum.optional(),
  notes: nullableString,
  lastContactedAt: nullableDate,
  followUpDate: nullableDate,
  applicationId: z.string().optional().nullable(),
});

export const contactUpdateSchema = contactInputSchema.omit({ applicationId: true }).partial();
