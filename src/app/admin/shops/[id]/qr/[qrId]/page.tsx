import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isUuid, publicQrUrl } from "@/lib/admin/api";
import { requireAdminPage } from "@/lib/auth/guard";
import { parseDesign, type PosterDesign } from "@/lib/poster-pricing";
import { prisma } from "@/lib/prisma";
import { posterFor } from "@/lib/qr/poster";
import { generateQrSvg, upiPayee } from "@/lib/qr/generator";
import { parsePosterSize, qrMm, type PosterSizeKey } from "@/lib/qr/poster-size";
import { isSubscribed } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { BrandPanel } from "../../../../_components/BrandPanel";
import { PosterCheckout } from "../../../../_components/PosterCheckout";
import { CustomPoster, NormalPoster } from "../../../../_components/QrPosters";

export const metadata = { title: "QR poster" };

const SIZE_TABS: { key: PosterSizeKey; label: string }[] = [
  { key: "4x6", label: "4×6 inch" },
  { key: "a5", label: "A5" },
  { key: "a4", label: "A4" },
  { key: "custom", label: "Custom size" },
];
const DESIGNS: { id: PosterDesign; label: string }[] = [{ id: "normal", label: "Normal" }, { id: "custom", label: "Custom" }];
const svgSrc = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const tabClass = (active: boolean) => cn("inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold", active ? "bg-night text-white" : "text-moss hover:text-ink");
const fieldClass = "mb-1 block text-sm font-semibold";

type Query = { size?: string | string[]; w?: string | string[]; h?: string | string[]; unit?: string | string[]; design?: string | string[] };

export default async function QrPosterPage({ params, searchParams }: { params: Promise<{ id: string; qrId: string }>; searchParams: Promise<Query> }) {
  await requireAdminPage();
  const { id, qrId } = await params;
  if (!isUuid(id) || !isUuid(qrId)) notFound();
  const query = await searchParams;
  const size = parsePosterSize(query);
  const design = parseDesign(query.design);
  const showSizeForm = query.size === "custom";

  const [qr, pricing, coupons] = await Promise.all([
    prisma.qrCode.findFirst({
      where: { id: qrId, shopId: id },
      select: {
        name: true,
        isActive: true,
        publicToken: true,
        shop: { select: { name: true, businessCategory: true, defaultLanguage: true, logoUrl: true, websiteUrl: true, primaryColor: true, surfaceColor: true, accentColor: true, isActive: true, subscriptionEndsAt: true } },
      },
    }),
    prisma.posterPricing.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.posterCoupon.findMany({ where: { isActive: true }, select: { code: true, amountOff: true } }),
  ]);
  if (!qr) notFound();
  // Restaurants keep everything on their own page, so "back" goes there.
  const isRestaurant = Boolean(await prisma.orderingSettings.findUnique({ where: { shopId: id }, select: { shopId: true } }));

  const { shop } = qr;
  const poster = posterFor(shop.businessCategory, shop.defaultLanguage, shop.primaryColor, { surface: shop.surfaceColor, accent: shop.accentColor });
  // Normal and Custom print the same review QR.
  const qrSrc = svgSrc(await generateQrSvg({ url: publicQrUrl(qr.publicToken), margin: 4 }));
  const base = `/admin/shops/${id}/qr/${qrId}`;
  const sizeQuery = new URLSearchParams(size.query).toString();
  const customQuery = { size: "custom", w: size.input.w || "5", h: size.input.h || "7", unit: size.input.unit || "in" };
  // The repo is public, so the UPI link stays in a server-only setting.
  const paymentUrl = process.env.PAYMENT_UPI_URL?.trim();
  const payee = upiPayee(paymentUrl);
  const payment = paymentUrl && payee !== null ? { qr: svgSrc(await generateQrSvg({ url: paymentUrl, margin: 4 })), payee } : null;
  const posterProps = { size, shopName: shop.name, qrSrc, qrName: qr.name };

  return (
    <div className="space-y-5 print:space-y-0">
      <style>{`@page{size:${size.wMm}mm ${size.hMm}mm;margin:0}`}</style>
      <div className="space-y-4 print:hidden">
        <Link href={isRestaurant ? `/admin/restaurants/${id}?tab=review` : `/admin/shops/${id}?tab=manage`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-moss hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> {shop.name}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <nav aria-label="Poster design" className="inline-flex rounded-full bg-paper p-1">
              {DESIGNS.map((item) => (
                <Link key={item.id} href={{ pathname: base, query: { ...size.query, design: item.id } }} replace scroll={false} aria-current={design === item.id ? "page" : undefined} className={tabClass(design === item.id)}>{item.label}</Link>
              ))}
            </nav>
            <nav aria-label="Poster size" className="inline-flex flex-wrap rounded-full bg-paper p-1">
              {SIZE_TABS.map((tab) => {
                const active = tab.key === "custom" ? showSizeForm : size.key === tab.key && !showSizeForm;
                return (
                  <Link key={tab.key} href={{ pathname: base, query: { ...(tab.key === "custom" ? customQuery : { size: tab.key }), design } }} replace scroll={false} aria-current={active ? "page" : undefined} className={tabClass(active)}>{tab.label}</Link>
                );
              })}
            </nav>
          </div>
          <PosterCheckout base={base} sizeQuery={sizeQuery} design={design} prices={{ normal: pricing.normalPrice, custom: pricing.customPrice }} coupons={coupons} payment={payment} />
        </div>

        {showSizeForm && (
          <form key={sizeQuery} method="get" action={base} className="flex flex-wrap items-end gap-3 rounded-2xl bg-paper p-4">
            <input type="hidden" name="design" value={design} />
            <input type="hidden" name="size" value="custom" />
            <label className="w-28">
              <span className={fieldClass}>Width</span>
              <Input name="w" type="number" inputMode="decimal" min="0.01" step="0.01" required defaultValue={customQuery.w} />
            </label>
            <label className="w-28">
              <span className={fieldClass}>Height</span>
              <Input name="h" type="number" inputMode="decimal" min="0.01" step="0.01" required defaultValue={customQuery.h} />
            </label>
            <label className="w-28">
              <span className={fieldClass}>Unit</span>
              <select name="unit" defaultValue={customQuery.unit} className="block min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-base">
                <option value="in">inch</option>
                <option value="cm">cm</option>
                <option value="mm">mm</option>
              </select>
            </label>
            <Button type="submit" variant="outline">Apply size</Button>
          </form>
        )}
        {size.error && <p role="alert" className="rounded-xl bg-g-yellow-tint p-3 text-sm font-semibold text-ink">{size.error}</p>}
        <p className="text-sm text-moss">
          Print size {size.wMm} × {size.hMm} mm. QR prints about {Math.floor(qrMm(size, design))} mm wide.
        </p>

        {!isSubscribed(shop.subscriptionEndsAt) ? (
          <p role="alert" className="rounded-xl bg-g-red-tint p-3 text-sm font-semibold text-g-red">This subscription has ended. Renew it before printing, or customers cannot use this QR.</p>
        ) : (!qr.isActive || !shop.isActive) && (
          <p role="alert" className="rounded-xl bg-g-red-tint p-3 text-sm font-semibold text-g-red">This QR is paused. Customers cannot use it until you activate it.</p>
        )}
      </div>

      {design === "normal" ? (
        <NormalPoster {...posterProps} />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,34rem)_minmax(18rem,24rem)] lg:justify-center print:block">
          <CustomPoster {...posterProps} logoUrl={shop.logoUrl} poster={poster} />
          <div className="print:hidden">
            <BrandPanel shopId={id} website={shop.websiteUrl ?? ""} hasLogo={Boolean(shop.logoUrl)} current={{ primary: poster.background, surface: poster.page, accent: poster.accent }} />
          </div>
        </div>
      )}
    </div>
  );
}
