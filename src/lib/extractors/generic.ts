import * as cheerio from "cheerio";
import type { JobExtractor, ExtractedJob } from "./types";
import { extractFromJsonLd } from "./json-ld";

// Fallback extractor: tries JSON-LD JobPosting data, then falls back to
// generic meta tags. Always matches (last resort).
export class GenericExtractor implements JobExtractor {
  matches(): boolean {
    return true;
  }

  extract(html: string, _url: URL): ExtractedJob {
    const fromJsonLd = extractFromJsonLd(html, "OTHER");
    if (fromJsonLd && (fromJsonLd.jobTitle || fromJsonLd.jobDescription)) {
      return fromJsonLd;
    }

    const $ = cheerio.load(html);
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const ogDescription = $('meta[property="og:description"]').attr("content");
    const ogSiteName = $('meta[property="og:site_name"]').attr("content");
    const title = ogTitle || $("title").first().text() || undefined;

    return {
      jobTitle: title,
      company: ogSiteName,
      jobDescription: ogDescription || undefined,
      source: "OTHER",
    };
  }
}
