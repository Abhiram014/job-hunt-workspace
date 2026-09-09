import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type {
  LLMProvider,
  AnalyzeMatchParams,
  TailorResumeParams,
  ChatParams,
  MatchAnalysis,
  TailorResult,
} from "./provider";
import { matchAnalysisSchema, tailorResultSchema } from "./provider";
import {
  MATCH_ANALYSIS_SYSTEM,
  TAILOR_RESUME_SYSTEM,
  CHAT_SYSTEM_BASE,
  buildJobContext,
} from "./prompts";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";
const MAX_TOKENS = 16000;

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async analyzeMatch(params: AnalyzeMatchParams): Promise<MatchAnalysis> {
    const jobContext = buildJobContext(params);
    const response = await this.client.messages.parse({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: MATCH_ANALYSIS_SYSTEM,
      output_config: {
        format: zodOutputFormat(matchAnalysisSchema),
        effort: "medium",
      },
      messages: [
        {
          role: "user",
          content: `${jobContext}\n\n---\n\nCandidate's resume:\n${params.resumeText}`,
        },
      ],
    });

    if (!response.parsed_output) {
      throw new Error("The AI response could not be parsed. Please try again.");
    }
    return response.parsed_output;
  }

  async tailorResume(params: TailorResumeParams): Promise<TailorResult> {
    const jobContext = buildJobContext(params);
    const response = await this.client.messages.parse({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: TAILOR_RESUME_SYSTEM,
      output_config: {
        format: zodOutputFormat(tailorResultSchema),
        effort: "high",
      },
      messages: [
        {
          role: "user",
          content: `${jobContext}\n\n---\n\nCandidate's current resume (tailor this):\n${params.resumeText}`,
        },
      ],
    });

    if (!response.parsed_output) {
      throw new Error("The AI response could not be parsed. Please try again.");
    }

    // Defense in depth: the model is instructed to quote verbatim, but drop
    // any change whose "original" doesn't actually appear in the source text
    // rather than trusting it blindly - a bad anchor would corrupt the diff.
    const validChanges = response.parsed_output.changes.filter((c) =>
      params.resumeText.includes(c.original)
    );

    return { ...response.parsed_output, changes: validChanges };
  }

  async chat(params: ChatParams): Promise<string> {
    let system = CHAT_SYSTEM_BASE;
    if (params.context) {
      const { jobTitle, company, jobDescription, resumeText } = params.context;
      const contextParts: string[] = [];
      if (jobTitle || company) {
        contextParts.push(`Application in context: ${jobTitle ?? "Unknown role"} at ${company ?? "Unknown company"}`);
      }
      if (jobDescription) contextParts.push(`Job Description:\n${jobDescription}`);
      if (resumeText) contextParts.push(`Candidate's resume:\n${resumeText}`);
      if (contextParts.length) {
        system += `\n\n---\n\n${contextParts.join("\n\n")}`;
      }
    }

    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      output_config: { effort: "medium" },
      messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("The AI did not return a text response. Please try again.");
    }
    return textBlock.text;
  }
}
