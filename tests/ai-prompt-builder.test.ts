import { describe, expect, it } from "vitest";
import { buildReviewPrompts } from "@/lib/ai/prompt-builder";
import { ReviewDraftOutputSchema, type GenerateReviewDraftInput } from "@/lib/ai/provider.interface";
import { AIRouter } from "@/lib/ai/ai-router";

const input = (overrides: Partial<GenerateReviewDraftInput> = {}): GenerateReviewDraftInput => ({
  shopId: "shop-1",
  shopName: "Sunset Cafe",
  businessCategory: "Coffee Shop",
  rating: 5,
  chips: ["Cold coffee", "Friendly staff"],
  style: "natural",
  language: "en",
  ...overrides,
});

describe("buildReviewPrompts", () => {
  it("includes only the shop, rating, and selected chips", () => {
    const { userPrompt } = buildReviewPrompts(input({ rating: 4 }));
    expect(userPrompt).toContain("Sunset Cafe");
    expect(userPrompt).toContain("Coffee Shop");
    expect(userPrompt).toContain("Rating: 4 out of 5");
    expect(userPrompt).toContain("- Cold coffee");
    expect(userPrompt).toContain("- Friendly staff");
  });

  it("forbids invented details", () => {
    const { systemPrompt } = buildReviewPrompts(input());
    for (const detail of ["staff names", "purchases", "prices", "dates"]) {
      expect(systemPrompt).toContain(detail);
    }
  });

  it.each([
    [1, "Do not praise"],
    [2, "Do not praise"],
    [3, "balanced"],
    [4, "positive"],
    [5, "positive"],
  ])("sets the tone for rating %i", (rating, phrase) => {
    expect(buildReviewPrompts(input({ rating })).userPrompt).toContain(phrase);
  });

  it("does not ask for praise on a low rating", () => {
    expect(buildReviewPrompts(input({ rating: 2 })).userPrompt).not.toContain("positive");
  });

  it("does not turn a selected topic into an invented complaint", () => {
    const { userPrompt } = buildReviewPrompts(input({ rating: 1, chips: ["Friendly staff"] }));
    expect(userPrompt).toContain("Do not claim a specific failure");
    expect(userPrompt).toContain("opposite");
  });

  it("keeps low-rating topics from becoming compliments", () => {
    const { userPrompt } = buildReviewPrompts(input({ rating: 2, chips: ["Friendly staff"] }));
    expect(userPrompt).toContain("Do not describe any topic as good");
    expect(userPrompt).toContain("could be better");
  });

  it("labels low-rating chips as improvement topics", () => {
    expect(buildReviewPrompts(input({ rating: 2 })).userPrompt).toContain("Topics the customer wants improved:");
    expect(buildReviewPrompts(input({ rating: 4 })).userPrompt).toContain("Topics selected by the customer:");
  });

  it("does not add claims beyond the selected topics", () => {
    expect(buildReviewPrompts(input()).systemPrompt).toContain("outside the selected topics");
  });

  it("does not explain topics with invented detail", () => {
    expect(buildReviewPrompts(input()).systemPrompt).toContain("Do not explain how or why");
  });

  it("does not invent whether the customer will return", () => {
    expect(buildReviewPrompts(input()).systemPrompt).toContain("whether the customer will return");
  });

  it.each([
    ["hi", "Devanagari"],
    ["hinglish", "Roman"],
  ] as const)("supports %s", (language, phrase) => {
    expect(buildReviewPrompts(input({ language })).userPrompt).toContain(phrase);
  });

  it("validates structured output", () => {
    expect(ReviewDraftOutputSchema.safeParse({ draftText: "Good coffee and quick service." }).success).toBe(true);
    expect(ReviewDraftOutputSchema.safeParse({ draftText: "Hi" }).success).toBe(false);
  });
});

describe("safe fallback draft", () => {
  const router = new AIRouter([]);

  it("does not praise a low rating", () => {
    const { draftText } = router.generateSafeFallbackDraft(input({ rating: 2, chips: ["Staff behaviour", "Service"] }));
    expect(draftText).toContain("staff behaviour");
    expect(draftText.toLowerCase()).not.toMatch(/great|excellent|loved|liked/);
  });

  it.each(["en", "hi", "hinglish"] as const)("uses every chip in %s", (language) => {
    const { draftText } = router.generateSafeFallbackDraft(input({ language, chips: ["Taste", "Service", "Price"] }));
    for (const chip of ["taste", "service", "price"]) expect(draftText.toLowerCase()).toContain(chip);
  });
});
