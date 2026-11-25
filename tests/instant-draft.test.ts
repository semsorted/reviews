import { describe, expect, it } from "vitest";
import { seededRandom, writeChipLine, writeInstantDraft } from "@/lib/reviews/instant-draft";
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
      for (const chip of language === "hi" ? ["खाने का स्वाद", "सर्विस", "AC cooling"] : ["food taste", "service", "AC cooling"]) expect(draft.toLowerCase()).toContain(chip.toLowerCase());
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
    expect(three.at(-1)).toBe(two.at(-1));
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

  it("uses the business type for what the customer did", () => {
    const draft = (category: string, language: ReviewLanguage = "en") =>
      Array.from({ length: 60 }, (_, i) => writeInstantDraft({ ...input(4, language), category }, seeded(i + 1)));
    expect(draft("Language and spoken English").every((text) => /studied|classes|learned/.test(text))).toBe(true);
    expect(draft("Clothing store").every((text) => /clothes/.test(text))).toBe(true);
    expect(draft("Clinic").every((text) => /consult/.test(text))).toBe(true);
    expect(draft("Clothing store", "hinglish").every((text) => /kapde|kapdon/.test(text))).toBe(true);
    expect(draft("Hotel").every((text) => /stay|stayed|spent a few days/.test(text))).toBe(true);
  });

  it("keeps the generic wording for a business type it does not know", () => {
    expect(writeInstantDraft({ ...input(4), category: "Something custom" }, () => 0)).toBe(writeInstantDraft(input(4), () => 0));
  });

  it("writes about a person chip by name, not as a topic", () => {
    for (const language of ["en", "hinglish", "hi"] as const) {
      for (let i = 1; i < 60; i++) {
        const text = writeInstantDraft({ ...input(5, language, ["B.L. Sir", "Speaking practice"]), category: "Language and spoken English" }, seeded(i));
        expect(text).toContain("B.L. Sir");
        expect(text).not.toMatch(/b\.l\. sir (ke maamle|के मामले)|the b\.l\. sir|speaking practice.*speaking practice/i);
      }
    }
  });

  it("links a person with confidence building at a good rating", () => {
    const text = writeInstantDraft({ ...input(5, "en", ["B.L. Sir", "Confidence building"]), category: "Language and spoken English" }, seeded(3));
    expect(text).toMatch(/B\.L\. Sir .*confidence/);
    expect(text).not.toMatch(/before|when I joined|was low/i);
  });

  it("does not link them at a low rating and never praises", () => {
    for (let i = 1; i < 60; i++) {
      const text = writeInstantDraft({ ...input(2, "en", ["B.L. Sir", "Confidence building"]), category: "Language and spoken English" }, seeded(i));
      expect(text).toContain("confidence building");
      expect(text.toLowerCase()).not.toMatch(/helped|liked|stood out|impression|great|good/);
    }
  });

  it("does not treat Doctor consultation as a person", () => {
    const text = writeInstantDraft({ ...input(5, "en", ["Doctor consultation", "Staff behaviour"]), category: "Clinic" }, seeded(5));
    expect(text).toContain("doctor consultation");
  });

  it("adds one sentence for a chip added later", () => {
    const line = writeChipLine("Timings", { rating: 5, language: "en", category: "Language and spoken English" }, seeded(2));
    expect(line).toContain("timings");
    expect(line.split(/(?<=\.)\s/)).toHaveLength(1);
    expect(writeChipLine("B.L. Sir", { rating: 5, language: "en", category: "Language and spoken English" }, seeded(2))).toContain("B.L. Sir");
  });
});
