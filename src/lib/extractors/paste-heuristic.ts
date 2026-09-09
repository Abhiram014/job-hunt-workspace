import type { ExtractedJob } from "./types";

// Lightweight heuristic parser for a pasted job description, used until the
// AI-backed JD parser (Phase 2) is wired up. Looks for common label patterns
// line-by-line; falls back to leaving fields blank for the user to fill in.
export function extractFromPastedText(rawText: string): ExtractedJob {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const jobTitle = lines[0]?.slice(0, 200);

  const findLabel = (labels: string[]): string | undefined => {
    for (const line of lines.slice(0, 30)) {
      for (const label of labels) {
        const re = new RegExp(`^${label}\\s*[:\\-]\\s*(.+)$`, "i");
        const match = line.match(re);
        if (match) return match[1].trim();
      }
    }
    return undefined;
  };

  const location = findLabel(["location", "based in"]);
  const company = findLabel(["company", "organization", "employer"]);

  const employmentTypeRaw = findLabel(["employment type", "job type"]);
  const employmentType = mapEmploymentType(employmentTypeRaw);

  const workModeRaw = findLabel(["work mode", "workplace type", "arrangement"]);
  const workMode = mapWorkMode(workModeRaw || rawText);

  const salary = extractSalary(rawText);

  return {
    jobTitle,
    company,
    location,
    employmentType,
    workMode,
    jobDescription: rawText.trim(),
    salaryMin: salary?.min,
    salaryMax: salary?.max,
    salaryCurrency: salary?.currency,
    source: "OTHER",
  };
}

function mapEmploymentType(value?: string): ExtractedJob["employmentType"] {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v.includes("full")) return "FULL_TIME";
  if (v.includes("part")) return "PART_TIME";
  if (v.includes("intern")) return "INTERNSHIP";
  if (v.includes("contract")) return "CONTRACT";
  if (v.includes("temp")) return "TEMPORARY";
  return undefined;
}

function mapWorkMode(value: string): ExtractedJob["workMode"] {
  const v = value.toLowerCase();
  if (v.includes("remote")) return "REMOTE";
  if (v.includes("hybrid")) return "HYBRID";
  if (v.includes("onsite") || v.includes("on-site") || v.includes("in office")) return "ONSITE";
  return undefined;
}

function extractSalary(
  text: string
): { min?: number; max?: number; currency?: string } | undefined {
  const match = text.match(/\$\s?([\d,]{2,7})(?:k)?\s*(?:-|to)\s*\$?\s?([\d,]{2,7})(?:k)?/i);
  if (!match) return undefined;

  const parse = (raw: string) => {
    const cleaned = raw.replace(/,/g, "");
    const isThousands = text.slice(match.index, match.index! + match[0].length).toLowerCase().includes("k");
    const value = parseInt(cleaned, 10);
    return isThousands && value < 1000 ? value * 1000 : value;
  };

  return { min: parse(match[1]), max: parse(match[2]), currency: "USD" };
}
