import type { Section } from "@/lib/admin/payments-core";
import { formatInr } from "@/lib/poster-pricing";
import { BarChart } from "./BarChart";
import { CoverStats, Panel } from "./TrackingBlocks";

const SERIES = [{ key: "amount", name: "Collected", color: "#2a78d6" }];
const when = (date: Date) => date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

export function PaymentSection({
  id,
  title,
  text,
  section,
  labels,
  unit,
  emptyText,
}: {
  id: string;
  title: string;
  text: string;
  section: Section;
  labels: { thisMonth: string; lastMonth: string };
  unit: { one: string; many: string };
  emptyText: string;
}) {
  const { thisMonth, lastMonth, change, allTime } = section;
  const difference = thisMonth - lastMonth;

  return (
    <section aria-labelledby={id} className="space-y-4">
      <div>
        <h2 id={id} className="text-2xl font-semibold">{title}</h2>
        <p className="mt-1 max-w-[66ch] text-moss">{text}</p>
      </div>

      <CoverStats
        stats={[
          { label: `This month (${labels.thisMonth})`, value: formatInr(thisMonth), note: "Collected so far", tone: "green" },
          { label: `Last time (${labels.lastMonth})`, value: formatInr(lastMonth), note: "Whole month", tone: "blue" },
          {
            label: "Change from last time",
            value: change === null ? (thisMonth > 0 ? "New" : "—") : `${change > 0 ? "+" : ""}${change}%`,
            note: difference === 0 ? "Same as last month" : `${difference > 0 ? "+" : "-"}${formatInr(Math.abs(difference))} vs last month`,
            tone: difference < 0 ? "red" : "deep",
          },
          { label: "All time", value: formatInr(allTime.amount), note: `${plural(allTime.payments, "payment")} from ${plural(allTime.businesses, unit.one, unit.many)}`, tone: "yellow" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <BarChart
            title="Collected each month"
            points={section.monthPoints.map((point) => ({ label: point.label, values: { amount: point.amount } }))}
            series={SERIES}
            prefix="₹"
            ariaLabel={`Money collected from ${unit.many} in each of the last 6 months.`}
            emptyText={emptyText}
          />
        </Panel>
        <Panel>
          <BarChart
            title="Collected each day"
            points={section.dayPoints.map((point) => ({ label: point.label, values: { amount: point.amount } }))}
            series={SERIES}
            prefix="₹"
            ariaLabel={`Money collected from ${unit.many} each day.`}
            emptyText="Nothing collected in this period."
          />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={`By ${unit.one}`}>
          {section.businesses.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[22rem] text-left text-sm tabular-nums">
                <thead className="text-moss">
                  <tr>
                    <th className="py-2 pr-3 font-medium">{unit.one.charAt(0).toUpperCase() + unit.one.slice(1)}</th>
                    <th className="py-2 pr-3 text-right font-medium">Payments</th>
                    <th className="py-2 pr-3 text-right font-medium">Last paid</th>
                    <th className="py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {section.businesses.map((business) => (
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
                    <td className="py-2.5 pr-3">All added up</td>
                    <td className="py-2.5 pr-3 text-right">{allTime.payments}</td>
                    <td />
                    <td className="py-2.5 text-right">{formatInr(allTime.amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-moss">{emptyText}</p>
          )}
        </Panel>

        <Panel title="Latest">
          {section.recent.length ? (
            <ul className="divide-y divide-line">
              {section.recent.map((sale) => (
                <li key={sale.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{sale.name}</span>
                    <span className="block truncate text-moss">{sale.detail} · {when(sale.at)}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatInr(sale.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-moss">Nothing yet.</p>
          )}
        </Panel>
      </div>
    </section>
  );
}
