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

import { buildSection, type Sale } from "@/lib/admin/payments-core";

describe("buildSection", () => {
  const sale = (shopId: string, amount: number, at: string): Sale => ({ id: `${shopId}-${at}`, shopId, name: `Shop ${shopId}`, detail: "QR", amount, at: new Date(at) });
  const months = ["2026-09", "2026-10", "2026-11"];
  const days = ["2026-11-23", "2026-11-24", "2026-11-25"];

  it("adds up this month, last month and the change", () => {
    const section = buildSection([sale("a", 1999, "2026-11-23T10:00:00+05:30"), sale("b", 1999, "2026-11-24T10:00:00+05:30"), sale("c", 1999, "2026-10-02T10:00:00+05:30")], months, days);
    expect(section.thisMonth).toBe(3998);
    expect(section.lastMonth).toBe(1999);
    expect(section.change).toBe(100);
    expect(section.allTime).toEqual({ amount: 5997, payments: 3, businesses: 3 });
  });

  it("charts each month and day, with zeros where nothing came in", () => {
    const section = buildSection([sale("a", 500, "2026-11-24T10:00:00+05:30")], months, days);
    expect(section.monthPoints.map((point) => point.amount)).toEqual([0, 0, 500]);
    expect(section.dayPoints.map((point) => point.amount)).toEqual([0, 500, 0]);
  });

  it("puts a late-night payment on the Indian day", () => {
    // 20:00 UTC on the 24th is 01:30 IST on the 25th.
    const section = buildSection([sale("a", 100, "2026-11-24T20:00:00Z")], months, days);
    expect(section.dayPoints.map((point) => point.amount)).toEqual([0, 0, 100]);
  });

  it("groups by business, biggest first", () => {
    const section = buildSection([sale("a", 100, "2026-11-01T10:00:00+05:30"), sale("a", 300, "2026-11-02T10:00:00+05:30"), sale("b", 200, "2026-11-03T10:00:00+05:30")], months, days);
    expect(section.businesses.map((row) => [row.shopId, row.total, row.payments])).toEqual([["a", 400, 2], ["b", 200, 1]]);
    expect(section.recent[0].shopId).toBe("b");
  });

  it("handles no sales", () => {
    const section = buildSection([], months, days);
    expect(section.thisMonth).toBe(0);
    expect(section.change).toBeNull();
    expect(section.businesses).toEqual([]);
  });
});
