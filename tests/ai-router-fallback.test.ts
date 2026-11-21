import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIRouter } from "@/lib/ai/ai-router";
import {
  AIProvider,
  GenerateReviewDraftInput,
  GenerateReviewDraftOutput,
} from "@/lib/ai/provider.interface";

// Mock trackAiUsage to avoid attempting live DB connection in unit test
vi.mock("@/lib/ai/usage-tracker", () => ({
  trackAiUsage: vi.fn().mockResolvedValue(undefined),
  calculateEstimatedCost: vi.fn().mockReturnValue(0.0001),
}));

import { trackAiUsage } from "@/lib/ai/usage-tracker";

describe("AIRouter & Fallback Engine", () => {
  const sampleInput: GenerateReviewDraftInput = {
    shopId: "test-shop-id",
    shopName: "Sunset Cafe",
    businessCategory: "Coffee Shop",
    rating: 5,
    chips: ["Cold brew", "Patio"],
    style: "natural",
    language: "en",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses primary provider when it succeeds", async () => {
    const mockPrimary: AIProvider = {
      id: "gemini",
      isConfigured: () => true,
      getDefaultModel: () => "gemini-1.5-flash",
      generateReviewDraft: vi.fn().mockResolvedValue({
        draftText: "Enjoyed my visit to Sunset Cafe. The cold brew was very smooth.",
        headline: "Great cold brew",
        provider: "gemini",
        model: "gemini-1.5-flash",
        inputTokens: 120,
        outputTokens: 45,
        latencyMs: 350,
        style: "natural",
        language: "en",
        isFallback: false,
      } as GenerateReviewDraftOutput),
    };

    const mockSecondary: AIProvider = {
      id: "openai",
      isConfigured: () => true,
      getDefaultModel: () => "gpt-4o-mini",
      generateReviewDraft: vi.fn(),
    };

    const router = new AIRouter([mockPrimary, mockSecondary]);
    const result = await router.generateReviewDraft(sampleInput, {
      preferredProvider: "gemini",
    });

    expect(result.provider).toBe("gemini");
    expect(result.isFallback).toBe(false);
    expect(mockPrimary.generateReviewDraft).toHaveBeenCalledTimes(1);
    expect(mockSecondary.generateReviewDraft).not.toHaveBeenCalled();
    expect(trackAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "SUCCESS",
        provider: "gemini",
      })
    );
  });

  it("falls back to secondary provider when primary fails", async () => {
    const mockFailingPrimary: AIProvider = {
      id: "gemini",
      isConfigured: () => true,
      getDefaultModel: () => "gemini-1.5-flash",
      generateReviewDraft: vi.fn().mockRejectedValue(new Error("Gemini quota exceeded 429")),
    };

    const mockSecondary: AIProvider = {
      id: "openai",
      isConfigured: () => true,
      getDefaultModel: () => "gpt-4o-mini",
      generateReviewDraft: vi.fn().mockResolvedValue({
        draftText: "Sunset Cafe has an amazing patio and the cold brew was spot on.",
        headline: "Relaxing patio",
        provider: "openai",
        model: "gpt-4o-mini",
        inputTokens: 140,
        outputTokens: 50,
        latencyMs: 510,
        style: "natural",
        language: "en",
        isFallback: false,
      } as GenerateReviewDraftOutput),
    };

    const router = new AIRouter([mockFailingPrimary, mockSecondary]);
    const result = await router.generateReviewDraft(sampleInput, {
      preferredProvider: "gemini",
      enableFallback: true,
    });

    expect(result.provider).toBe("openai");
    expect(result.isFallback).toBe(true);
    expect(mockFailingPrimary.generateReviewDraft).toHaveBeenCalledTimes(1);
    expect(mockSecondary.generateReviewDraft).toHaveBeenCalledTimes(1);
    expect(trackAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "FAILED",
        provider: "gemini",
      })
    );
    expect(trackAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "FALLBACK",
        provider: "openai",
      })
    );
  });

  it("produces safe neutral fallback draft when both providers fail", async () => {
    const mockFailingGemini: AIProvider = {
      id: "gemini",
      isConfigured: () => true,
      getDefaultModel: () => "gemini-1.5-flash",
      generateReviewDraft: vi.fn().mockRejectedValue(new Error("Network timeout")),
    };

    const mockFailingOpenAI: AIProvider = {
      id: "openai",
      isConfigured: () => true,
      getDefaultModel: () => "gpt-4o-mini",
      generateReviewDraft: vi.fn().mockRejectedValue(new Error("Service unavailable 503")),
    };

    const router = new AIRouter([mockFailingGemini, mockFailingOpenAI]);
    const result = await router.generateReviewDraft(sampleInput, {
      preferredProvider: "gemini",
      enableFallback: true,
    });

    expect(result.provider).toBe("fallback");
    expect(result.isFallback).toBe(true);
    expect(result.model).toBe("safe-template-fallback");
    // Verifies customer feedback is preserved in safe fallback
    expect(result.draftText.toLowerCase()).toContain("cold brew");
    expect(result.draftText.toLowerCase()).toContain("patio");
  });

  it("handles unconfigured providers gracefully with safe fallback", async () => {
    const unconfiguredGemini: AIProvider = {
      id: "gemini",
      isConfigured: () => false,
      getDefaultModel: () => "gemini-1.5-flash",
      generateReviewDraft: vi.fn(),
    };

    const unconfiguredOpenAI: AIProvider = {
      id: "openai",
      isConfigured: () => false,
      getDefaultModel: () => "gpt-4o-mini",
      generateReviewDraft: vi.fn(),
    };

    const router = new AIRouter([unconfiguredGemini, unconfiguredOpenAI]);
    const result = await router.generateReviewDraft(sampleInput);

    expect(result.provider).toBe("fallback");
    expect(result.isFallback).toBe(true);
    expect(result.draftText.length).toBeGreaterThan(10);
  });
});
