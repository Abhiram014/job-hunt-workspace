import type { JobSource } from "@prisma/client";

export interface ExtractedJob {
  company?: string;
  jobTitle?: string;
  location?: string;
  workMode?: "ONSITE" | "HYBRID" | "REMOTE";
  employmentType?: "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT" | "TEMPORARY";
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobDescription?: string;
  requirements?: string;
  preferredQualifications?: string;
  skills?: string;
  jobPostingID?: string;
  source: JobSource;
}

export interface JobExtractor {
  /** Stable identifier — don't rely on constructor.name, which minifiers rename in production. */
  name: string;
  /** Returns true if this extractor knows how to handle the given URL. */
  matches(url: URL): boolean;
  /** Parses raw HTML (and the source URL) into structured job fields. */
  extract(html: string, url: URL): ExtractedJob;
}
