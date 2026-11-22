import { GeminiProvider } from "@/lib/ai/gemini.provider";
import type { ReviewLanguage } from "@/lib/ai/provider.interface";
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

/** Returns a Gemini draft, or null so the caller can keep the customer moving without AI. */
export async function writeGeminiDraft(input: AiDraftInput): Promise<{ text: string; model: string } | null> {
  const gemini = new GeminiProvider();
  if (!gemini.isConfigured()) return null;

  // ponytail: counts can overrun by a few under a burst; move into the shop lock if quota gets tight.
  const [sessionCalls, shopCalls] = await Promise.all([
    prisma.aiUsageLog.count({ where: { sessionId: input.sessionId, provider: "gemini" } }),
    prisma.aiUsageLog.count({ where: { shopId: input.shopId, provider: "gemini", createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
  ]);
  if (sessionCalls >= MAX_AI_DRAFTS_PER_SESSION || shopCalls >= MAX_AI_DRAFTS_PER_SHOP_PER_DAY) return null;

  const usage = { shopId: input.shopId, sessionId: input.sessionId, provider: "gemini" as const };
  const attempts = Math.min(2, MAX_AI_DRAFTS_PER_SESSION - sessionCalls);
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const result = await gemini.generateReviewDraft({ ...input, style: "natural", temperature: 1, timeoutMs: AI_DRAFT_TIMEOUT_MS });
      await trackAiUsage({ ...usage, model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens, latencyMs: result.latencyMs, status: "SUCCESS" });
      if (isSafeAiDraft(result.draftText, input.rating, input.shopName)) return { text: result.draftText, model: result.model };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gemini failed";
      await trackAiUsage({ ...usage, model: gemini.getDefaultModel(), inputTokens: 0, outputTokens: 0, latencyMs: 0, status: "FAILED", errorMessage: message.slice(0, 300) });
      if (/\b429\b|RESOURCE_EXHAUSTED/.test(message)) return null;
    }
  }
  return null;
}
