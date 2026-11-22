import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isUuid, publicQrUrl } from "@/lib/admin/api";
import { requireAdminPage } from "@/lib/auth/guard";
import { getShopTracking } from "@/lib/admin/tracking";
import { formatWhen, parseRange, percent } from "@/lib/admin/tracking-core";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { ActivityChart } from "../../_components/ActivityChart";
import { ChipManager } from "../../_components/ChipManager";
import { QrManager } from "../../_components/QrManager";
import { ShopForm } from "../../_components/ShopForm";
import { ActivityFeed, ChipBars, FunnelBars, GeminiUsage, Pager, Panel, RangeTabs, RatingBars, ReviewList, StatRow } from "../../_components/TrackingBlocks";

type Search = { range?: string | string[]; tab?: string | string[]; page?: string | string[] };

export default async function ShopPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Search> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const search = await searchParams;
  const range = parseRange(search.range);
  const tab = search.tab === "manage" ? "manage" : "tracking";
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
  const tracking = tab === "tracking" ? await getShopTracking(shop.id, range, requestedPage) : null;

  return (
    <>
      <Link href={{ pathname: "/admin", query: { range } }} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-moss hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> Dashboard
      </Link>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-[2.35rem] font-bold">{shop.name}</h1>
        <span className={`font-semibold ${shop.isActive ? "text-pine" : "text-moss"}`}>
          {shop.isActive ? "Live" : "Paused"}
        </span>
      </div>
      <p className="mt-1 text-moss">{shop.businessCategory}. Created {formatWhen(shop.createdAt)}.</p>

      <nav aria-label="Shop sections" className="mt-5 flex gap-1 border-b border-line">
        {(["tracking", "manage"] as const).map((item) => (
          <Link
            key={item}
            href={{ pathname: base, query: item === "manage" ? { tab: item, range } : { range } }}
            aria-current={tab === item ? "page" : undefined}
            className={cn("-mb-px inline-flex min-h-11 items-center border-b-2 px-4 font-semibold", tab === item ? "border-g-blue text-g-blue" : "border-transparent text-moss hover:text-ink")}
          >
            {item === "tracking" ? "Tracking" : "QR, chips and details"}
          </Link>
        ))}
      </nav>

      {tracking ? (
        <div className="mt-6 space-y-5">
          <RangeTabs base={base} range={range} />
          <StatRow funnel={tracking.funnel} average={tracking.rating.average} />
          <p className="text-sm text-moss">Sent to Google means the customer opened this shop&apos;s Google review page. Google does not tell us whether they tapped Post.</p>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Panel><ActivityChart points={tracking.daily} /></Panel>
            <Panel title="Recent activity"><ActivityFeed items={tracking.activity} showShop={false} /></Panel>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
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
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
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
              chips={shop.chips.map((chip) => ({ id: chip.id, label: chip.label, isActive: chip.isActive }))}
            />
          </div>
          <aside aria-labelledby="details-title">
            <h2 id="details-title" className="mb-4 text-2xl font-semibold">
              Shop details
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
                isActive: shop.isActive,
              }}
            />
          </aside>
        </div>
      )}
    </>
  );
}
