import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ScanFrame } from "@/app/admin/_components/QrPosters";
import { publicAppUrl } from "@/lib/admin/api";
import { prisma } from "@/lib/prisma";
import { generateQrSvg } from "@/lib/qr/generator";
import { parsePosterSize, PRESETS } from "@/lib/qr/poster-size";
import { cn } from "@/lib/utils";
import { PrintButton } from "./manage/TablesPanel";

const NAVY = "#0b2447";
const CARD_FONT = { fontFamily: "var(--font-outfit), var(--font-anek), ui-sans-serif, sans-serif" };
const SIZES = Object.entries(PRESETS) as [keyof typeof PRESETS, (typeof PRESETS)[keyof typeof PRESETS]][];
const svgSrc = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const labelSize = (text: string) => (text.length <= 9 ? "text-[13cqw]" : text.length <= 15 ? "text-[9cqw]" : "text-[6.5cqw]");

/**
 * One printable "Scan to order" card per active table. Used by the Semsorted admin and the restaurant panel;
 * callers check who is signed in and pass a shopId they may see.
 */
export async function TableQrSheets({ shopId, size: sizeQuery, pagePath, backHref, backLabel }: { shopId: string; size: unknown; pagePath: string; backHref: string; backLabel: string }) {
  // Only the preset sizes are offered here, so a custom query falls back to 4×6.
  const size = parsePosterSize({ size: sizeQuery });
  const [shop, settings, tables] = await Promise.all([
    prisma.shop.findUniqueOrThrow({ where: { id: shopId }, select: { name: true, logoUrl: true } }),
    prisma.orderingSettings.findUnique({ where: { shopId }, select: { isEnabled: true } }),
    prisma.diningTable.findMany({ where: { shopId, isActive: true }, orderBy: { createdAt: "asc" }, select: { id: true, label: true, publicToken: true } }),
  ]);

  const cards = await Promise.all(tables.map(async (table) => ({ ...table, qr: svgSrc(await generateQrSvg({ url: publicAppUrl(`/t/${table.publicToken}`), margin: 4 })) })));
  const sheet = { "--w": `${size.wMm}mm`, "--h": `${size.hMm}mm`, "--ratio": size.hMm / size.wMm, "--r": 1.5, "--max": "22rem" } as CSSProperties;

  return (
    <div className="space-y-5 print:space-y-0">
      <style>{`@page{size:${size.wMm}mm ${size.hMm}mm;margin:0}`}</style>
      <div className="space-y-4 print:hidden">
        <h1 className="sr-only">Table QR cards for {shop.name}</h1>
        <Link href={backHref} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-moss hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> {backLabel}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Card size" className="inline-flex flex-wrap rounded-full bg-paper p-1">
            {SIZES.map(([key, preset]) => (
              <Link
                key={key}
                href={{ pathname: pagePath, query: { size: key } }}
                replace
                scroll={false}
                aria-current={size.key === key ? "page" : undefined}
                className={cn("inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold", size.key === key ? "bg-night text-white" : "text-moss hover:text-ink")}
              >
                {preset.label}
              </Link>
            ))}
          </nav>
          {cards.length > 0 && <PrintButton />}
        </div>
        <p className="text-sm text-moss">
          {cards.length} {cards.length === 1 ? "card" : "cards"}, one per active table. Print size {size.wMm} × {size.hMm} mm.
        </p>
        {!settings?.isEnabled && <p role="alert" className="rounded-xl bg-g-yellow-tint p-3 text-sm font-semibold text-ink">Ordering is off for this restaurant. Guests cannot order from these cards until Semsorted turns it on.</p>}
      </div>

      {cards.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 print:block">
          {cards.map((card, index) => (
            <article
              key={card.id}
              lang="en"
              className="qr-sheet relative mx-auto flex w-full flex-col overflow-hidden bg-white shadow-[0_24px_48px_-24px_rgb(6_24_56/0.55)] print:shadow-none"
              style={{ ...sheet, color: NAVY, ...CARD_FONT, breakAfter: index < cards.length - 1 ? "page" : "auto" }}
            >
              <div className="qr-frame">
                <div className="flex flex-1 flex-col items-center justify-between px-[7cqw] pb-[5cqw] pt-[7cqw] text-center">
                  <div className="flex w-full flex-col items-center">
                    {shop.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={shop.logoUrl} alt={shop.name} className="h-[14cqw] max-w-[60cqw] object-contain" />
                    ) : (
                      <p className="max-w-full break-words text-[6cqw] font-semibold leading-tight">{shop.name}</p>
                    )}
                    <h2 className="mt-[3cqw] text-[9cqw] font-semibold leading-none tracking-[-0.03em]">Scan to order</h2>
                    <p className={cn("mt-[2cqw] max-w-full break-words font-bold leading-none tracking-[-0.03em]", labelSize(`Table ${card.label}`))}>Table {card.label}</p>
                  </div>
                  <ScanFrame color={NAVY} src={card.qr} alt={`QR code to order at table ${card.label}`} qrClass="size-[54cqw]" />
                  <div>
                    <p className="text-[4.4cqw] font-medium leading-tight">Menu, order and bill on your phone</p>
                    <p className="mt-[2cqw] text-[2.6cqw] font-medium opacity-70">Powered by Semsorted</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-paper p-6 text-moss">
          No active tables. <Link href={backHref} className="font-semibold text-pine underline">Add or turn on tables</Link> first.
        </p>
      )}
    </div>
  );
}
