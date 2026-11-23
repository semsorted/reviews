import { Globe, Star, TrendingUp } from "lucide-react";
import type { posterFor } from "@/lib/qr/poster";
import { cn } from "@/lib/utils";

type PosterProps = { size: "a4" | "a5"; shopName: string; logoUrl: string | null; qrSrc: string; qrName: string };

const NAVY = "#0b2447";
const BLUE = "#1a56db";
const GOLD = "#f5b301";
const POSTER_FONT = { fontFamily: "var(--font-outfit), var(--font-anek), ui-sans-serif, sans-serif" };
const SHEET = "qr-sheet relative mx-auto flex aspect-[210/297] w-full max-w-[34rem] flex-col overflow-hidden shadow-[0_24px_48px_-24px_rgb(6_24_56/0.55)] print:shadow-none";
const CORNERS = [
  "left-0 top-0 rounded-tl-[3.4cqw] border-l-[0.8cqw] border-t-[0.8cqw]",
  "right-0 top-0 rounded-tr-[3.4cqw] border-r-[0.8cqw] border-t-[0.8cqw]",
  "bottom-0 left-0 rounded-bl-[3.4cqw] border-b-[0.8cqw] border-l-[0.8cqw]",
  "bottom-0 right-0 rounded-br-[3.4cqw] border-b-[0.8cqw] border-r-[0.8cqw]",
];

const nameSize = (name: string) => (name.length <= 18 ? "text-[7.6cqw]" : name.length <= 32 ? "text-[5.6cqw]" : name.length <= 50 ? "text-[4.4cqw]" : "text-[3.6cqw]");
const headlineSize = (text: string) => (text.length <= 19 ? "text-[9.6cqw]" : text.length <= 26 ? "text-[7.8cqw]" : "text-[7cqw]");

function BusinessMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (!logoUrl) {
    return <h1 className={cn("flex min-h-[12cqw] max-w-full items-center break-words font-semibold leading-[1.05] tracking-[-0.02em]", nameSize(name))} style={POSTER_FONT}>{name}</h1>;
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt="" className="h-[14cqw] max-w-[46cqw] object-contain" />
      <h1 className="sr-only">{name}</h1>
    </>
  );
}

/** The corners sit outside the QR's own 4-module white quiet zone, so scanning is not affected. */
function ScanFrame({ color, src, alt }: { color: string; src: string; alt: string }) {
  return (
    <div className="relative p-[2.2cqw]">
      {CORNERS.map((corner) => <span key={corner} aria-hidden className={cn("absolute size-[10cqw]", corner)} style={{ borderColor: color }} />)}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="block size-[50cqw] rounded-[2.4cqw] bg-white" />
    </div>
  );
}

function Stars({ color, className }: { color: string; className: string }) {
  return (
    <span aria-hidden className="flex gap-[1cqw]" style={{ color }}>
      {[0, 1, 2, 3, 4].map((star) => <Star key={star} strokeWidth={2.2} className={className} />)}
    </span>
  );
}

export function NormalPoster({ size, shopName, logoUrl, qrSrc, qrName }: PosterProps) {
  return (
    <article data-size={size} data-design="normal" lang="en" className={cn(SHEET, "bg-white")} style={{ color: NAVY, ...POSTER_FONT }}>
      {/* cqw padding must sit inside the sheet, because the sheet is the size container. */}
      <div className="flex flex-1 flex-col items-center justify-between px-[7cqw] pb-[5cqw] pt-[6cqw] text-center">
      <div className="flex w-full flex-col items-center">
        <BusinessMark name={shopName} logoUrl={logoUrl} />
        <p className="mt-[3cqw] text-[8cqw] font-semibold leading-none tracking-[-0.03em]">Your opinion matters!</p>
        <p className="mt-[2cqw] text-[5.6cqw] font-medium leading-none tracking-[-0.01em]">Review us on <span className="font-semibold" style={{ color: BLUE }}>Google</span></p>
      </div>

      <div className="relative">
        <p className="absolute right-full top-1/2 mr-[2.4cqw] flex -translate-y-1/2 flex-col items-center text-[3.8cqw] font-semibold leading-[1.1]">
          <span>Scan</span>
          <span>me</span>
          <svg aria-hidden viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-[1cqw] size-[7cqw]">
            <path d="M6 4c0 14 8 22 22 22" />
            <path d="m21 19 8 7-8 7" />
          </svg>
        </p>
        <ScanFrame color={NAVY} src={qrSrc} alt={`QR code for ${shopName}`} />
      </div>

      <Stars color={GOLD} className="size-[5.4cqw]" />

      <div className="flex items-center gap-[2.6cqw] rounded-full bg-[#e8f0fe] px-[5.5cqw] py-[2.2cqw] text-left">
        <TrendingUp aria-hidden className="size-[6cqw] shrink-0" style={{ color: BLUE }} />
        <span aria-hidden className="h-[7cqw] w-[0.2cqw] shrink-0" style={{ backgroundColor: `${NAVY}55` }} />
        <p className="text-[3.3cqw] font-medium leading-[1.25]">
          Grow faster, scale your business
          <span className="block text-[3.7cqw] font-semibold">with <span style={{ color: BLUE }}>Semsorted</span></span>
        </p>
      </div>

      <div className="flex w-full items-center gap-[3cqw] text-[3cqw] font-medium">
        <span aria-hidden className="h-[0.2cqw] flex-1" style={{ backgroundColor: `${NAVY}40` }} />
        <Globe aria-hidden className="size-[3.6cqw]" />
        <span>www.semsorted.com</span>
        {qrName !== "Main QR" && <span className="opacity-70">{qrName}</span>}
        <span aria-hidden className="h-[0.2cqw] flex-1" style={{ backgroundColor: `${NAVY}40` }} />
      </div>
      </div>
    </article>
  );
}

export function CustomPoster({ size, shopName, logoUrl, qrSrc, qrName, poster }: PosterProps & { poster: ReturnType<typeof posterFor> }) {
  return (
    <article data-size={size} data-design="custom" lang={poster.lang === "hi" ? "hi" : "en"} className={SHEET} style={{ backgroundColor: poster.page, color: poster.ink }}>
      <div className="flex h-[46cqw] shrink-0 flex-col items-center px-[7cqw] pt-[5.5cqw] text-center">
        <BusinessMark name={shopName} logoUrl={logoUrl} />
        <p className={cn("mt-[2.2cqw] max-w-[84cqw] text-balance font-semibold leading-[1.04] tracking-[-0.03em]", headlineSize(poster.headline))} style={POSTER_FONT}>{poster.headline}</p>
        <p className="mt-[1.5cqw] max-w-[70cqw] text-balance text-[2.9cqw] font-medium leading-[1.3]" style={{ color: poster.muted }}>{poster.line}</p>
      </div>

      <div className="relative mx-[7cqw] flex flex-1 flex-col items-center rounded-t-[43cqw] px-[5cqw] pb-[2.4cqw] pt-[6.5cqw]" style={{ backgroundColor: poster.background, color: poster.foreground }}>
        <span aria-hidden className="pointer-events-none absolute -inset-x-[1.8cqw] -top-[1.8cqw] bottom-0 rounded-t-[45cqw] border-[0.28cqw] border-b-0" style={{ borderColor: poster.accent }} />
        <Stars color={poster.accent} className="size-[4cqw]" />
        <div className="mt-[1.4cqw]"><ScanFrame color={poster.accent} src={qrSrc} alt={`QR code for ${shopName}`} /></div>
        <p className="mt-[1.8cqw] text-center text-[4.1cqw] font-semibold leading-tight" style={POSTER_FONT}>{poster.cta}</p>

        <ol className="mt-auto grid w-full grid-cols-3" style={POSTER_FONT}>
          {poster.steps.map((step, index) => (
            <li key={step} className="flex items-center gap-[1.3cqw] border-l-[0.2cqw] px-[1.4cqw] text-[2.45cqw] font-semibold leading-[1.15] first:border-l-0" style={{ borderColor: `${poster.foreground}33` }}>
              <span className="flex size-[4.8cqw] shrink-0 items-center justify-center rounded-full text-[2.6cqw] font-bold" style={{ backgroundColor: poster.accent, color: poster.onAccent }}>{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <p className={cn("mt-[1.7cqw] flex w-full px-[1.4cqw] text-[1.9cqw] font-medium", qrName === "Main QR" ? "justify-center" : "justify-between")} style={{ color: `${poster.foreground}B3` }}>
          <span>Powered by Semsorted</span>
          {qrName !== "Main QR" && <span>{qrName}</span>}
        </p>
      </div>
    </article>
  );
}
