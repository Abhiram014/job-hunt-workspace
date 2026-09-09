import { AnthropicProvider } from "./anthropic-provider";
import type { LLMProvider } from "./provider";

export class AIConfigError extends Error {}

// Provider factory: swap AnthropicProvider for another LLMProvider
// implementation here without touching any call site.
export function getAIProvider(): LLMProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AIConfigError(
      "AI features aren't configured yet. Add ANTHROPIC_API_KEY to your .env file and restart the server."
    );
  }
  return new AnthropicProvider(apiKey);
}

export * from "./provider";
