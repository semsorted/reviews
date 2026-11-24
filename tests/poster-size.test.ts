import { describe, expect, it } from "vitest";
import { parsePosterSize, qrMm } from "@/lib/qr/poster-size";

describe("poster size", () => {
  it("defaults to 4x6 for both designs", () => {
    expect(parsePosterSize({})).toMatchObject({ key: "4x6", wMm: 101.6, hMm: 152.4 });
    expect(parsePosterSize({ size: "nope" }).key).toBe("4x6");
  });

  it("keeps the old A4 and A5 links working", () => {
    expect(parsePosterSize({ size: "a4" })).toMatchObject({ key: "a4", wMm: 210, hMm: 297, query: { size: "a4" } });
    expect(parsePosterSize({ size: "a5" })).toMatchObject({ key: "a5", wMm: 148, hMm: 210 });
  });

  it("converts a custom size from inches, cm and mm", () => {
    const fiveBySeven = parsePosterSize({ size: "custom", w: "5", h: "7", unit: "in" });
    expect(fiveBySeven).toMatchObject({ key: "custom", wMm: 127, hMm: 177.8, query: { size: "custom", w: "5", h: "7", unit: "in" } });
    expect(fiveBySeven.error).toBeUndefined();
    expect(parsePosterSize({ size: "custom", w: "20", h: "30", unit: "cm" })).toMatchObject({ wMm: 200, hMm: 300 });
    expect(parsePosterSize({ size: "custom", w: "100", h: "150", unit: "mm" })).toMatchObject({ wMm: 100, hMm: 150 });
  });

  it.each([
    { w: "0", h: "7" },
    { w: "1e3", h: "7" },
    { w: "5x", h: "7" },
    { w: "", h: "7" },
    { w: "2", h: "7" },
    { w: "30", h: "7" },
    { w: "5", h: "15" },
    { w: "12", h: "4" },
  ])("rejects $w x $h inches and falls back to 4x6 with a message", ({ w, h }) => {
    const size = parsePosterSize({ size: "custom", w, h, unit: "in" });
    expect(size).toMatchObject({ key: "4x6", wMm: 101.6, hMm: 152.4 });
    expect(size.error).toBeTruthy();
    expect(size.input).toEqual({ w, h, unit: "in" });
  });

  it("rejects an unknown unit", () => {
    expect(parsePosterSize({ size: "custom", w: "5", h: "7", unit: "ft" }).error).toBeTruthy();
  });

  it("ignores repeated query values", () => {
    expect(parsePosterSize({ size: ["a4", "a5"] }).key).toBe("4x6");
  });

  it("keeps the printed QR at least 25 mm across the allowed range", () => {
    for (const [w, h] of [[75, 75], [75, 187.5], [187.5, 75], [240, 600], [600, 240], [600, 600], [101.6, 152.4], [210, 297]]) {
      for (const design of ["normal", "custom"] as const) expect(qrMm({ wMm: w, hMm: h }, design)).toBeGreaterThanOrEqual(25);
    }
  });
});
