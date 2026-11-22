import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, Store } from "lucide-react";
import { Logo } from "@/components/Logo";
import { isUuid, publicQrUrl } from "@/lib/admin/api";
import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { posterFor } from "@/lib/qr/poster";
import { generateQrSvg } from "@/lib/qr/generator";
import { isSubscribed } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { BUSINESS_GROUPS } from "../../../../_components/business-groups";
import { PrintButton } from "../../../../_components/PrintButton";

export const metadata = { title: "Print QR poster" };

const SIZES = { a4: { label: "A4 wall poster", page: "A4" }, a5: { label: "A5 counter card", page: "A5" } } as const;
const STEP_COLORS = ["bg-g-blue text-white", "bg-g-red text-white", "bg-g-green text-white"];

const nameSize = (name: string) => (name.length <= 16 ? "text-[9cqw]" : name.length <= 28 ? "text-[6.8cqw]" : name.length <= 48 ? "text-[5.2cqw]" : "text-[4.1cqw]");

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
  const Icon = (poster.group && BUSINESS_GROUPS[poster.group]?.icon) || Store;
  const svg = await generateQrSvg({ url: publicQrUrl(qr.publicToken) });
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

      <article data-size={size} lang={poster.lang === "hi" ? "hi" : "en"} className="qr-sheet relative mx-auto flex aspect-[210/297] w-full max-w-[34rem] flex-col overflow-hidden bg-white text-center text-[#202124] shadow-[0_24px_48px_-24px_rgb(6_24_56/0.55)]">
        <div className="relative h-[43%] shrink-0 overflow-hidden px-[6cqw] pt-[5cqw]" style={{ backgroundColor: poster.background, color: poster.foreground }}>
          <svg aria-hidden viewBox="-2 -2 52 52" className="absolute -right-[14cqw] -top-[16cqw] size-[72cqw] opacity-[0.12]">
            <path fill="none" stroke="currentColor" strokeWidth="8.5" d="M34 14A10 10 0 1 0 24 24A10 10 0 1 1 14 34" />
          </svg>
          <div className="relative flex flex-col items-center">
            <span className="relative flex size-[11cqw] items-center justify-center overflow-hidden rounded-full bg-white text-[#202124]">
              <Icon aria-hidden className="size-[6cqw]" />
              {shop.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logoUrl} alt="" className="absolute inset-0 size-full bg-white object-cover" />
              )}
            </span>
            <h1 className={cn("mt-[2cqw] max-w-full break-words font-display font-semibold leading-[1.05]", nameSize(shop.name))}>{shop.name}</h1>
            <p className="mt-[2.2cqw] font-display text-[5.4cqw] font-medium leading-[1.15]">{poster.headline}</p>
            <span aria-hidden className="mt-[1.4cqw] flex gap-[1cqw]">
              {[0, 1, 2, 3, 4].map((star) => <Star key={star} className="size-[3.8cqw]" />)}
            </span>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-[10cqw] rounded-[3cqw] bg-white p-[2cqw] shadow-[0_1.5cqw_4cqw_rgb(6_24_56/0.22)] print:shadow-none print:outline print:outline-[0.3cqw] print:outline-[#dadce0]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`} alt={`QR code for ${shop.name}`} className="block size-[48cqw]" />
        </div>

        <p className="mt-[3.2cqw] font-display text-[5cqw] font-semibold leading-none">{poster.cta}</p>

        <ol className="mx-auto mt-[3.2cqw] grid w-[88cqw] grid-cols-3 gap-[2cqw]">
          {poster.steps.map((step, index) => (
            <li key={step} className="flex flex-col items-center gap-[1cqw] text-[2.7cqw] font-semibold leading-[1.2]">
              <span className={cn("flex size-[5.4cqw] items-center justify-center rounded-full text-[3cqw] font-bold", STEP_COLORS[index])}>{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-[2.6cqw] max-w-[76cqw] text-[2.5cqw] leading-[1.3] text-[#5f6368]">{poster.line}</p>

        <div className="mt-auto flex items-center justify-between px-[6cqw] pb-[2.2cqw]">
          <Logo className="text-[3.2cqw]" />
          {qr.name !== "Main QR" && <span className="text-[2.6cqw] font-semibold text-[#5f6368]">{qr.name}</span>}
        </div>
        <div aria-hidden className="grid h-[1.5cqw] shrink-0 grid-cols-4">
          <span className="bg-[#1a56db]" /><span className="bg-[#12a150]" /><span className="bg-[#e5484d]" /><span className="bg-[#f5b301]" />
        </div>
      </article>
    </div>
  );
}
