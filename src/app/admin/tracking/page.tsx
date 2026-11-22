import { getOverview } from "@/lib/admin/tracking";
import { parseRange, percent } from "@/lib/admin/tracking-core";
import { requireAdminPage } from "@/lib/auth/guard";
import { ActivityChart } from "../_components/ActivityChart";
import { ShopList } from "../_components/ShopList";
import { CoverStats, FunnelBars, PageHead, Panel, RangeTabs, RatingBars } from "../_components/TrackingBlocks";

export const metadata = { title: "Tracking" };

export default async function TrackingPage({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  await requireAdminPage();
  const range = parseRange((await searchParams).range);
  const { shops, totals, rating, daily } = await getOverview(range);

  return (
    <div className="space-y-5">
      <PageHead title="Tracking" text="Compare every business, then open one to see its reviews, ratings, chips and QR performance." />
      <RangeTabs base="/admin/tracking" range={range} />
      <CoverStats
        stats={[
          { label: "QR scans", value: totals.scans, note: "Unique customers", tone: "blue" },
          { label: "Reviews ready", value: totals.drafts, note: `${percent(totals.drafts, totals.scans)}% of scans`, tone: "deep" },
          { label: "Copied", value: totals.copied, note: `${percent(totals.copied, totals.drafts)}% of reviews`, tone: "yellow" },
          { label: "Sent to Google", value: totals.google, note: `${percent(totals.google, totals.scans)}% of scans`, tone: "green" },
        ]}
      />
      <section aria-labelledby="track-shops">
        <h2 id="track-shops" className="mb-3 text-2xl font-semibold">Business tracking</h2>
        {shops.length ? <ShopList shops={shops} range={range} /> : <p className="rounded-2xl bg-paper p-6 text-moss">Add a business to start tracking.</p>}
      </section>
      <Panel><ActivityChart points={daily} /></Panel>
      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Customer journey"><FunnelBars funnel={totals} /></Panel>
        <Panel title="Ratings"><RatingBars ratings={rating.breakdown} /></Panel>
      </div>
    </div>
  );
}
