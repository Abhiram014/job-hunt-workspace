// Simple in-memory sliding-window rate limiter for AI endpoints. Good enough
// for a single-instance deployment; a multi-instance production deployment
// would need a shared store (e.g. Redis/Upstash) instead.
const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

const hits = new Map<string, number[]>();

export class RateLimitError extends Error {}

export function checkAIRateLimit(userId: string): void {
  const now = Date.now();
  const existing = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);

  if (existing.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new RateLimitError(
      "You've hit the AI request limit for now. Please wait a few minutes and try again."
    );
  }

  existing.push(now);
  hits.set(userId, existing);
}
