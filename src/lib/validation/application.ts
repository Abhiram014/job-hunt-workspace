import { z } from "zod";

const statusEnum = z.enum([
  "SAVED",
  "PREPARING",
  "APPLIED",
  "ONLINE_ASSESSMENT",
  "RECRUITER_SCREEN",
  "TECHNICAL_INTERVIEW",
  "HIRING_MANAGER_INTERVIEW",
  "ONSITE_FINAL_ROUND",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
]);

const workModeEnum = z.enum(["ONSITE", "HYBRID", "REMOTE"]);
const employmentTypeEnum = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "INTERNSHIP",
  "CONTRACT",
  "TEMPORARY",
]);
const sourceEnum = z.enum([
  "LINKEDIN",
  "GREENHOUSE",
  "LEVER",
  "ASHBY",
  "WORKDAY",
  "INDEED",
  "COMPANY_SITE",
  "REFERRAL",
  "MANUAL",
  "OTHER",
]);

const nullableString = z
  .string()
  .trim()
  .max(20000)
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v));

const nullableDate = z
  .union([z.string(), z.date()])
  .optional()
  .nullable()
  .transform((v) => (v ? new Date(v) : null));

export const applicationInputSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(200),
  jobTitle: z.string().trim().min(1, "Job title is required").max(200),
  companyLogo: nullableString,
  jobURL: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  jobPostingID: nullableString,
  location: nullableString,
  workMode: workModeEnum.optional().nullable(),
  employmentType: employmentTypeEnum.optional().nullable(),
  salaryMin: z.number().int().nonnegative().optional().nullable(),
  salaryMax: z.number().int().nonnegative().optional().nullable(),
  salaryCurrency: z.string().trim().max(10).optional().nullable(),
  jobDescription: nullableString,
  requirements: nullableString,
  preferredQualifications: nullableString,
  skills: nullableString,
  roleCategory: nullableString,
  dateFound: nullableDate,
  dateApplied: nullableDate,
  deadline: nullableDate,
  applicationStatus: statusEnum.optional(),
  source: sourceEnum.optional(),
});

export type ApplicationInput = z.infer<typeof applicationInputSchema>;

export const applicationUpdateSchema = applicationInputSchema.partial();

export const applicationStatusUpdateSchema = z.object({
  applicationStatus: statusEnum,
});
