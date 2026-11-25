import { getPayments } from "@/lib/admin/payments";
import { changePercent } from "@/lib/admin/report-core";
import { parseRange } from "@/lib/admin/tracking-core";
import { requireAdminPage } from "@/lib/auth/guard";
import { formatInr } from "@/lib/poster-pricing";
import { PaymentSection } from "../_components/PaymentSection";
import { CoverStats, PageHead, RangeTabs } from "../_components/TrackingBlocks";

export const metadata = { title: "Payments" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  await requireAdminPage();
  const range = parseRange((await searchParams).range);
  const { restaurants, qr, qrPrice, labels, combined } = await getPayments(range);
  const change = changePercent(combined.thisMonth, combined.lastMonth);
  const difference = combined.thisMonth - combined.lastMonth;

  return (
    <div className="space-y-8">
      <PageHead title="Payments" text="Everything collected, split into restaurants and QR businesses, and how it compares with last month." />
      <RangeTabs base="/admin/payments" range={range} />

      <CoverStats
        stats={[
          { label: `Both together, ${labels.thisMonth}`, value: formatInr(combined.thisMonth), note: "Restaurants + QR", tone: "green" },
          { label: `Last time (${labels.lastMonth})`, value: formatInr(combined.lastMonth), note: "Restaurants + QR", tone: "blue" },
          {
            label: "Change from last time",
            value: change === null ? (combined.thisMonth > 0 ? "New" : "—") : `${change > 0 ? "+" : ""}${change}%`,
            note: difference === 0 ? "Same as last month" : `${difference > 0 ? "+" : "-"}${formatInr(Math.abs(difference))} vs last month`,
            tone: difference < 0 ? "red" : "deep",
          },
          { label: "All time", value: formatInr(combined.allTime), note: `From ${combined.businesses} ${combined.businesses === 1 ? "business" : "businesses"}`, tone: "yellow" },
        ]}
      />

      <PaymentSection
        id="pay-qr"
        title="QR businesses"
        text={`Each QR business counts once at ${formatInr(qrPrice)}, on the day it was added. The price is the Normal poster price in Settings.`}
        section={qr}
        labels={labels}
        unit={{ one: "business", many: "businesses" }}
        emptyText="No QR business added yet."
      />

      <PaymentSection
        id="pay-restaurants"
        title="Restaurants"
        text="Plan payments you confirm on a restaurant's Plan tab. They show here with their receipt."
        section={restaurants}
        labels={labels}
        unit={{ one: "restaurant", many: "restaurants" }}
        emptyText="No restaurant payment recorded yet."
      />
    </div>
  );
}
