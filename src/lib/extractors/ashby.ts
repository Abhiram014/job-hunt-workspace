import * as cheerio from "cheerio";
import type { JobExtractor, ExtractedJob } from "./types";
import { extractFromJsonLd } from "./json-ld";

// Ashby job pages are heavily client-rendered. Ashby embeds the posting data
// as window.__appData = {...} in a <script> tag for hydration, which we can
// read without executing JS. Falls back to JSON-LD / generic meta tags when
// that shape isn't found (Ashby's internal API is not stable/public).
export class AshbyExtractor implements JobExtractor {
  name = "AshbyExtractor";

  matches(url: URL): boolean {
    return url.hostname.includes("ashbyhq.com");
  }

  extract(html: string, _url: URL): ExtractedJob {
    const appData = extractAppData(html);
    if (appData) {
      const posting = findJobPosting(appData);
      if (posting) {
        return {
          company: posting.organizationName,
          jobTitle: posting.title,
          location: posting.location,
          jobDescription: posting.descriptionPlain || posting.descriptionHtml,
          employmentType: mapEmploymentType(posting.employmentType),
          jobPostingID: posting.id,
          source: "ASHBY",
        };
      }
    }

    const fromJsonLd = extractFromJsonLd(html, "ASHBY");
    if (fromJsonLd?.jobTitle) return fromJsonLd;

    const $ = cheerio.load(html);
    return {
      jobTitle: $('meta[property="og:title"]').attr("content") || $("title").text() || undefined,
      company: $('meta[property="og:site_name"]').attr("content") || undefined,
      jobDescription: $('meta[property="og:description"]').attr("content") || undefined,
      source: "ASHBY",
    };
  }
}

interface AshbyPosting {
  id?: string;
  title?: string;
  location?: string;
  organizationName?: string;
  descriptionPlain?: string;
  descriptionHtml?: string;
  employmentType?: string;
}

function extractAppData(html: string): unknown {
  const match = html.match(/window\.__appData\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function findJobPosting(data: unknown): AshbyPosting | null {
  if (!data || typeof data !== "object") return null;
  const node = data as Record<string, unknown>;

  const direct = node.jobPosting;
  if (direct && typeof direct === "object") return direct as AshbyPosting;

  const nested = (node.posting ?? node.jobPostingDetail) as AshbyPosting | undefined;
  if (nested && typeof nested === "object") return nested;

  return null;
}

function mapEmploymentType(value?: string): ExtractedJob["employmentType"] {
  if (!value) return undefined;
  const v = value.toUpperCase();
  if (v.includes("FULL")) return "FULL_TIME";
  if (v.includes("PART")) return "PART_TIME";
  if (v.includes("INTERN")) return "INTERNSHIP";
  if (v.includes("CONTRACT")) return "CONTRACT";
  if (v.includes("TEMP")) return "TEMPORARY";
  return undefined;
}
