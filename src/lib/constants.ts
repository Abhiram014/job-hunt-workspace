import type {
  ApplicationStatus,
  WorkMode,
  EmploymentType,
  JobSource,
  NoteCategory,
  ContactType,
  InterviewStage,
  InterviewResult,
} from "@prisma/client";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
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
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  PREPARING: "Preparing",
  APPLIED: "Applied",
  ONLINE_ASSESSMENT: "Online Assessment",
  RECRUITER_SCREEN: "Recruiter Screen",
  TECHNICAL_INTERVIEW: "Technical Interview",
  HIRING_MANAGER_INTERVIEW: "Hiring Manager Interview",
  ONSITE_FINAL_ROUND: "Onsite / Final Round",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

// Tailwind classes per status for badges / kanban columns.
export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  SAVED: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
  PREPARING: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30",
  APPLIED: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
  ONLINE_ASSESSMENT: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30",
  RECRUITER_SCREEN: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30",
  TECHNICAL_INTERVIEW: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  HIRING_MANAGER_INTERVIEW: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
  ONSITE_FINAL_ROUND: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 dark:border-fuchsia-500/30",
  OFFER: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  REJECTED: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
  WITHDRAWN: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-500/10 dark:text-neutral-400 dark:border-neutral-500/20",
};

export const KANBAN_COLUMNS: ApplicationStatus[] = [
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
];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  ONSITE: "Onsite",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
  TEMPORARY: "Temporary",
};

export const JOB_SOURCE_LABELS: Record<JobSource, string> = {
  LINKEDIN: "LinkedIn",
  GREENHOUSE: "Greenhouse",
  LEVER: "Lever",
  ASHBY: "Ashby",
  WORKDAY: "Workday",
  INDEED: "Indeed",
  COMPANY_SITE: "Company Website",
  REFERRAL: "Referral",
  MANUAL: "Manual Entry",
  OTHER: "Other",
};

export const NOTE_CATEGORY_LABELS: Record<NoteCategory, string> = {
  GENERAL: "General",
  REFERRAL: "Referral",
  RECRUITER: "Recruiter",
  INTERVIEW: "Interview",
  FOLLOW_UP: "Follow-up",
  RESEARCH: "Research",
};

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  RECRUITER: "Recruiter",
  HIRING_MANAGER: "Hiring Manager",
  REFERRAL: "Referral",
  EMPLOYEE: "Employee",
  ALUMNI: "Alumni",
  FRIEND: "Friend",
  OTHER: "Other",
};

export const INTERVIEW_STAGE_LABELS: Record<InterviewStage, string> = {
  RECRUITER_SCREEN: "Recruiter Screen",
  TECHNICAL_SCREEN: "Technical Screen",
  CODING_ASSESSMENT: "Coding Assessment",
  HIRING_MANAGER: "Hiring Manager",
  BEHAVIORAL: "Behavioral",
  SYSTEM_DESIGN: "System Design",
  ONSITE: "Onsite",
  FINAL_ROUND: "Final Round",
  OTHER: "Other",
};

export const INTERVIEW_RESULT_LABELS: Record<InterviewResult, string> = {
  PENDING: "Pending",
  PASSED: "Passed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};

export const STATUSES_COUNTING_AS_INTERVIEW: ApplicationStatus[] = [
  "ONLINE_ASSESSMENT",
  "RECRUITER_SCREEN",
  "TECHNICAL_INTERVIEW",
  "HIRING_MANAGER_INTERVIEW",
  "ONSITE_FINAL_ROUND",
];
