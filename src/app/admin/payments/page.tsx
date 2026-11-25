import { getPayments } from "@/lib/admin/payments";
import { parseRange } from "@/lib/admin/tracking-core";
import { requireAdminPage } from "@/lib/auth/guard";
import { formatInr } from "@/lib/poster-pricing";
import { BarChart } from "../_components/BarChart";
import { CoverStats, PageHead, Panel, RangeTabs } from "../_components/TrackingBlocks";

export const metadata = { title: "Payments" };

const when = (date: Date) => date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const SERIES = [{ key: "amount", name: "Collected", color: "#2a78d6" }];

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  await requireAdminPage();
  const range = parseRange((await searchParams).range);
  const data = await getPayments(range);
  const { thisMonth, lastMonth, change, allTime } = data;
  const difference = thisMonth.amount - lastMonth.amount;

  return (
    <div className="space-y-5">
      <PageHead title="Payments" text="Everything collected from businesses, added up, and how it compares with last month." />

      <CoverStats
        stats={[
          { label: `Collected in ${thisMonth.label}`, value: formatInr(thisMonth.amount), note: `${plural(thisMonth.added, "business", "businesses")} added this month`, tone: "green" },
          { label: `Last time (${lastMonth.label})`, value: formatInr(lastMonth.amount), note: `${plural(lastMonth.added, "business", "businesses")} added that month`, tone: "blue" },
          {
            label: "Change from last time",
            value: change === null ? (thisMonth.amount > 0 ? "New" : "—") : `${change > 0 ? "+" : ""}${change}%`,
            note: difference === 0 ? "Same as last month" : `${difference > 0 ? "+" : "-"}${formatInr(Math.abs(difference))} vs last month`,
            tone: difference < 0 ? "red" : "deep",
          },
          { label: "All time", value: formatInr(allTime.amount), note: `${plural(allTime.payments, "payment")} from ${plural(allTime.businesses, "business", "businesses")}`, tone: "yellow" },
        ]}
      />

      {allTime.payments === 0 && (
        <p className="rounded-2xl bg-paper p-5 text-moss">
          No payment has been recorded yet. A payment shows up here after you confirm it on a restaurant&apos;s Plan tab, and the amounts above add up by themselves.
        </p>
      )}

      <Panel>
        <BarChart
          title="Collected each month"
          points={data.monthPoints.map((point) => ({ label: point.label, values: { amount: point.amount } }))}
          series={SERIES}
          prefix="₹"
          ariaLabel="Money collected in each of the last 6 months."
          emptyText="Nothing collected in the last 6 months."
        />
      </Panel>

      <RangeTabs base="/admin/payments" range={range} />
      <Panel>
        <BarChart
          title="Collected each day"
          points={data.dayPoints.map((point) => ({ label: point.label, values: { amount: point.amount } }))}
          series={SERIES}
          prefix="₹"
          ariaLabel="Money collected each day."
          emptyText="Nothing collected in this period."
        />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="By business">
          {data.businesses.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem] text-left text-sm tabular-nums">
                <thead className="text-moss">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Business</th>
                    <th className="py-2 pr-3 text-right font-medium">Payments</th>
                    <th className="py-2 pr-3 text-right font-medium">Last paid</th>
                    <th className="py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.businesses.map((business) => (
                    <tr key={business.shopId}>
                      <td className="max-w-[12rem] truncate py-2.5 pr-3 font-medium">{business.name}</td>
                      <td className="py-2.5 pr-3 text-right">{business.payments}</td>
                      <td className="py-2.5 pr-3 text-right">{when(business.lastPaid)}</td>
                      <td className="py-2.5 text-right font-medium">{formatInr(business.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line font-semibold">
                    <td className="py-2.5 pr-3">All businesses</td>
                    <td className="py-2.5 pr-3 text-right">{allTime.payments}</td>
                    <td />
                    <td className="py-2.5 text-right">{formatInr(allTime.amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-moss">No business has paid yet.</p>
          )}
        </Panel>

        <Panel title="Recent payments">
          {data.recent.length ? (
            <ul className="divide-y divide-line">
              {data.recent.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{payment.shop.name}</span>
                    <span className="block truncate text-moss">
                      #{String(payment.receiptNo)} · {payment.planName} · {plural(payment.months, "month")} · {payment.method} · {when(payment.createdAt)}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatInr(payment.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-moss">No payments yet.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
