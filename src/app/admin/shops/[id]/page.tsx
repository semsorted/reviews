import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BellRing, ChartNoAxesCombined, CircleCheck, QrCode } from "lucide-react";
import { isUuid, publicQrUrl } from "@/lib/admin/api";
import { getAttention, parseAttentionFilter } from "@/lib/admin/attention";
import { getShopTracking } from "@/lib/admin/tracking";
import { formatWhen, parseRange, percent } from "@/lib/admin/tracking-core";
import { shopTone, TONE_CLASS } from "@/lib/admin/tones";
import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { formatEndDate, renewedEnd, subscriptionInfo } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { ActivityChart } from "../../_components/ActivityChart";
import { AttentionList } from "../../_components/AttentionList";
import { ChipManager } from "../../_components/ChipManager";
import { QrManager } from "../../_components/QrManager";
import { ShopForm } from "../../_components/ShopForm";
import { SubscriptionPanel } from "../../_components/SubscriptionPanel";
import { ActivityFeed, ChipBars, CoverStats, FunnelBars, GeminiUsage, Pager, Panel, RangeTabs, RatingBars, ReviewList } from "../../_components/TrackingBlocks";

type Search = { range?: string | string[]; tab?: string | string[]; page?: string | string[]; status?: string | string[] };

const TABS = [
  { id: "tracking", label: "Tracking", icon: ChartNoAxesCombined },
  { id: "attention", label: "Needs attention", icon: BellRing },
  { id: "manage", label: "QR, chips and details", icon: QrCode },
] as const;

export default async function ShopPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Search> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const search = await searchParams;
  const range = parseRange(search.range);
  const tab = TABS.find((item) => item.id === search.tab)?.id ?? "tracking";
  const requestedPage = typeof search.page === "string" && /^[1-9]\d{0,5}$/.test(search.page) ? Number(search.page) : 1;

  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      chips: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      qrCodes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!shop) notFound();

  const base = `/admin/shops/${shop.id}`;
  const subscription = subscriptionInfo(shop.subscriptionEndsAt);
  const attentionFilter = parseAttentionFilter(search.status);
  const [tracking, attention] = await Promise.all([
    tab === "tracking" ? getShopTracking(shop.id, range, requestedPage) : null,
    getAttention(tab === "attention" ? attentionFilter : "OPEN", tab === "attention" ? requestedPage : 1, shop.id),
  ]);

  return (
    <div className="space-y-5">
      <Link href="/admin/shops" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-moss hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> All businesses
      </Link>

      <header className={cn("relative overflow-hidden rounded-l-md rounded-r-3xl p-6 pl-7 shadow-[inset_12px_0_16px_-10px_rgb(0_0_0/0.4)] sm:p-8 sm:pl-9", TONE_CLASS[shopTone(shop.id)])}>
        <svg aria-hidden viewBox="-2 -2 52 52" className="absolute -right-6 -top-14 size-72 opacity-[0.13]">
          <path fill="none" stroke="currentColor" strokeWidth="8.5" d="M34 14A10 10 0 1 0 24 24A10 10 0 1 1 14 34" />
        </svg>
        <div className="relative">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <span className="rounded-full bg-black/15 px-2.5 py-0.5 font-semibold">{subscription.state === "expired" ? "Expired" : shop.isActive ? "Live" : "Paused"}</span>
            {shop.businessCategory}
          </p>
          <h1 className="mt-3 max-w-[20ch] break-words text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-none">{shop.name}</h1>
          <p className="mt-3 text-sm opacity-90">Created {formatWhen(shop.createdAt)}</p>
        </div>
      </header>

      <SubscriptionPanel shopId={shop.id} info={subscription} renewedOn={formatEndDate(renewedEnd(shop.subscriptionEndsAt))} />

      <nav aria-label="Business sections" className="flex gap-1 overflow-x-auto rounded-full bg-paper p-1">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={{ pathname: base, query: item.id === "tracking" ? { range } : { tab: item.id, range } }}
              aria-current={tab === item.id ? "page" : undefined}
              className={cn("inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold", tab === item.id ? "bg-night text-white" : "text-moss hover:text-ink")}
            >
              <Icon aria-hidden className="size-4" /> {item.label}
              {item.id === "attention" && attention.open > 0 && <span className="min-w-5 rounded-full bg-g-red px-1 text-center text-xs font-bold leading-5 text-white">{attention.open}</span>}
            </Link>
          );
        })}
      </nav>

      {tracking && (
        <>
          <RangeTabs base={base} range={range} />
          <CoverStats
            stats={[
              { label: "QR scans", value: tracking.funnel.scans, note: "Unique customers", tone: "blue" },
              { label: "Reviews ready", value: tracking.funnel.drafts, note: `${percent(tracking.funnel.drafts, tracking.funnel.scans)}% of scans`, tone: "deep" },
              { label: "Sent to Google", value: tracking.funnel.google, note: `${percent(tracking.funnel.google, tracking.funnel.scans)}% of scans`, tone: "green" },
              { label: "Average rating", value: tracking.rating.average === null ? "None" : tracking.rating.average.toFixed(1), note: "From customer taps", tone: "yellow" },
            ]}
          />
          <p className="text-sm text-moss">Sent to Google means the customer opened this business&apos;s Google review page. Google does not tell us whether they tapped Post.</p>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Panel><ActivityChart points={tracking.daily} /></Panel>
            <Panel title="Recent activity"><ActivityFeed items={tracking.activity} showShop={false} /></Panel>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Panel title="Customer journey"><FunnelBars funnel={tracking.funnel} /></Panel>
            <Panel title="Ratings"><RatingBars ratings={tracking.rating.breakdown} /></Panel>
            <Panel title="Top chips"><ChipBars chips={tracking.chips} /></Panel>
            <Panel title="Gemini usage"><GeminiUsage usage={tracking.gemini} /></Panel>
          </div>

          <Panel title="QR performance">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm tabular-nums">
                <thead className="text-moss">
                  <tr><th className="pb-2 font-medium">QR</th><th className="pb-2 text-right font-medium">Scans</th><th className="pb-2 text-right font-medium">Sent to Google</th><th className="pb-2 text-right font-medium">Rate</th><th className="pb-2 text-right font-medium">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shop.qrCodes.map((qr) => {
                    const scans = tracking.qrStat(qr.id, "qr_scan");
                    const google = tracking.qrStat(qr.id, "google_review_click");
                    return (
                      <tr key={qr.id}>
                        <td className="py-2.5 font-medium">{qr.name}</td>
                        <td className="py-2.5 text-right">{scans}</td>
                        <td className="py-2.5 text-right">{google}</td>
                        <td className="py-2.5 text-right">{percent(google, scans)}%</td>
                        <td className="py-2.5 text-right">{qr.isActive ? "Live" : "Paused"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title={`Reviews (${tracking.total})`}>
            <ReviewList reviews={tracking.reviews} />
            <Pager base={base} page={requestedPage} pages={tracking.pages} params={{ range }} />
          </Panel>
        </>
      )}

      {tab === "attention" && (
        <>
          <nav aria-label="Issue status" className="inline-flex rounded-full bg-paper p-1">
            {(["OPEN", "RESOLVED", "ALL"] as const).map((filter) => (
              <Link
                key={filter}
                href={{ pathname: base, query: { tab: "attention", range, status: filter } }}
                aria-current={filter === attentionFilter ? "page" : undefined}
                className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold", filter === attentionFilter ? "bg-g-red text-white" : "text-moss hover:text-ink")}
              >
                {filter === "OPEN" ? "Open" : filter === "RESOLVED" ? "Resolved" : "All"}
                <span className="tabular-nums opacity-80">{filter === "OPEN" ? attention.open : filter === "RESOLVED" ? attention.resolved : attention.open + attention.resolved}</span>
              </Link>
            ))}
          </nav>
          {attention.items.length ? (
            <>
              <AttentionList items={attention.items} showShop={false} />
              <Pager base={base} page={requestedPage} pages={attention.pages} params={{ tab: "attention", range, status: attentionFilter }} label="Issue pages" />
            </>
          ) : (
            <p className="flex items-center gap-2 rounded-2xl bg-g-green-tint p-6 font-medium text-g-green">
              <CircleCheck aria-hidden className="size-5" /> {attentionFilter === "OPEN" ? "No open customer issues for this business." : "Nothing to show here."}
            </p>
          )}
        </>
      )}

      {tab === "manage" && (
        <div className="grid gap-10 rounded-2xl bg-paper p-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-6">
          <div className="min-w-0 space-y-10">
            <QrManager
              shopId={shop.id}
              qrCodes={shop.qrCodes.map((qr) => ({
                id: qr.id,
                name: qr.name,
                url: publicQrUrl(qr.publicToken),
                scanCount: qr.scanCount,
                isActive: qr.isActive,
              }))}
            />
            <ChipManager
              shopId={shop.id}
              shopType={shop.businessCategory}
              chips={shop.chips.map((chip) => ({ id: chip.id, label: chip.label, isActive: chip.isActive, isPinned: chip.isPinned }))}
            />
          </div>
          <aside aria-labelledby="details-title">
            <h2 id="details-title" className="mb-4 text-2xl font-semibold">
              Business details
            </h2>
            <ShopForm
              shop={{
                id: shop.id,
                name: shop.name,
                businessCategory: shop.businessCategory,
                googleReviewUrl: shop.googleReviewUrl,
                defaultLanguage: shop.defaultLanguage,
                logoUrl: shop.logoUrl ?? "",
                primaryColor: shop.primaryColor,
                surfaceColor: shop.surfaceColor,
                accentColor: shop.accentColor,
                qrPrice: shop.qrPrice === null ? "" : String(shop.qrPrice),
                isActive: shop.isActive,
              }}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
