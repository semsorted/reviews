import { prisma } from "@/lib/prisma";
import { FREE_PROVIDER, providerKey } from "./report-core";
import { chartDays, dayKeys, rangeStart, type TrackingRange } from "./tracking-core";

export type AiDay = { day: string; label: string; free: number; ai: number; byProvider: Record<string, number> };
export type ProviderRow = { provider: string; calls: number; failed: number; avgMs: number; cost: number };

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
    prisma.$queryRaw<{ provider: string; calls: number; failed: number; avg_ms: number | null; cost: number }[]>`
      SELECT provider,
             COUNT(*) FILTER (WHERE status = 'SUCCESS')::int AS calls,
             COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed,
             AVG(latency_ms) FILTER (WHERE status = 'SUCCESS')::float AS avg_ms,
             COALESCE(SUM(estimated_cost), 0)::float AS cost
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
  const providers: ProviderRow[] = calls.map((row) => ({ provider: row.provider, calls: row.calls, failed: row.failed, avgMs: Math.round(row.avg_ms ?? 0), cost: row.cost }));
  // The totals follow the picked period. The chart shows at most the last 90 days.
  const periodDays = days.filter((point) => new Date(`${point.day}T00:00:00+05:30`) >= since);
  const free = periodDays.reduce((sum, point) => sum + point.free, 0);
  const ai = periodDays.reduce((sum, point) => sum + point.ai, 0);
  return { days, providers, totals: { free, ai }, hasWindowCap: range === "all" };
}
