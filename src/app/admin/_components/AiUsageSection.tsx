import type { getAiUsage } from "@/lib/admin/ai-usage";
import { PROVIDER_SERIES } from "@/lib/admin/report-core";
import { percent } from "@/lib/admin/tracking-core";
import { BarChart } from "./BarChart";
import { CoverStats, Panel } from "./TrackingBlocks";

type AiUsage = Awaited<ReturnType<typeof getAiUsage>>;

const FREE = { key: "free", name: "Free (written on the phone)", color: "#008300" };
const AI = { key: "ai", name: "AI", color: "#2a78d6" };
const NAMES: Record<string, string> = Object.fromEntries(PROVIDER_SERIES.map((series) => [series.key, series.name]));

export function AiUsageSection({ usage, range }: { usage: AiUsage; range: string }) {
  const { days, providers, totals } = usage;
  const all = totals.ai + totals.free;
  const tokens = providers.reduce((sum, row) => sum + row.tokens, 0);
  const calls = providers.reduce((sum, row) => sum + row.calls, 0);
  const failed = providers.reduce((sum, row) => sum + row.failed, 0);

  return (
    <section aria-labelledby="ai-usage" className="space-y-4">
      <div>
        <h2 id="ai-usage" className="text-2xl font-semibold">AI and free reviews</h2>
        <p className="mt-1 max-w-[62ch] text-moss">
          Free reviews are written on the customer&apos;s phone and cost nothing. AI reviews come from an AI service when someone taps Change wording.
        </p>
      </div>

      <CoverStats
        stats={[
          { label: "AI reviews", value: totals.ai, note: `${percent(totals.ai, all)}% of ${all} reviews`, tone: "blue" },
          { label: "Free reviews", value: totals.free, note: `${percent(totals.free, all)}% of ${all} reviews`, tone: "green" },
          { label: "AI calls that worked", value: calls, note: failed ? `${failed} failed and moved to the next service` : "None failed", tone: "deep" },
          { label: "Tokens used", value: tokens.toLocaleString("en-IN"), note: "All on free plans", tone: "yellow" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <BarChart
            title="AI reviews per day"
            points={days.map((day) => ({ label: day.label, values: day.byProvider }))}
            series={[...PROVIDER_SERIES]}
            ariaLabel="AI reviews each day, split by the AI service that wrote them."
            emptyText="No AI reviews in this period yet."
          />
        </Panel>
        <Panel>
          <BarChart
            title="Free and AI reviews per day"
            points={days.map((day) => ({ label: day.label, values: { free: day.free, ai: day.ai } }))}
            series={[FREE, AI]}
            ariaLabel="Free reviews and AI reviews each day."
            emptyText="No reviews in this period yet."
          />
        </Panel>
      </div>
      {range === "all" && <p className="text-sm text-moss">Charts and the numbers above cover the last 90 days.</p>}

      <Panel title="AI services">
        {providers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left text-sm tabular-nums">
              <thead className="text-moss">
                <tr>
                  <th className="py-2 pr-3 font-medium">Service</th>
                  <th className="py-2 pr-3 text-right font-medium">Worked</th>
                  <th className="py-2 pr-3 text-right font-medium">Failed</th>
                  <th className="py-2 pr-3 text-right font-medium">Average speed</th>
                  <th className="py-2 text-right font-medium">Tokens used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {providers.map((row) => (
                  <tr key={row.provider}>
                    <td className="py-2.5 pr-3 font-medium capitalize">{NAMES[row.provider] ?? row.provider}</td>
                    <td className="py-2.5 pr-3 text-right">{row.calls}</td>
                    <td className="py-2.5 pr-3 text-right">{row.failed}</td>
                    <td className="py-2.5 pr-3 text-right">{row.avgMs ? `${(row.avgMs / 1000).toFixed(1)} s` : "—"}</td>
                    <td className="py-2.5 text-right">{row.tokens.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-moss">No AI calls in this period yet.</p>
        )}
      </Panel>
    </section>
  );
}
