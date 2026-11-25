import { getAiUsage, getApiUsage } from "@/lib/admin/ai-usage";
import { quotaMeters } from "@/lib/admin/free-quota";
import { PROVIDER_SERIES } from "@/lib/admin/report-core";
import { parseRange } from "@/lib/admin/tracking-core";
import { requireAdminPage } from "@/lib/auth/guard";
import { AiUsageSection } from "../_components/AiUsageSection";
import { BarChart } from "../_components/BarChart";
import { PageHead, Panel, RangeTabs } from "../_components/TrackingBlocks";

export const metadata = { title: "Usage" };

const COLORS = Object.fromEntries(PROVIDER_SERIES.map((series) => [series.key, series.color]));

export default async function UsagePage({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  await requireAdminPage();
  const range = parseRange((await searchParams).range);
  const [ai, api] = await Promise.all([getAiUsage(range), getApiUsage(range)]);
  const meters = quotaMeters(api.last24);

  return (
    <div className="space-y-5">
      <PageHead title="Usage" text="How much AI the app used, which service did the work each day, and how much of every free quota is used up." />
      <RangeTabs base="/admin/usage" range={range} />

      <Panel title="Free quota in the last 24 hours">
        <ul className="space-y-5">
          {meters.map((meter) => {
            const share = meter.limit ? Math.min(100, Math.round((meter.used / meter.limit) * 100)) : null;
            return (
              <li key={meter.provider}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="font-semibold">{meter.name}</span>
                  <span className="text-sm tabular-nums text-moss">
                    {meter.used.toLocaleString("en-IN")}
                    {meter.limit ? ` of ${meter.limit.toLocaleString("en-IN")}` : ""} {meter.unit} · {meter.calls} {meter.calls === 1 ? "call" : "calls"}
                    {share !== null && <strong className={share >= 90 ? "ml-2 text-g-red" : "ml-2 text-ink"}>{share}%{share >= 90 ? " almost used up" : ""}</strong>}
                  </span>
                </div>
                {share !== null && (
                  <span role="img" aria-label={`${meter.name} ${share} percent of the free quota used`} className="mt-2 block h-2.5 overflow-hidden rounded-full bg-mist">
                    <span className="block h-full rounded-full" style={{ width: `${Math.max(share, meter.used ? 2 : 0)}%`, backgroundColor: COLORS[meter.provider] }} />
                  </span>
                )}
                <p className="mt-1.5 text-xs text-moss">{meter.note}</p>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <BarChart
            title="AI calls per day"
            points={api.days.map((day) => ({ label: day.label, values: day.calls }))}
            series={[...PROVIDER_SERIES]}
            ariaLabel="Calls that worked each day, split by AI service."
            emptyText="No AI calls in this period yet."
          />
        </Panel>
        <Panel>
          <BarChart
            title="Tokens used per day"
            points={api.days.map((day) => ({ label: day.label, values: day.tokens }))}
            series={[...PROVIDER_SERIES]}
            ariaLabel="Tokens used each day, split by AI service."
            emptyText="No tokens used in this period yet."
          />
        </Panel>
      </div>

      <AiUsageSection usage={ai} range={range} />
    </div>
  );
}
