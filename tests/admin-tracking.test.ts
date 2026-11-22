import { describe, expect, it } from "vitest";
import { dayKeys, parseDraftNotes, parseRange, percent, rangeStart, reviewStatus } from "@/lib/admin/tracking-core";

// 20:00 UTC on 22 Nov is already 01:30 on 23 Nov in India.
const now = new Date("2026-11-22T20:00:00.000Z");

describe("tracking date ranges", () => {
  it.each([["today", "today"], ["7d", "7d"], ["30d", "30d"], ["all", "all"], ["nope", "30d"], [undefined, "30d"], [["7d", "all"], "30d"]] as const)(
    "reads %s as %s",
    (value, expected) => expect(parseRange(value as string | string[] | undefined)).toBe(expected)
  );

  it("starts today at midnight India time", () => {
    expect(rangeStart("today", now).toISOString()).toBe("2026-11-22T18:30:00.000Z");
  });

  it("counts today as one of the 7 days", () => {
    expect(rangeStart("7d", now).toISOString()).toBe("2026-11-16T18:30:00.000Z");
  });

  it("uses the start of time for all", () => {
    expect(rangeStart("all", now).getTime()).toBe(0);
  });

  it("lists India dates in order, ending today", () => {
    expect(dayKeys(3, now)).toEqual(["2026-11-21", "2026-11-22", "2026-11-23"]);
  });
});

describe("parseDraftNotes", () => {
  it("reads the rating and chosen chips", () => {
    expect(parseDraftNotes("Rating 4: Taste, Service")).toEqual({ rating: 4, chips: "Taste, Service" });
  });

  it("keeps a chip that has a colon", () => {
    expect(parseDraftNotes("Rating 5: Food: taste")).toEqual({ rating: 5, chips: "Food: taste" });
  });

  it.each([null, "", "Great shop", "Rating 9: Taste"])("handles old or unknown notes: %s", (notes) => {
    expect(parseDraftNotes(notes)).toEqual({ rating: null, chips: "" });
  });
});

describe("percent", () => {
  it("rounds to a whole percent", () => expect(percent(1, 3)).toBe(33));
  it("does not divide by zero", () => expect(percent(4, 0)).toBe(0));
  it("never passes 100", () => expect(percent(5, 4)).toBe(100));
});

describe("reviewStatus", () => {
  it("never claims a review was posted", () => {
    expect(reviewStatus(true, true)).toBe("Sent to Google");
    expect(reviewStatus(true, false)).toBe("Copied");
    expect(reviewStatus(false, false)).toBe("Not copied");
  });

  it("counts opening Google even if copy tracking was missed", () => {
    expect(reviewStatus(false, true)).toBe("Sent to Google");
  });
});
