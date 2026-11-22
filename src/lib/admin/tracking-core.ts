export const RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
] as const;

export type TrackingRange = (typeof RANGES)[number]["value"];
export type ReviewStatus = "Sent to Google" | "Copied" | "Not copied";

const DAY_MS = 86_400_000;
const INDIA_OFFSET_MS = 330 * 60_000;

const indiaMidnight = (now: Date) => Math.floor((now.getTime() + INDIA_OFFSET_MS) / DAY_MS) * DAY_MS - INDIA_OFFSET_MS;

export function parseRange(value: string | string[] | undefined): TrackingRange {
  return RANGES.find((range) => range.value === value)?.value ?? "30d";
}

export function rangeStart(range: TrackingRange, now = new Date()): Date {
  if (range === "all") return new Date(0);
  const daysBack = range === "today" ? 0 : range === "7d" ? 6 : 29;
  return new Date(indiaMidnight(now) - daysBack * DAY_MS);
}

export const chartDays = (range: TrackingRange) => (range === "30d" ? 30 : range === "all" ? 90 : 7);

export function dayKeys(count: number, now = new Date()): string[] {
  const today = indiaMidnight(now) + INDIA_OFFSET_MS;
  return Array.from({ length: count }, (_, index) => new Date(today - (count - 1 - index) * DAY_MS).toISOString().slice(0, 10));
}

export function parseDraftNotes(notes: string | null): { rating: number | null; chips: string } {
  const match = notes?.match(/^Rating ([1-5]): ([\s\S]*)$/);
  return match ? { rating: Number(match[1]), chips: match[2] } : { rating: null, chips: "" };
}

export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0;
}

export function reviewStatus(isCopied: boolean, wentToGoogle: boolean): ReviewStatus {
  if (wentToGoogle) return "Sent to Google";
  return isCopied ? "Copied" : "Not copied";
}

export const formatWhen = (date: Date) =>
  date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });

export function niceMax(value: number): number {
  const power = 10 ** Math.floor(Math.log10(Math.max(value, 1)));
  return ([1, 2, 5, 10].find((step) => step * power >= value) ?? 10) * power;
}
