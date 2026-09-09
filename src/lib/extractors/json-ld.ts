import * as cheerio from "cheerio";
import type { ExtractedJob } from "./types";
import type { JobSource } from "@prisma/client";

// Many ATS pages (Greenhouse, Lever, Workday, company sites) embed schema.org
// JobPosting JSON-LD for SEO. This is the single most reliable generic signal
// we can extract without executing JavaScript.
export function extractFromJsonLd(html: string, source: JobSource): ExtractedJob | null {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]');

  for (const el of scripts.toArray()) {
    const raw = $(el).contents().text();
    if (!raw) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }

    const candidates = Array.isArray(parsed) ? parsed : [parsed];
    for (const candidate of candidates) {
      const node = candidate as Record<string, unknown>;
      if (node?.["@type"] !== "JobPosting") continue;

      const title = typeof node.title === "string" ? node.title : undefined;
      const description =
        typeof node.description === "string"
          ? stripHtml(node.description)
          : undefined;

      const org = node.hiringOrganization as { name?: string } | undefined;
      const company = org?.name;

      const location = extractLocation(node.jobLocation);
      const employmentType = mapEmploymentType(node.employmentType);
      const { min, max, currency } = extractSalary(node.baseSalary);

      return {
        company,
        jobTitle: title,
        jobDescription: description,
        location,
        employmentType,
        salaryMin: min,
        salaryMax: max,
        salaryCurrency: currency,
        source,
      };
    }
  }

  return null;
}

function stripHtml(input: string): string {
  return cheerio
    .load(`<div>${input}</div>`)("div")
    .text()
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractLocation(jobLocation: unknown): string | undefined {
  const node = Array.isArray(jobLocation) ? jobLocation[0] : jobLocation;
  const address = (node as { address?: Record<string, unknown> })?.address;
  if (!address) return undefined;
  const parts = [
    address.addressLocality,
    address.addressRegion,
    address.addressCountry,
  ].filter((p) => typeof p === "string");
  return parts.length ? parts.join(", ") : undefined;
}

function mapEmploymentType(
  value: unknown
): ExtractedJob["employmentType"] {
  const v = String(Array.isArray(value) ? value[0] : value ?? "").toUpperCase();
  if (v.includes("FULL")) return "FULL_TIME";
  if (v.includes("PART")) return "PART_TIME";
  if (v.includes("INTERN")) return "INTERNSHIP";
  if (v.includes("CONTRACT")) return "CONTRACT";
  if (v.includes("TEMP")) return "TEMPORARY";
  return undefined;
}

function extractSalary(baseSalary: unknown): {
  min?: number;
  max?: number;
  currency?: string;
} {
  const node = baseSalary as
    | { currency?: string; value?: Record<string, unknown> }
    | undefined;
  if (!node?.value) return {};
  const value = node.value;
  const min = typeof value.minValue === "number" ? value.minValue : undefined;
  const max = typeof value.maxValue === "number" ? value.maxValue : undefined;
  const single = typeof value.value === "number" ? value.value : undefined;
  return {
    min: min ?? single,
    max: max ?? single,
    currency: node.currency,
  };
}
