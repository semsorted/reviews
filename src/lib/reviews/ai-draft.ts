import { GeminiProvider } from "@/lib/ai/gemini.provider";
import { chatProvider } from "@/lib/ai/chat-providers";
import type { AIProvider, ReviewLanguage } from "@/lib/ai/provider.interface";
import { trackAiUsage } from "@/lib/ai/usage-tracker";
import { prisma } from "@/lib/prisma";
import { AI_DRAFT_TIMEOUT_MS, MAX_AI_DRAFTS_PER_SESSION, MAX_AI_DRAFTS_PER_SHOP_PER_DAY } from "./rules";
import { isSafeAiDraft } from "./unique-draft";

type AiDraftInput = {
  shopId: string;
  sessionId: string;
  shopName: string;
  businessCategory: string;
  rating: number;
  chips: string[];
  language: ReviewLanguage;
};

// Providers are tried in this order. A provider with no key is skipped, so adding a key is all it takes to switch one on.
const ORDER = () => (process.env.AI_PROVIDERS ?? "gemini,cloudflare,groq,openrouter,openai").split(",").map((id) => id.trim()).filter(Boolean);
const TOTAL_BUDGET_MS = 9000;

// ponytail: remembered per server instance only. Move to the database if instances need to share it.
const pausedUntil = new Map<string, number>();
export const resetPausedProviders = () => pausedUntil.clear();
const QUOTA = /\b429\b|RESOURCE_EXHAUSTED|quota|rate limit/i;

export function configuredProviders(): [string, AIProvider][] {
  return ORDER().flatMap((id): [string, AIProvider][] => {
    const provider = id === "gemini" ? new GeminiProvider() : chatProvider(id);
    return provider?.isConfigured() ? [[id, provider]] : [];
  });
}

/** Returns an AI draft from the first provider that works, or null so the caller can keep the customer moving without AI. */
export async function writeAiDraft(input: AiDraftInput): Promise<{ text: string; model: string; provider: string } | null> {
  const providers = configuredProviders();
  if (!providers.length) return null;

  // ponytail: counts can overrun by a few under a burst; move into the shop lock if quota gets tight.
  const [sessionCalls, shopCalls] = await Promise.all([
    prisma.aiUsageLog.count({ where: { sessionId: input.sessionId, status: "SUCCESS" } }),
    prisma.aiUsageLog.count({ where: { shopId: input.shopId, status: "SUCCESS", createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
  ]);
  if (sessionCalls >= MAX_AI_DRAFTS_PER_SESSION || shopCalls >= MAX_AI_DRAFTS_PER_SHOP_PER_DAY) return null;

  const started = Date.now();
  // With several providers the next one is the retry. A lone provider gets a second try.
  const attempts = Math.min(providers.length === 1 ? 2 : 1, MAX_AI_DRAFTS_PER_SESSION - sessionCalls);
  for (const [id, provider] of providers) {
    if ((pausedUntil.get(id) ?? 0) > Date.now()) continue;
    const usage = { shopId: input.shopId, sessionId: input.sessionId, provider: id as never };
    let failure = "";
    for (let attempt = 0; attempt < attempts && !QUOTA.test(failure) && Date.now() - started < TOTAL_BUDGET_MS; attempt++) {
      try {
        const result = await provider.generateReviewDraft({ ...input, style: "natural", temperature: 1, timeoutMs: AI_DRAFT_TIMEOUT_MS });
        const safe = isSafeAiDraft(result.draftText, input.rating, input.shopName);
        await trackAiUsage({ ...usage, model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens, latencyMs: result.latencyMs, status: safe ? "SUCCESS" : "FAILED", errorMessage: safe ? undefined : "Draft rejected by the safety check" });
        if (safe) return { text: result.draftText, model: result.model, provider: id };
        failure = "unsafe draft";
      } catch (error) {
        failure = error instanceof Error ? error.message : `${id} failed`;
        await trackAiUsage({ ...usage, model: provider.getDefaultModel(), inputTokens: 0, outputTokens: 0, latencyMs: 0, status: "FAILED", errorMessage: failure.slice(0, 300) });
      }
    }
    // A provider that kept failing is skipped for a while, longer when its free quota is used up.
    if (failure && failure !== "unsafe draft") pausedUntil.set(id, Date.now() + (QUOTA.test(failure) ? 600_000 : 60_000));
  }
  return null;
}
