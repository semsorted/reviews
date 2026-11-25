import { describe, expect, it } from "vitest";
import { changePercent, monthKeys, monthLabel, providerKey } from "@/lib/admin/report-core";

describe("monthKeys", () => {
  it("ends with the current month in India time, oldest first", () => {
    expect(monthKeys(3, new Date("2026-11-25T10:00:00+05:30"))).toEqual(["2026-09", "2026-10", "2026-11"]);
  });
  it("crosses a year change", () => {
    expect(monthKeys(3, new Date("2027-01-05T10:00:00+05:30"))).toEqual(["2026-11", "2026-12", "2027-01"]);
  });
  it("uses the Indian date at the month edge", () => {
    // 20:00 UTC on 30 Nov is already 1 Dec in India.
    expect(monthKeys(1, new Date("2026-11-30T20:00:00Z"))).toEqual(["2026-12"]);
  });
});

describe("monthLabel", () => {
  it("is short and readable", () => {
    expect(monthLabel("2026-11")).toMatch(/Nov(ember)? 2026/);
  });
});

describe("changePercent", () => {
  it("compares with the earlier amount", () => {
    expect(changePercent(150, 100)).toBe(50);
    expect(changePercent(50, 100)).toBe(-50);
    expect(changePercent(100, 100)).toBe(0);
  });
  it("has no percentage when nothing was collected before", () => {
    expect(changePercent(500, 0)).toBeNull();
    expect(changePercent(0, 0)).toBeNull();
  });
});

describe("providerKey", () => {
  it("keeps known services and folds the rest into other", () => {
    expect(providerKey("groq")).toBe("groq");
    expect(providerKey("gemini")).toBe("gemini");
    expect(providerKey("openrouter")).toBe("other");
    expect(providerKey("openai")).toBe("other");
  });
});

import { neuronsFor, quotaMeters } from "@/lib/admin/free-quota";

describe("free quota meters", () => {
  it("estimates Cloudflare neurons from tokens", () => {
    expect(neuronsFor(0, 0)).toBe(0);
    expect(neuronsFor(800, 110)).toBe(44);
  });
  it("shows every service, even with no calls", () => {
    const meters = quotaMeters([]);
    expect(meters.map((meter) => meter.provider)).toEqual(["groq", "cloudflare", "gemini"]);
    expect(meters.every((meter) => meter.used === 0 && meter.calls === 0)).toBe(true);
  });
  it("adds input and output tokens, and leaves Gemini without a limit", () => {
    const meters = quotaMeters([{ provider: "groq", calls: 2, input: 1500, output: 200 }, { provider: "gemini", calls: 1, input: 800, output: 100 }]);
    expect(meters[0]).toMatchObject({ used: 1700, limit: 200_000, calls: 2 });
    expect(meters[2]).toMatchObject({ used: 900, limit: null });
  });
});
