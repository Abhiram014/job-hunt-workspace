import { assertSafeExternalUrl, UnsafeUrlError } from "@/lib/security/url-guard";
import { GreenhouseExtractor } from "./greenhouse";
import { LeverExtractor } from "./lever";
import { AshbyExtractor } from "./ashby";
import { GenericExtractor } from "./generic";
import type { ExtractedJob, JobExtractor } from "./types";

export type { ExtractedJob };

// Order matters: specific extractors first, GenericExtractor (matches
// everything) last.
const EXTRACTORS: JobExtractor[] = [
  new GreenhouseExtractor(),
  new LeverExtractor(),
  new AshbyExtractor(),
  new GenericExtractor(),
];

export interface ImportResult {
  extractedJob: ExtractedJob;
  extractorUsed: string;
  rawHTML: string;
}

export async function importJobFromUrl(rawUrl: string): Promise<ImportResult> {
  let url: URL;
  try {
    url = await assertSafeExternalUrl(rawUrl);
  } catch (err) {
    if (err instanceof UnsafeUrlError) {
      throw new Error(`This URL cannot be imported: ${err.message}`);
    }
    throw err;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let html: string;
  try {
    const res = await fetch(url.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; JobHuntWorkspace/1.0; +https://localhost)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      throw new Error(`The job posting page returned ${res.status}`);
    }
    html = await res.text();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Timed out fetching the job posting page");
    }
    throw err instanceof Error ? err : new Error("Failed to fetch job posting page");
  } finally {
    clearTimeout(timeout);
  }

  const extractor = EXTRACTORS.find((e) => e.matches(url))!;
  const extractedJob = extractor.extract(html, url);

  return {
    extractedJob,
    extractorUsed: extractor.constructor.name,
    rawHTML: html.slice(0, 500_000), // cap stored HTML size
  };
}
