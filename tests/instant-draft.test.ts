import { describe, expect, it } from "vitest";
import { seededRandom, writeInstantDraft } from "@/lib/reviews/instant-draft";
import type { ReviewLanguage } from "@/lib/ai/provider.interface";

const input = (rating: number, language: ReviewLanguage = "en", chips = ["Food taste", "Service", "AC cooling"]) => ({
  shopName: "Sunrise Bakery",
  rating,
  chips,
  language,
});

function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

const samples = (rating: number, language: ReviewLanguage = "en") =>
  Array.from({ length: 200 }, (_, index) => writeInstantDraft(input(rating, language), seeded(index + 1)));

describe("writeInstantDraft", () => {
  it.each([1, 2, 3, 4, 5])("uses the shop and every chip at rating %i", (rating) => {
    for (const draft of samples(rating)) {
      expect(draft).toContain("Sunrise Bakery");
      expect(draft).toContain("food taste");
      expect(draft).toContain("service");
      expect(draft).toContain("AC cooling");
    }
  });

  it.each(["hi", "hinglish"] as const)("uses the shop and every chip in %s", (language) => {
    for (const draft of samples(4, language)) {
      expect(draft).toContain("Sunrise Bakery");
      for (const chip of ["food taste", "service", "AC cooling"]) expect(draft.toLowerCase()).toContain(chip.toLowerCase());
    }
  });

  it.each([1, 2])("never praises at rating %i", (rating) => {
    for (const draft of samples(rating)) {
      expect(draft.toLowerCase()).not.toMatch(/great|excellent|loved|liked|happy|good|pleasant|appreciated|stood out/);
    }
  });

  it("stays measured at rating 3", () => {
    for (const draft of samples(3)) expect(draft.toLowerCase()).not.toMatch(/great|excellent|loved|really/);
  });

  it("is clearly positive at rating 5", () => {
    for (const draft of samples(5)) expect(draft.toLowerCase()).toMatch(/great|really|very happy|impressed/);
  });

  it.each([1, 3, 5])("does not invent future plans at rating %i", (rating) => {
    for (const draft of samples(rating)) {
      expect(draft.toLowerCase()).not.toMatch(/recommend|come back|coming back|return|again|next time|visit soon/);
    }
  });

  it("varies enough to avoid identical reviews", () => {
    expect(new Set(samples(5)).size).toBeGreaterThanOrEqual(50);
  });

  it("writes a short review", () => {
    for (const draft of samples(4)) {
      expect(draft.length).toBeLessThanOrEqual(260);
      expect(draft.split(/[.!?]\s/).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps the wording steady while the customer adds chips", () => {
    const sentences = (chips: string[]) =>
      writeInstantDraft(input(4, "en", chips), seededRandom("session-1:0")).split(/(?<=\.)\s/);
    const two = sentences(["Taste", "Service"]);
    const three = sentences(["Taste", "Service", "Price"]);
    expect(three[0]).toBe(two[0]);
    expect(three[2]).toBe(two[2]);
  });

  it("repeats a seed and changes with a new one", () => {
    const draft = (seed: string) => writeInstantDraft(input(5), seededRandom(seed));
    expect(draft("session-1:0")).toBe(draft("session-1:0"));
    const variants = new Set(Array.from({ length: 20 }, (_, index) => draft(`session-1:${index}`)));
    expect(variants.size).toBeGreaterThan(5);
  });

  it("joins topics naturally", () => {
    const draft = writeInstantDraft(input(4, "en", ["Taste", "Service"]), () => 0);
    expect(draft).toContain("taste and service");
  });
});
