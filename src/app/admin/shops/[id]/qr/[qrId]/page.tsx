import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { Logo } from "@/components/Logo";
import { isUuid, publicQrUrl } from "@/lib/admin/api";
import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { posterFor } from "@/lib/qr/poster";
import { generateQrSvg } from "@/lib/qr/generator";
import { isSubscribed } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { PrintButton } from "../../../../_components/PrintButton";

export const metadata = { title: "Print QR poster" };

const SIZES = { a4: { label: "A4 wall poster", page: "A4" }, a5: { label: "A5 counter card", page: "A5" } } as const;

const nameSize = (name: string) => (name.length <= 18 ? "text-[6.6cqw]" : name.length <= 32 ? "text-[5.2cqw]" : name.length <= 50 ? "text-[4.3cqw]" : "text-[3.6cqw]");

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
      shop: { select: { name: true, businessCategory: true, defaultLanguage: true, logoUrl: true, primaryColor: true, isActive: true, subscriptionEndsAt: true } },
    },
  });
  if (!qr) notFound();

  const { shop } = qr;
  const poster = posterFor(shop.businessCategory, shop.defaultLanguage, shop.primaryColor);
  const brand = { backgroundColor: poster.background, color: poster.foreground };
  const svg = await generateQrSvg({ url: publicQrUrl(qr.publicToken), margin: 4 });
  const base = `/admin/shops/${id}/qr/${qrId}`;

  return (
    <div className="space-y-5">
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

      <article data-size={size} lang={poster.lang === "hi" ? "hi" : "en"} className="qr-sheet relative mx-auto flex aspect-[210/297] w-full max-w-[34rem] flex-col justify-between overflow-hidden bg-white px-[7cqw] pb-[4.5cqw] pt-[7cqw] text-[#17191c] shadow-[0_24px_48px_-24px_rgb(6_24_56/0.55)] print:shadow-none">
        <div>
          <div className="flex items-center gap-[3cqw]">
            <span className="relative flex size-[12.5cqw] shrink-0 items-center justify-center overflow-hidden rounded-[3cqw] font-display text-[7cqw] font-semibold" style={brand}>
              {shop.name.charAt(0).toUpperCase()}
              {shop.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logoUrl} alt="" className="absolute inset-0 size-full rounded-[3cqw] border-[0.25cqw] border-[#e3e6ea] bg-white object-contain" />
              )}
            </span>
            <div className="min-w-0">
              <h1 className={cn("break-words font-display font-semibold leading-[1.05]", nameSize(shop.name))}>{shop.name}</h1>
              <p className="mt-[0.7cqw] text-[2.9cqw] font-medium leading-tight text-[#5f6368]">{shop.businessCategory}</p>
            </div>
          </div>
          <p className="mt-[4.5cqw] max-w-[15ch] text-balance font-display text-[10.5cqw] font-semibold leading-[1.02] tracking-[-0.02em]">{poster.headline}</p>
          <p className="mt-[1.8cqw] max-w-[68cqw] text-[3cqw] leading-[1.3] text-[#5f6368]">{poster.line}</p>
        </div>

        <div className="flex flex-col items-center rounded-[4.5cqw] px-[3cqw] pb-[2.6cqw] pt-[3.4cqw]" style={brand}>
          {/* The QR image carries its own 4-module white quiet zone. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`} alt={`QR code for ${shop.name}`} className="block size-[55cqw] rounded-[2.2cqw] bg-white" />
          <p className="mt-[2.3cqw] flex flex-wrap items-center justify-center gap-x-[2cqw] gap-y-[0.6cqw] text-center font-display text-[4.1cqw] font-semibold leading-tight">
            <span aria-hidden className="flex -translate-y-[0.25cqw] gap-[0.5cqw]">
              {[0, 1, 2, 3, 4].map((star) => <Star key={star} className="size-[3cqw]" />)}
            </span>
            {poster.cta}
          </p>
        </div>

        <ol className="grid grid-cols-3 gap-[3cqw]">
          {poster.steps.map((step, index) => (
            <li key={step} className="flex items-center gap-[1.5cqw] text-[2.75cqw] font-semibold leading-[1.15]">
              <span className="flex size-[5.2cqw] shrink-0 items-center justify-center rounded-full text-[2.9cqw] font-bold" style={brand}>{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>

        <div className="flex items-center justify-between border-t border-[#e3e6ea] pt-[2cqw] text-[2.4cqw] font-medium text-[#5f6368]">
          <span className="flex items-center gap-[1.2cqw]">Powered by <Logo className="text-[2.9cqw]" /></span>
          {qr.name !== "Main QR" && <span className="font-semibold">{qr.name}</span>}
        </div>
      </article>
    </div>
  );
}
