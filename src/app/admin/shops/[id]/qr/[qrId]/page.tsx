import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isUuid, publicQrUrl } from "@/lib/admin/api";
import { requireAdminPage } from "@/lib/auth/guard";
import { parseDesign, type PosterDesign } from "@/lib/poster-pricing";
import { prisma } from "@/lib/prisma";
import { posterFor } from "@/lib/qr/poster";
import { generateQrSvg, upiPayee } from "@/lib/qr/generator";
import { isSubscribed } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { BrandPanel } from "../../../../_components/BrandPanel";
import { PosterCheckout } from "../../../../_components/PosterCheckout";
import { CustomPoster, NormalPoster } from "../../../../_components/QrPosters";

export const metadata = { title: "QR poster" };

const SIZES = { a4: { label: "A4 wall poster", page: "A4 portrait" }, a5: { label: "A5 counter card", page: "A5 portrait" } } as const;
const DESIGNS: { id: PosterDesign; label: string }[] = [{ id: "normal", label: "Normal" }, { id: "custom", label: "Custom" }];
const svgSrc = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const tabClass = (active: boolean) => cn("inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold", active ? "bg-night text-white" : "text-moss hover:text-ink");

export default async function QrPosterPage({ params, searchParams }: { params: Promise<{ id: string; qrId: string }>; searchParams: Promise<{ size?: string | string[]; design?: string | string[] }> }) {
  await requireAdminPage();
  const { id, qrId } = await params;
  if (!isUuid(id) || !isUuid(qrId)) notFound();
  const query = await searchParams;
  const size: keyof typeof SIZES = query.size === "a5" ? "a5" : "a4";
  const design = parseDesign(query.design);

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

  const { shop } = qr;
  const poster = posterFor(shop.businessCategory, shop.defaultLanguage, shop.primaryColor, { surface: shop.surfaceColor, accent: shop.accentColor });
  // Normal and Custom print the same review QR.
  const qrSrc = svgSrc(await generateQrSvg({ url: publicQrUrl(qr.publicToken), margin: 4 }));
  const base = `/admin/shops/${id}/qr/${qrId}`;
  // The repo is public, so the UPI link stays in a server-only setting.
  const paymentUrl = process.env.PAYMENT_UPI_URL?.trim();
  const payee = upiPayee(paymentUrl);
  const payment = paymentUrl && payee !== null ? { qr: svgSrc(await generateQrSvg({ url: paymentUrl, margin: 4 })), payee } : null;

  return (
    <div className="space-y-5 print:space-y-0">
      <style>{`@page{size:${design === "normal" ? "4in 6in" : SIZES[size].page};margin:0}`}</style>
      <div className="space-y-4 print:hidden">
        <Link href={`/admin/shops/${id}?tab=manage`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-moss hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> {shop.name}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <nav aria-label="Poster design" className="inline-flex rounded-full bg-paper p-1">
              {DESIGNS.map((item) => (
                <Link key={item.id} href={{ pathname: base, query: { size, design: item.id } }} replace scroll={false} aria-current={design === item.id ? "page" : undefined} className={tabClass(design === item.id)}>{item.label}</Link>
              ))}
            </nav>
            {design === "normal" ? (
              <span className="inline-flex min-h-12 items-center rounded-full bg-paper px-5 text-sm font-semibold text-moss">4×6 inch</span>
            ) : (
              <nav aria-label="Poster size" className="inline-flex rounded-full bg-paper p-1">
                {(Object.keys(SIZES) as (keyof typeof SIZES)[]).map((key) => (
                  <Link key={key} href={{ pathname: base, query: { size: key, design } }} replace scroll={false} aria-current={size === key ? "page" : undefined} className={tabClass(size === key)}>{SIZES[key].label}</Link>
                ))}
              </nav>
            )}
          </div>
          <PosterCheckout base={base} size={size} design={design} prices={{ normal: pricing.normalPrice, custom: pricing.customPrice }} coupons={coupons} payment={payment} />
        </div>
        {!isSubscribed(shop.subscriptionEndsAt) ? (
          <p role="alert" className="rounded-xl bg-g-red-tint p-3 text-sm font-semibold text-g-red">This subscription has ended. Renew it before printing, or customers cannot use this QR.</p>
        ) : (!qr.isActive || !shop.isActive) && (
          <p role="alert" className="rounded-xl bg-g-red-tint p-3 text-sm font-semibold text-g-red">This QR is paused. Customers cannot use it until you activate it.</p>
        )}
      </div>

      {design === "normal" ? (
        <NormalPoster shopName={shop.name} qrSrc={qrSrc} qrName={qr.name} />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,34rem)_minmax(18rem,24rem)] lg:justify-center print:block">
          <CustomPoster size={size} shopName={shop.name} logoUrl={shop.logoUrl} qrSrc={qrSrc} qrName={qr.name} poster={poster} />
          <div className="print:hidden">
            <BrandPanel shopId={id} website={shop.websiteUrl ?? ""} hasLogo={Boolean(shop.logoUrl)} current={{ primary: poster.background, surface: poster.page, accent: poster.accent }} />
          </div>
        </div>
      )}
    </div>
  );
}
