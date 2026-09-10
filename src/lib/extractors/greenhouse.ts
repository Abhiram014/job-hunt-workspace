import * as cheerio from "cheerio";
import type { JobExtractor, ExtractedJob } from "./types";
import { extractFromJsonLd } from "./json-ld";

export class GreenhouseExtractor implements JobExtractor {
  name = "GreenhouseExtractor";

  matches(url: URL): boolean {
    return (
      url.hostname.includes("greenhouse.io") ||
      url.hostname.includes("boards.greenhouse.io") ||
      url.hostname.includes("job-boards.greenhouse.io")
    );
  }

  extract(html: string, url: URL): ExtractedJob {
    const fromJsonLd = extractFromJsonLd(html, "GREENHOUSE");
    const $ = cheerio.load(html);

    const jobTitle =
      fromJsonLd?.jobTitle ||
      $("h1.app-title").first().text().trim() ||
      $('[class*="job-title"]').first().text().trim() ||
      undefined;

    const company =
      fromJsonLd?.company ||
      $(".company-name").first().text().trim().replace(/^at\s+/i, "") ||
      undefined;

    const location =
      fromJsonLd?.location ||
      $(".location").first().text().trim() ||
      $('[class*="job__location"]').first().text().trim() ||
      undefined;

    const jobDescription =
      fromJsonLd?.jobDescription ||
      $("#content").first().text().trim() ||
      $('[class*="job__description"]').first().text().trim() ||
      undefined;

    const idMatch = url.pathname.match(/\/jobs\/(\d+)/);

    return {
      company,
      jobTitle,
      location,
      jobDescription,
      jobPostingID: idMatch?.[1],
      salaryMin: fromJsonLd?.salaryMin,
      salaryMax: fromJsonLd?.salaryMax,
      salaryCurrency: fromJsonLd?.salaryCurrency,
      employmentType: fromJsonLd?.employmentType,
      source: "GREENHOUSE",
    };
  }
}
