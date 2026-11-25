import { prisma } from "@/lib/prisma";
import { FREE_PROVIDER, providerKey } from "./report-core";
import { chartDays, dayKeys, rangeStart, type TrackingRange } from "./tracking-core";

export type AiDay = { day: string; label: string; free: number; ai: number; byProvider: Record<string, number> };
export type ProviderRow = { provider: string; calls: number; failed: number; avgMs: number; tokens: number };

const dayLabel = (day: string) => new Date(`${day}T12:00:00+05:30`).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

export async function getAiUsage(range: TrackingRange) {
  const keys = dayKeys(chartDays(range));
  const chartFrom = new Date(`${keys[0]}T00:00:00+05:30`);
  const since = rangeStart(range);
  const [drafts, calls] = await Promise.all([
    prisma.$queryRaw<{ day: string; provider: string; reviews: number }[]>`
      SELECT to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day, provider, COUNT(*)::int AS reviews
      FROM public.review_drafts
      WHERE created_at >= ${chartFrom}::timestamptz
      GROUP BY 1, 2`,
    prisma.$queryRaw<{ provider: string; calls: number; failed: number; avg_ms: number | null; tokens: number }[]>`
      SELECT provider,
             COUNT(*) FILTER (WHERE status = 'SUCCESS')::int AS calls,
             COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed,
             AVG(latency_ms) FILTER (WHERE status = 'SUCCESS')::float AS avg_ms,
             COALESCE(SUM(input_tokens + output_tokens) FILTER (WHERE status = 'SUCCESS'), 0)::int AS tokens
      FROM public.ai_usage_logs
      WHERE created_at >= ${since}::timestamptz AND provider <> 'fallback'
      GROUP BY 1 ORDER BY 2 DESC`,
  ]);

  const days: AiDay[] = keys.map((day) => {
    const point: AiDay = { day, label: dayLabel(day), free: 0, ai: 0, byProvider: {} };
    for (const row of drafts.filter((item) => item.day === day)) {
      if (row.provider === FREE_PROVIDER) point.free += row.reviews;
      else {
        point.ai += row.reviews;
        const key = providerKey(row.provider);
        point.byProvider[key] = (point.byProvider[key] ?? 0) + row.reviews;
      }
    }
    return point;
  });
  const providers: ProviderRow[] = calls.map((row) => ({ provider: row.provider, calls: row.calls, failed: row.failed, avgMs: Math.round(row.avg_ms ?? 0), tokens: row.tokens }));
  // The totals follow the picked period. The chart shows at most the last 90 days.
  const periodDays = days.filter((point) => new Date(`${point.day}T00:00:00+05:30`) >= since);
  const free = periodDays.reduce((sum, point) => sum + point.free, 0);
  const ai = periodDays.reduce((sum, point) => sum + point.ai, 0);
  return { days, providers, totals: { free, ai }, hasWindowCap: range === "all" };
}

export type ApiDay = { day: string; label: string; calls: Record<string, number>; tokens: Record<string, number> };
export type Last24Row = { provider: string; calls: number; input: number; output: number };

/** What each AI service was asked to do, per day, plus the last 24 hours for the free-quota meters. */
export async function getApiUsage(range: TrackingRange) {
  const keys = dayKeys(chartDays(range));
  const chartFrom = new Date(`${keys[0]}T00:00:00+05:30`);
  const dayAgo = new Date(Date.now() - 86_400_000);
  const [daily, last24] = await Promise.all([
    prisma.$queryRaw<{ day: string; provider: string; calls: number; tokens: number }[]>`
      SELECT to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day, provider,
             COUNT(*)::int AS calls, COALESCE(SUM(input_tokens + output_tokens), 0)::int AS tokens
      FROM public.ai_usage_logs
      WHERE created_at >= ${chartFrom}::timestamptz AND status = 'SUCCESS' AND provider <> 'fallback'
      GROUP BY 1, 2`,
    prisma.$queryRaw<{ provider: string; calls: number; input: number; output: number }[]>`
      SELECT provider, COUNT(*)::int AS calls, COALESCE(SUM(input_tokens), 0)::int AS input, COALESCE(SUM(output_tokens), 0)::int AS output
      FROM public.ai_usage_logs
      WHERE created_at >= ${dayAgo}::timestamptz AND status = 'SUCCESS' AND provider <> 'fallback'
      GROUP BY 1`,
  ]);
  const days: ApiDay[] = keys.map((day) => {
    const point: ApiDay = { day, label: dayLabel(day), calls: {}, tokens: {} };
    for (const row of daily.filter((item) => item.day === day)) {
      const key = providerKey(row.provider);
      point.calls[key] = (point.calls[key] ?? 0) + row.calls;
      point.tokens[key] = (point.tokens[key] ?? 0) + row.tokens;
    }
    return point;
  });
  return { days, last24: last24 as Last24Row[] };
}
