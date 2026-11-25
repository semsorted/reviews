import { indiaDayKey } from "@/lib/subscription";

/** Review drafts written on the device have provider "instant". Anything else came from an AI service. */
export const FREE_PROVIDER = "instant";

// One color per provider, whatever the period or filter. Validated as a set for colorblind separation.
export const PROVIDER_SERIES = [
  { key: "groq", name: "Groq", color: "#eb6834" },
  { key: "gemini", name: "Gemini", color: "#6250d6" },
  { key: "cloudflare", name: "Cloudflare", color: "#1baf7a" },
  { key: "other", name: "Other", color: "#8a8f98" },
] as const;

export const providerKey = (provider: string): string => (PROVIDER_SERIES.some((series) => series.key === provider) ? provider : "other");

/** "2026-11" for this month, then the months before it, oldest first. */
export function monthKeys(count: number, now = new Date()): string[] {
  const [year, month] = indiaDayKey(now).split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (count - 1 - index), 1));
    return date.toISOString().slice(0, 7);
  });
}

export const monthLabel = (key: string) =>
  new Date(`${key}-15T12:00:00+05:30`).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", month: "short", year: "numeric" });

/** Whole-number change against the earlier amount. Null when there is nothing earlier to compare with. */
export const changePercent = (current: number, earlier: number): number | null => (earlier > 0 ? Math.round(((current - earlier) / earlier) * 100) : null);
