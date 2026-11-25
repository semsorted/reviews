import { describe, expect, it } from "vitest";
import { seededRandom, writeInstantDraft } from "@/lib/reviews/instant-draft";
import { firstUnused, isSafeAiDraft, localCandidates } from "@/lib/reviews/unique-draft";

const input = { shopName: "Sunrise Bakery", rating: 5, chips: ["Taste", "Service"], language: "hi" as const };
const sessionId = "22222222-2222-4222-8222-222222222222";

describe("localCandidates", () => {
  it("starts with the exact draft the customer already sees", () => {
    expect(localCandidates(input, sessionId, 3)[0]).toBe(writeInstantDraft(input, seededRandom(`${sessionId}:3`)));
  });

  it("offers many different reviews in Hindi and Hinglish", () => {
    for (const language of ["hi", "hinglish"] as const) {
      const all = new Set<string>();
      for (let seed = 0; seed < 4000; seed++) all.add(writeInstantDraft({ ...input, language }, seededRandom(`s:${seed}`)));
      expect(all.size).toBeGreaterThanOrEqual(300);
    }
  });

  it("returns no duplicates", () => {
    const list = localCandidates(input, sessionId, 0);
    expect(new Set(list).size).toBe(list.length);
    expect(list.length).toBeGreaterThan(10);
  });
});

describe("firstUnused", () => {
  it("skips reviews this shop has already used", () => {
    expect(firstUnused(["a", "b", "c"], ["a", "b"])).toBe("c");
  });

  it("returns nothing when every review is used", () => {
    expect(firstUnused(["a"], ["a"])).toBeUndefined();
  });
});

describe("isSafeAiDraft", () => {
  const shop = "Sunrise Bakery";

  it("accepts a normal review", () => {
    expect(isSafeAiDraft("The service at Sunrise Bakery was pleasant and the taste was nice.", 4, shop)).toBe(true);
  });

  it("accepts gender-neutral Hindi and Hinglish", () => {
    expect(isSafeAiDraft("मैंने Sunrise Bakery में पढ़ाई की। मैं बहुत खुश हूँ।", 5, shop)).toBe(true);
    expect(isSafeAiDraft("Maine Sunrise Bakery me padhai ki. Timings bilkul theek the.", 5, shop)).toBe(true);
  });

  it("allows the word for in Hindi and an order-related topic", () => {
    expect(isSafeAiDraft("Sunrise Bakery में order accuracy के लिए अनुभव अच्छा रहा।", 4, shop)).toBe(true);
  });

  it.each([
    ["too short", "Sunrise Bakery.", 5],
    ["too long", `Sunrise Bakery ${"a ".repeat(300)}`, 5],
    ["contains a link", "Visit Sunrise Bakery at https://example.com for a nice time.", 5],
    ["mentions AI", "This Sunrise Bakery review was written by AI for the shop.", 5],
    ["praise at one star", "At Sunrise Bakery the service was excellent and I loved it.", 1],
    ["Hinglish praise at two stars", "Sunrise Bakery ki service bahut badhiya thi aur taste bhi mast.", 2],
    ["Hindi praise at one star", "Sunrise Bakery की सेवा शानदार रही और स्वाद भी बहुत अच्छा था।", 1],
    ["changed shop name", "सनराइज़ बेकरी का स्वाद और सर्विस दोनों का अनुभव अच्छा रहा।", 5],
    ["invented English purchase", "I bought a cake at Sunrise Bakery and the taste was nice.", 5],
    ["invented Hinglish purchase", "Maine Sunrise Bakery se kuch liya tha aur taste theek tha.", 3],
    ["gendered Hindi", "मैं Sunrise Bakery में पढ़ाई करता हूँ। स्वाद अच्छा रहा।", 5],
    ["gendered Hindi continuing", "मैं Sunrise Bakery में पढ़ाई करता रहा। स्वाद अच्छा रहा।", 5],
    ["gendered Hinglish continuing", "Main Sunrise Bakery me padhai karti rahi aur taste achha laga.", 5],
    ["gendered Hinglish", "Maine Sunrise Bakery me classes leta tha aur taste achha laga.", 5],
    ["invented Hindi purchase", "मैंने Sunrise Bakery से चीज़ें लीं। स्वाद और सेवा अच्छे लगे।", 5],
  ])("rejects %s", (_name, text, rating) => {
    expect(isSafeAiDraft(text as string, rating as number, shop)).toBe(false);
  });
});
