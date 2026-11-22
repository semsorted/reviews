import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/guard";
import { getOverview } from "@/lib/admin/tracking";
import { parseRange } from "@/lib/admin/tracking-core";
import { ActivityChart } from "./_components/ActivityChart";
import { ShopList } from "./_components/ShopList";
import { ActivityFeed, FunnelBars, GeminiUsage, Panel, RangeTabs, RatingBars, StatRow } from "./_components/TrackingBlocks";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  await requireAdminPage();
  const range = parseRange((await searchParams).range);
  const { shops, totals, rating, daily, gemini, activity } = await getOverview(range);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2.35rem] font-bold">Dashboard</h1>
          <p className="mt-1 text-moss">{shops.length} {shops.length === 1 ? "shop" : "shops"}. Dates use India time.</p>
        </div>
        <Link href="/admin/shops/new" className={buttonVariants()}>
          <Plus aria-hidden className="size-4" /> Add shop
        </Link>
      </div>

      {shops.length > 0 ? (
        <div className="mt-6 space-y-5">
          <RangeTabs base="/admin" range={range} />
          <StatRow funnel={totals} average={rating.average} />
          <p className="text-sm text-moss">Sent to Google means the customer opened your Google review page. Google does not tell us whether they tapped Post.</p>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Panel><ActivityChart points={daily} /></Panel>
            <Panel title="Recent activity" className="lg:row-span-2"><ActivityFeed items={activity} /></Panel>
            <div className="grid gap-5 md:grid-cols-3">
              <Panel title="Customer journey"><FunnelBars funnel={totals} /></Panel>
              <Panel title="Ratings"><RatingBars ratings={rating.breakdown} /></Panel>
              <Panel title="Gemini usage"><GeminiUsage usage={gemini} /></Panel>
            </div>
          </div>

          <section aria-labelledby="shops-title">
            <h2 id="shops-title" className="mb-3 text-2xl font-semibold">Shops</h2>
            <ShopList shops={shops} range={range} />
          </section>
        </div>
      ) : (
        <div className="mt-8 rounded-xl bg-paper p-8">
          <h2 className="text-2xl font-semibold">Add your first shop</h2>
          <p className="mt-2 max-w-md text-moss">
            Enter the shop details and its chips. Its first QR code is created automatically, and tracking starts from the first scan.
          </p>
          <Link href="/admin/shops/new" className={`${buttonVariants()} mt-5`}>
            Add shop
          </Link>
        </div>
      )}
    </>
  );
}
