import Link from "next/link";
import { CircleCheck, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getAttention } from "@/lib/admin/attention";
import { getOverview } from "@/lib/admin/tracking";
import { parseRange, percent } from "@/lib/admin/tracking-core";
import { shopTone, TONE_CLASS } from "@/lib/admin/tones";
import { requireAdminPage } from "@/lib/auth/guard";
import { cn } from "@/lib/utils";
import { ActivityChart } from "./_components/ActivityChart";
import { ActivityFeed, CoverStats, FunnelBars, GeminiUsage, PageHead, Panel, RangeTabs, RatingBars } from "./_components/TrackingBlocks";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  await requireAdminPage();
  const range = parseRange((await searchParams).range);
  const [{ shops, totals, rating, daily, gemini, activity }, attention] = await Promise.all([getOverview(range), getAttention("OPEN", 1, undefined, 3)]);
  const topShops = [...shops].sort((a, b) => b.scans - a.scans).slice(0, 5);

  if (shops.length === 0) {
    return (
      <>
        <PageHead title="Dashboard" />
        <div className="relative mt-6 overflow-hidden rounded-l-md rounded-r-3xl bg-g-blue p-8 text-white shadow-[inset_12px_0_16px_-10px_rgb(0_0_0/0.4)] sm:p-12">
          <h2 className="max-w-[16ch] text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-none">Add your first business</h2>
          <p className="mt-4 max-w-md text-white/90">Choose its type and enter the name. Its chips and QR poster are created automatically, and tracking starts from the first scan.</p>
          <Link href="/admin/shops/new" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-g-blue">
            <Plus aria-hidden className="size-4" /> Add business
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-5">
      <PageHead
        title="Dashboard"
        text={`${shops.length} ${shops.length === 1 ? "business" : "businesses"}. Dates use India time.`}
        action={<Link href="/admin/shops/new" className={cn(buttonVariants(), "max-lg:hidden")}><Plus aria-hidden className="size-4" /> Add business</Link>}
      />
      <RangeTabs base="/admin" range={range} />
      <CoverStats
        stats={[
          { label: "QR scans", value: totals.scans, note: "Unique customers", tone: "blue" },
          { label: "Reviews ready", value: totals.drafts, note: `${percent(totals.drafts, totals.scans)}% of scans`, tone: "deep" },
          { label: "Sent to Google", value: totals.google, note: `${percent(totals.google, totals.scans)}% of scans`, tone: "green" },
          { label: "Needs attention", value: attention.open, note: attention.open ? "Open customer issues" : "All clear", tone: "red", href: "/admin/attention" },
        ]}
      />
      <p className="text-sm text-moss">Sent to Google means the customer opened the Google review page. Google does not tell us whether they tapped Post.</p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Panel><ActivityChart points={daily} /></Panel>
        <Panel title="Needs attention" action={<Link href="/admin/attention" className="inline-flex min-h-10 items-center text-sm font-semibold text-g-blue hover:underline">View all</Link>}>
          {attention.items.length ? (
            <ul className="space-y-2.5">
              {attention.items.map((item) => (
                <li key={item.id}>
                  <Link href={`/admin/shops/${item.shopId}?tab=attention`} className="block rounded-xl border-l-4 border-g-red bg-g-red-tint/60 p-3 hover:bg-g-red-tint">
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold"><span className="truncate">{item.shopName}</span><span className="shrink-0">{item.rating} star</span></span>
                    <span className="mt-1 line-clamp-2 text-sm text-moss">{item.message ?? "Low rating, no private message"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 rounded-xl bg-g-green-tint p-4 text-sm font-medium text-g-green"><CircleCheck aria-hidden className="size-4" /> No open customer issues.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Panel title="Customer journey"><FunnelBars funnel={totals} /></Panel>
        <Panel title="Ratings"><RatingBars ratings={rating.breakdown} /></Panel>
        <Panel title="Gemini usage"><GeminiUsage usage={gemini} /></Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Panel title="Top businesses" action={<Link href={{ pathname: "/admin/tracking", query: { range } }} className="inline-flex min-h-10 items-center text-sm font-semibold text-g-blue hover:underline">Open tracking</Link>}>
          <ul className="divide-y divide-line">
            {topShops.map((shop) => (
              <li key={shop.id}>
                <Link href={{ pathname: `/admin/shops/${shop.id}`, query: { range } }} className="flex items-center gap-3 py-2.5 hover:text-g-blue">
                  <span aria-hidden className={cn("flex size-10 shrink-0 items-center justify-center rounded-l-sm rounded-r-lg font-display text-lg font-semibold shadow-[inset_4px_0_6px_-4px_rgb(0_0_0/0.4)]", TONE_CLASS[shopTone(shop.id)])}>{shop.name.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{shop.name}</span><span className="block truncate text-sm text-moss">{shop.businessCategory}</span></span>
                  <span className="shrink-0 text-right text-sm tabular-nums text-moss"><span className="block font-semibold text-ink">{shop.scans} {shop.scans === 1 ? "scan" : "scans"}</span>{shop.google} to Google</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent activity"><ActivityFeed items={activity.slice(0, 6)} /></Panel>
      </div>
    </div>
  );
}
