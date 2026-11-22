import { describe, expect, it } from "vitest";
import { COPY } from "@/app/r/[token]/copy";
import { hindiChip } from "@/lib/reviews/chip-hindi";
import { GENERIC_CHIPS, SHOP_TYPES } from "@/lib/reviews/catalog";
import { writeInstantDraft } from "@/lib/reviews/instant-draft";

describe("Hindi review page", () => {
  it("has a Hindi word for every ready-made chip", () => {
    const labels = new Set([...GENERIC_CHIPS, ...SHOP_TYPES.flatMap((type) => type.chips)]);
    const missing = [...labels].filter((label) => !/[ऀ-ॿ]/.test(hindiChip(label)));
    expect(missing).toEqual([]);
  });

  it("keeps a custom chip exactly as the admin typed it", () => {
    expect(hindiChip("Rooftop view")).toBe("Rooftop view");
  });

  it("writes Hindi reviews without English chip words", () => {
    const text = writeInstantDraft({ shopName: "Sharma Sweets", rating: 5, chips: ["Service", "Taste"], language: "hi" }, () => 0.2);
    expect(text).toContain("Sharma Sweets");
    expect(text.replace("Sharma Sweets", "")).not.toMatch(/[A-Za-z]/);
  });

  it("does not change English or Hinglish chip words", () => {
    expect(writeInstantDraft({ shopName: "A Shop", rating: 5, chips: ["Service", "Taste"], language: "hinglish" }, () => 0.2)).toMatch(/service|taste/);
  });

  it("never tells a customer the shop itself reads the private message", () => {
    for (const copy of Object.values(COPY)) expect(`${copy.privateTitle} ${copy.privateText} ${copy.privateSent}`).toContain("Semsorted");
  });
});
