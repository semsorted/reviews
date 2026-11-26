import { describe, expect, it } from "vitest";
import { allChipFamilies } from "@/lib/reviews/chip-families";
import { chipNameForDay, chipsForDay, indiaDay } from "@/lib/reviews/chip-day";
import { seededRandom, writeInstantDraft } from "@/lib/reviews/instant-draft";
import { VISIBLE_CHIPS } from "@/lib/reviews/rules";
import { GENDERED, isSafeAiDraft } from "@/lib/reviews/unique-draft";

const labels = ["B.L. Sir", "Confidence building", "Hesitation", "Public speaking", "Fluency", "Pronunciation", "Speaking practice", "Group discussion", "Interview preparation", "Grammar", "Vocabulary", "Teaching method", "Doubt clearing", "Personal attention", "Course material", "Batch size", "Batchmates", "Classroom environment", "Timings", "Regular classes", "Fees", "Results", "Progress tracking", "Friendly staff"];
const chips = labels.map((label, index) => ({ id: `chip-${index}`, label, isPinned: index < 4 }));
const days = ["2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04"];

describe("chipsForDay", () => {
  it("shows every pinned chip first and fills the rest up to the limit", () => {
    for (const day of days) {
      const shown = chipsForDay(chips, "shop", day);
      expect(shown).toHaveLength(VISIBLE_CHIPS);
      expect(shown.slice(0, 4).map((chip) => chip.label)).toEqual(labels.slice(0, 4));
      expect(new Set(shown.map((chip) => chip.id)).size).toBe(VISIBLE_CHIPS);
    }
  });

  it("is the same all day and changes on other days", () => {
    expect(chipsForDay(chips, "shop", days[0])).toEqual(chipsForDay(chips, "shop", days[0]));
    const sets = new Set(days.map((day) => chipsForDay(chips, "shop", day).map((chip) => chip.id).join()));
    expect(sets.size).toBeGreaterThan(1);
  });

  it("shows a small business all its chips in its own order", () => {
    const few = chips.slice(4, 10).map((chip) => ({ ...chip, isPinned: false }));
    expect(chipsForDay(few, "shop", days[0]).map((chip) => chip.id)).toEqual(few.map((chip) => chip.id));
  });

  it("shows a known chip under a similar name, and a typed one as typed", () => {
    const names = new Set(Array.from({ length: 30 }, (_, day) => chipNameForDay("Confidence building", `2026-12-${String(day + 1).padStart(2, "0")}`)));
    expect(names.size).toBeGreaterThan(1);
    for (const name of names) expect(name).toMatch(/confidence/i);
    expect(chipNameForDay("B.L. Sir", days[0])).toBe("B.L. Sir");
  });

  it("gives a pinned chip a new name every day", () => {
    for (const label of ["Confidence building", "Hesitation", "Public speaking"]) {
      const week = days.concat(["2026-12-05", "2026-12-06", "2026-12-07"]).map((day) => chipNameForDay(label, day));
      for (let i = 1; i < week.length; i++) expect(week[i]).not.toBe(week[i - 1]);
      expect(new Set(week).size).toBe(7);
    }
  });

  it("uses the date in India", () => {
    expect(indiaDay(new Date("2026-12-01T19:00:00Z"))).toBe("2026-12-02");
    expect(indiaDay(new Date("2026-12-01T18:00:00Z"))).toBe("2026-12-01");
  });
});

describe("chip families", () => {
  it("never reveals the customer's gender", () => {
    for (const [, family] of allChipFamilies()) {
      for (const language of ["en", "hinglish", "hi"] as const) {
        for (const line of family.good[language]) expect(line, line).not.toMatch(GENDERED);
        for (const line of family.person?.[language] ?? []) expect(line("B.L. Sir")).not.toMatch(GENDERED);
      }
    }
  });

  it("writes safe, varied reviews for the spoken English academy in every language", () => {
    const shop = "Hi-tech Global English Training Academy";
    for (const language of ["en", "hinglish", "hi"] as const) {
      const all = new Set<string>();
      for (let seed = 0; seed < 3000; seed++) {
        const text = writeInstantDraft({ shopName: shop, rating: 5, chips: ["B.L. Sir", "Hesitation", "Fees"], language, category: "Language and spoken English" }, seededRandom(`s:${seed}`));
        expect(isSafeAiDraft(text, 5, shop), text).toBe(true);
        all.add(text);
      }
      expect(all.size).toBeGreaterThan(200);
    }
  });

  it("credits the person for hesitation in one sentence", () => {
    const text = writeInstantDraft({ shopName: "X Academy", rating: 5, chips: ["B.L. Sir", "Hesitation"], language: "en", category: "Language and spoken English" }, seededRandom("a"));
    expect(text).toMatch(/B\.L\. Sir.*hesitat/);
  });

  it("keeps low ratings readable for a chip that is not a noun", () => {
    const text = writeInstantDraft({ shopName: "X Academy", rating: 2, chips: ["Hesitation", "Fees"], language: "en", category: "Language and spoken English" }, seededRandom("b"));
    expect(text).toContain("work on hesitation");
  });
});
