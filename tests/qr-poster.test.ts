import { describe, expect, it } from "vitest";
import { posterFor } from "@/lib/qr/poster";
import { SHOP_TYPES } from "@/lib/reviews/catalog";

const contrast = (a: string, b: string) => {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("QR poster template", () => {
  it("matches the headline to the business type", () => {
    expect(posterFor("Restaurant", "en", "#1A73E8").headline).toBe("How was the taste?");
    expect(posterFor("Clinic", "en", "#1A73E8").headline).toBe("How was your visit?");
    expect(posterFor("Hotel", "hinglish", "#1A73E8").headline).toBe("Aapka stay kaisa raha?");
    expect(posterFor("Clinic", "hi", "#1A73E8").headline).toBe("आपकी विज़िट कैसी रही?");
  });

  it("falls back for a custom business type and unknown language", () => {
    const poster = posterFor("Stamp collector", "fr", "#1A73E8");
    expect(poster.group).toBeNull();
    expect(poster.headline).toBe("How was your experience?");
  });

  it("uses a shop's custom color and keeps text readable on it", () => {
    expect(posterFor("Clinic", "en", "#7B1FA2").background).toBe("#7B1FA2");
    for (const color of ["#FFFFFF", "#FBBC04", "#000000", "#7B1FA2", "#1A73E8"]) {
      const poster = posterFor("Stamp collector", "en", color);
      expect(contrast(poster.background, poster.foreground)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("never asks only for positive reviews or offers a reward, in any type or language", () => {
    for (const type of SHOP_TYPES) {
      for (const language of ["en", "hi", "hinglish"]) {
        const poster = posterFor(type.label, language, "#1A73E8");
        const text = [poster.headline, poster.title, poster.line, poster.cta].join(" ");
        expect(text).not.toMatch(/5.?star|five star|loved|enjoyed|happy|discount|offer|free|reward|इनाम|छूट/i);
        expect(contrast(poster.background, poster.foreground)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("uses the same poster title for every business and keeps Google in the call to action", () => {
    for (const type of SHOP_TYPES) {
      expect(posterFor(type.label, "en", "#1A73E8").title).toBe("Your opinion matters!");
      for (const language of ["en", "hi", "hinglish"]) expect(posterFor(type.label, language, "#1A73E8").cta.split("Google")).toHaveLength(2);
    }
    expect(posterFor("Clinic", "en", "#1A73E8").cta).toBe("Scan to review us on Google");
  });

  it("changes the line under the title for each kind of business", () => {
    const line = (type: string) => posterFor(type, "en", "#1A73E8").line;
    expect(line("Clothing store")).toContain("collection");
    expect(line("Grocery store")).toContain("freshness");
    expect(line("Restaurant")).toContain("meal");
    expect(line("Salon")).toContain("look");
    expect(line("Gym")).toContain("training");
    expect(line("Hotel")).toContain("stay");
    expect(line("Veterinary clinic")).toContain("pet");
    expect(line("Stamp collector")).toBe("Tell others how your experience was.");
    for (const type of SHOP_TYPES) {
      for (const language of ["en", "hi", "hinglish"]) expect(posterFor(type.label, language, "#1A73E8").line.length).toBeLessThanOrEqual(60);
    }
  });
});
