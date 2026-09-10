import * as cheerio from "cheerio";
import type { JobExtractor, ExtractedJob } from "./types";
import { extractFromJsonLd } from "./json-ld";

// Fallback extractor: tries JSON-LD JobPosting data, then falls back to
// generic meta tags. Always matches (last resort).
export class GenericExtractor implements JobExtractor {
  name = "GenericExtractor";

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

    // Client-rendered SPAs (React/Vue job boards with no server-side
    // rendering) often leave only company-wide OG tags in the static HTML —
    // the same title/description on every job posting for that company, not
    // this job's actual content. Treating that as a "description" would look
    // like a successful extraction when nothing job-specific was found at
    // all, so drop it rather than pass along a duplicate of the title.
    const description = ogDescription && ogDescription !== title ? ogDescription : undefined;

    return {
      jobTitle: title,
      company: ogSiteName,
      jobDescription: description,
      source: "OTHER",
    };
  }
}
