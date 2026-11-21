import {
  AIProvider,
  AIProviderId,
  GenerateReviewDraftInput,
  GenerateReviewDraftOutput,
} from "./provider.interface";
import { OpenAIProvider } from "./openai.provider";
import { GeminiProvider } from "./gemini.provider";
import { trackAiUsage } from "./usage-tracker";
import { writeInstantDraft } from "@/lib/reviews/instant-draft";

export class AIRouter {
  private providers: Map<AIProviderId, AIProvider> = new Map();

  constructor(customProviders?: AIProvider[]) {
    if (customProviders && customProviders.length > 0) {
      customProviders.forEach((p) => this.providers.set(p.id, p));
    } else {
      this.providers.set("gemini", new GeminiProvider());
      this.providers.set("openai", new OpenAIProvider());
    }
  }

  /** Local draft used for instant reviews and whenever AI is unavailable. */
  public generateSafeFallbackDraft(input: GenerateReviewDraftInput): GenerateReviewDraftOutput {
    const { shopName, rating, chips, language, style } = input;

    return {
      draftText: writeInstantDraft({ shopName, rating, chips, language }),
      headline: `Review for ${shopName}`,
      provider: "fallback",
      model: "safe-template-fallback",
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
      style,
      language,
      isFallback: true,
    };
  }

  /**
   * Routes the review draft generation request through preferred provider with automatic fallback.
   */
  async generateReviewDraft(
    input: GenerateReviewDraftInput,
    options?: {
      preferredProvider?: AIProviderId;
      enableFallback?: boolean;
    }
  ): Promise<GenerateReviewDraftOutput> {
    const defaultProviderEnv = (process.env.DEFAULT_AI_PROVIDER || "gemini") as AIProviderId;
    const preferredProvider: AIProviderId =
      options?.preferredProvider || defaultProviderEnv || "gemini";
    const enableFallback =
      options?.enableFallback ?? process.env.ENABLE_AI_FALLBACK !== "false";

    const primaryProvider = this.providers.get(preferredProvider);
    const secondaryProviderId: AIProviderId = preferredProvider === "gemini" ? "openai" : "gemini";
    const secondaryProvider = this.providers.get(secondaryProviderId);

    // 1. Attempt Primary Provider
    if (primaryProvider && primaryProvider.isConfigured()) {
      try {
        const result = await primaryProvider.generateReviewDraft(input);

        // Record successful usage
        await trackAiUsage({
          shopId: input.shopId,
          sessionId: input.sessionId,
          provider: primaryProvider.id,
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          latencyMs: result.latencyMs,
          status: "SUCCESS",
        });

        return result;
      } catch (primaryError) {
        console.warn(
          `[AIRouter] Primary provider ${preferredProvider} failed:`,
          (primaryError as Error).message
        );

        // Record failed attempt
        await trackAiUsage({
          shopId: input.shopId,
          sessionId: input.sessionId,
          provider: primaryProvider.id,
          model: primaryProvider.getDefaultModel(),
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: 0,
          status: "FAILED",
          errorMessage: (primaryError as Error).message,
        });

        // If fallback disabled, rethrow
        if (!enableFallback) {
          throw primaryError;
        }
      }
    }

    // 2. Attempt Secondary Provider (Fallback)
    if (enableFallback && secondaryProvider && secondaryProvider.isConfigured()) {
      try {
        console.info(`[AIRouter] Attempting secondary provider fallback: ${secondaryProviderId}`);
        const result = await secondaryProvider.generateReviewDraft(input);

        await trackAiUsage({
          shopId: input.shopId,
          sessionId: input.sessionId,
          provider: secondaryProvider.id,
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          latencyMs: result.latencyMs,
          status: "FALLBACK",
        });

        return {
          ...result,
          isFallback: true,
        };
      } catch (secondaryError) {
        console.warn(
          `[AIRouter] Secondary provider ${secondaryProviderId} failed:`,
          (secondaryError as Error).message
        );

        await trackAiUsage({
          shopId: input.shopId,
          sessionId: input.sessionId,
          provider: secondaryProvider.id,
          model: secondaryProvider.getDefaultModel(),
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: 0,
          status: "FAILED",
          errorMessage: (secondaryError as Error).message,
        });
      }
    }

    // 3. Both external AI providers failed or unconfigured -> Safe structured fallback
    console.warn("[AIRouter] All external AI providers failed or unconfigured. Serving safe fallback draft.");
    const safeFallback = this.generateSafeFallbackDraft(input);

    await trackAiUsage({
      shopId: input.shopId,
      sessionId: input.sessionId,
      provider: "fallback",
      model: safeFallback.model,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: safeFallback.latencyMs,
      status: "FALLBACK",
      errorMessage: "All external providers failed or unconfigured",
    });

    return safeFallback;
  }
}

export const aiRouter = new AIRouter();
