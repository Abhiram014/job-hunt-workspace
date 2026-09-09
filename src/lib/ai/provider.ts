import { z } from "zod";

// Provider-agnostic types so a different LLM vendor can be dropped in later
// without touching call sites (see anthropic-provider.ts for the only
// concrete implementation today).

export const matchAnalysisSchema = z.object({
  matchScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Internal heuristic match estimate, 0-100. Not an official ATS score."),
  summary: z.string().describe("2-3 sentence overall assessment"),
  strongMatches: z.array(z.string()).describe("Skills/experience that clearly align with the job"),
  missingKeywords: z.array(z.string()).describe("Important JD keywords/skills absent from the resume"),
  weakAreas: z.array(z.string()).describe("Areas where the resume is present but underdeveloped for this role"),
  requiredSkillsCoverage: z
    .array(z.object({ skill: z.string(), covered: z.boolean() }))
    .describe("Each required skill from the JD and whether the resume demonstrates it"),
  preferredSkillsCoverage: z
    .array(z.object({ skill: z.string(), covered: z.boolean() }))
    .describe("Each preferred/nice-to-have skill from the JD and whether the resume demonstrates it"),
  experienceAlignment: z.string().describe("How well the candidate's experience level/domain matches"),
  educationAlignment: z.string().describe("How well education requirements are met, or 'Not specified' if the JD doesn't mention any"),
  projectsAlignment: z.string().describe("How relevant any projects are to this role"),
});
export type MatchAnalysis = z.infer<typeof matchAnalysisSchema>;

export const tailorResultSchema = z.object({
  summary: z.string().describe("1-2 sentence summary of the overall tailoring approach"),
  changes: z
    .array(
      z.object({
        original: z
          .string()
          .describe("The exact, verbatim substring from the original resume text being replaced"),
        suggested: z.string().describe("The improved replacement text"),
        rationale: z.string().describe("One sentence on why this change helps for this specific job"),
      })
    )
    .describe("Proposed bullet/line-level edits. Each must be a truthful rewording, not a new claim."),
});
export type TailorResult = z.infer<typeof tailorResultSchema>;

export interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

export interface AnalyzeMatchParams {
  resumeText: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  requirements?: string | null;
  preferredQualifications?: string | null;
  skills?: string | null;
}

export type TailorResumeParams = AnalyzeMatchParams;

export interface ChatParams {
  messages: ChatMessageInput[];
  context?: {
    jobTitle?: string;
    company?: string;
    jobDescription?: string;
    resumeText?: string;
  };
}

export interface LLMProvider {
  analyzeMatch(params: AnalyzeMatchParams): Promise<MatchAnalysis>;
  tailorResume(params: TailorResumeParams): Promise<TailorResult>;
  chat(params: ChatParams): Promise<string>;
}
