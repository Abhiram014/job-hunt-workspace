import * as cheerio from "cheerio";
import type { JobExtractor, ExtractedJob } from "./types";
import { extractFromJsonLd } from "./json-ld";

export class LeverExtractor implements JobExtractor {
  name = "LeverExtractor";

  matches(url: URL): boolean {
    return url.hostname.includes("lever.co");
  }

  extract(html: string, url: URL): ExtractedJob {
    const fromJsonLd = extractFromJsonLd(html, "LEVER");
    const $ = cheerio.load(html);

    const jobTitle =
      fromJsonLd?.jobTitle ||
      $(".posting-headline h2").first().text().trim() ||
      undefined;

    const company =
      fromJsonLd?.company ||
      url.hostname.split(".")[0] ||
      undefined;

    const location =
      fromJsonLd?.location ||
      $(".posting-categories .location").first().text().trim() ||
      undefined;

    const descriptionParts: string[] = [];
    $(".section-wrapper .section").each((_, el) => {
      const text = $(el).text().trim();
      if (text) descriptionParts.push(text);
    });

    const jobDescription =
      fromJsonLd?.jobDescription ||
      (descriptionParts.length ? descriptionParts.join("\n\n") : undefined);

    const commitment = $(".posting-categories .commitment").first().text().trim();
    const employmentType = mapCommitment(commitment) ?? fromJsonLd?.employmentType;

    const idMatch = url.pathname.match(/\/([a-f0-9-]{36})/i);

    return {
      company,
      jobTitle,
      location,
      jobDescription,
      jobPostingID: idMatch?.[1],
      employmentType,
      salaryMin: fromJsonLd?.salaryMin,
      salaryMax: fromJsonLd?.salaryMax,
      salaryCurrency: fromJsonLd?.salaryCurrency,
      source: "LEVER",
    };
  }
}

function mapCommitment(commitment: string): ExtractedJob["employmentType"] {
  const v = commitment.toLowerCase();
  if (v.includes("full")) return "FULL_TIME";
  if (v.includes("part")) return "PART_TIME";
  if (v.includes("intern")) return "INTERNSHIP";
  if (v.includes("contract")) return "CONTRACT";
  if (v.includes("temp")) return "TEMPORARY";
  return undefined;
}
