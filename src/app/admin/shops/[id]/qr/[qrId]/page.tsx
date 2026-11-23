import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { isUuid, publicQrUrl } from "@/lib/admin/api";
import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { posterFor } from "@/lib/qr/poster";
import { generateQrSvg } from "@/lib/qr/generator";
import { isSubscribed } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { BrandPanel } from "../../../../_components/BrandPanel";
import { PrintButton } from "../../../../_components/PrintButton";

export const metadata = { title: "Print QR poster" };

const SIZES = { a4: { label: "A4 wall poster", page: "A4" }, a5: { label: "A5 counter card", page: "A5" } } as const;

const nameSize = (name: string) => (name.length <= 18 ? "text-[7.6cqw]" : name.length <= 32 ? "text-[5.6cqw]" : name.length <= 50 ? "text-[4.4cqw]" : "text-[3.6cqw]");
const headlineSize = (text: string) => (text.length <= 19 ? "text-[9.6cqw]" : text.length <= 26 ? "text-[7.8cqw]" : "text-[7cqw]");
const POSTER_FONT = { fontFamily: "var(--font-outfit), var(--font-anek), ui-sans-serif, sans-serif" };

export default async function QrPosterPage({ params, searchParams }: { params: Promise<{ id: string; qrId: string }>; searchParams: Promise<{ size?: string | string[] }> }) {
  await requireAdminPage();
  const { id, qrId } = await params;
  if (!isUuid(id) || !isUuid(qrId)) notFound();
  const size = (await searchParams).size === "a5" ? "a5" : "a4";

  const qr = await prisma.qrCode.findFirst({
    where: { id: qrId, shopId: id },
    select: {
      name: true,
      isActive: true,
      publicToken: true,
      shop: { select: { name: true, businessCategory: true, defaultLanguage: true, logoUrl: true, websiteUrl: true, primaryColor: true, surfaceColor: true, accentColor: true, isActive: true, subscriptionEndsAt: true } },
    },
  });
  if (!qr) notFound();

  const { shop } = qr;
  const poster = posterFor(shop.businessCategory, shop.defaultLanguage, shop.primaryColor, { surface: shop.surfaceColor, accent: shop.accentColor });
  const svg = await generateQrSvg({ url: publicQrUrl(qr.publicToken), margin: 4 });
  const base = `/admin/shops/${id}/qr/${qrId}`;

  return (
    <div className="space-y-5 print:space-y-0">
      <style>{`@page{size:${SIZES[size].page} portrait;margin:0}`}</style>
      <div className="space-y-4 print:hidden">
        <Link href={`/admin/shops/${id}?tab=manage`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-moss hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> {shop.name}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Poster size" className="inline-flex rounded-full bg-paper p-1">
            {(Object.keys(SIZES) as (keyof typeof SIZES)[]).map((key) => (
              <Link key={key} href={{ pathname: base, query: { size: key } }} replace aria-current={size === key ? "page" : undefined} className={cn("inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold", size === key ? "bg-night text-white" : "text-moss hover:text-ink")}>
                {SIZES[key].label}
              </Link>
            ))}
          </nav>
          <PrintButton />
        </div>
        {!isSubscribed(shop.subscriptionEndsAt) ? (
          <p role="alert" className="rounded-xl bg-g-red-tint p-3 text-sm font-semibold text-g-red">This subscription has ended. Renew it before printing, or customers cannot use this QR.</p>
        ) : (!qr.isActive || !shop.isActive) && (
          <p role="alert" className="rounded-xl bg-g-red-tint p-3 text-sm font-semibold text-g-red">This QR is paused. Customers cannot use it until you activate it.</p>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,34rem)_minmax(18rem,24rem)] lg:justify-center print:block">
        <article data-size={size} lang={poster.lang === "hi" ? "hi" : "en"} className="qr-sheet relative mx-auto flex aspect-[210/297] w-full max-w-[34rem] flex-col overflow-hidden shadow-[0_24px_48px_-24px_rgb(6_24_56/0.55)] print:shadow-none" style={{ backgroundColor: poster.page, color: poster.ink }}>
          <div className="flex h-[46cqw] shrink-0 flex-col items-center px-[7cqw] pt-[5.5cqw] text-center">
            {shop.logoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shop.logoUrl} alt="" className="h-[14cqw] max-w-[46cqw] object-contain" />
                <h1 className="sr-only">{shop.name}</h1>
              </>
            ) : (
              <h1 className={cn("flex min-h-[12cqw] max-w-full items-center break-words font-semibold leading-[1.05] tracking-[-0.02em]", nameSize(shop.name))} style={POSTER_FONT}>{shop.name}</h1>
            )}
            <p className={cn("mt-[2.2cqw] max-w-[84cqw] text-balance font-semibold leading-[1.04] tracking-[-0.03em]", headlineSize(poster.headline))} style={POSTER_FONT}>{poster.headline}</p>
            <p className="mt-[1.5cqw] max-w-[70cqw] text-balance text-[2.9cqw] font-medium leading-[1.3]" style={{ color: poster.muted }}>{poster.line}</p>
          </div>

          <div className="relative mx-[7cqw] flex flex-1 flex-col items-center rounded-t-[43cqw] px-[5cqw] pb-[2.4cqw] pt-[7.5cqw]" style={{ backgroundColor: poster.background, color: poster.foreground }}>
            <span aria-hidden className="pointer-events-none absolute -inset-x-[1.8cqw] -top-[1.8cqw] bottom-0 rounded-t-[45cqw] border-[0.28cqw] border-b-0" style={{ borderColor: poster.accent }} />
            <span aria-hidden className="flex gap-[1cqw]" style={{ color: poster.accent }}>
              {[0, 1, 2, 3, 4].map((star) => <Star key={star} strokeWidth={2.2} className="size-[4cqw]" />)}
            </span>
            {/* The QR image carries its own 4-module white quiet zone. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`} alt={`QR code for ${shop.name}`} className="mt-[2cqw] block size-[52cqw] rounded-[3cqw] bg-white" />
            <p className="mt-[2.4cqw] text-center text-[4.1cqw] font-semibold leading-tight" style={POSTER_FONT}>{poster.cta}</p>

            <ol className="mt-auto grid w-full grid-cols-3" style={POSTER_FONT}>
              {poster.steps.map((step, index) => (
                <li key={step} className="flex items-center gap-[1.3cqw] border-l-[0.2cqw] px-[1.4cqw] text-[2.45cqw] font-semibold leading-[1.15] first:border-l-0" style={{ borderColor: `${poster.foreground}33` }}>
                  <span className="flex size-[4.8cqw] shrink-0 items-center justify-center rounded-full text-[2.6cqw] font-bold" style={{ backgroundColor: poster.accent, color: poster.onAccent }}>{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className={cn("mt-[1.7cqw] flex w-full px-[1.4cqw] text-[1.9cqw] font-medium", qr.name === "Main QR" ? "justify-center" : "justify-between")} style={{ color: `${poster.foreground}B3` }}>
              <span>Powered by Semsorted</span>
              {qr.name !== "Main QR" && <span>{qr.name}</span>}
            </p>
          </div>
        </article>

        <div className="print:hidden">
          <BrandPanel shopId={id} website={shop.websiteUrl ?? ""} hasLogo={Boolean(shop.logoUrl)} current={{ primary: poster.background, surface: poster.page, accent: poster.accent }} />
        </div>
      </div>
    </div>
  );
}
