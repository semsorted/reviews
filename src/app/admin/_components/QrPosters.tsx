import { Globe, Star } from "lucide-react";
import type { posterFor } from "@/lib/qr/poster";
import { cn } from "@/lib/utils";

const NAVY = "#0b2447";
const POSTER_FONT = { fontFamily: "var(--font-outfit), var(--font-anek), ui-sans-serif, sans-serif" };
const SHEET = "qr-sheet relative mx-auto flex w-full flex-col overflow-hidden shadow-[0_24px_48px_-24px_rgb(6_24_56/0.55)] print:shadow-none";
const GOOGLE_LETTERS = [["G", "#4285F4"], ["o", "#EA4335"], ["o", "#FBBC05"], ["g", "#4285F4"], ["l", "#34A853"], ["e", "#EA4335"]] as const;
const CORNERS = [
  "left-0 top-0 rounded-tl-[3.4cqw] border-l-[0.8cqw] border-t-[0.8cqw]",
  "right-0 top-0 rounded-tr-[3.4cqw] border-r-[0.8cqw] border-t-[0.8cqw]",
  "bottom-0 left-0 rounded-bl-[3.4cqw] border-b-[0.8cqw] border-l-[0.8cqw]",
  "bottom-0 right-0 rounded-br-[3.4cqw] border-b-[0.8cqw] border-r-[0.8cqw]",
];
const STAR_POINTS = Array.from({ length: 10 }, (_, index) => {
  const radius = index % 2 ? 10.5 : 23;
  const angle = -Math.PI / 2 + (index * Math.PI) / 5;
  return `${(25 + radius * Math.cos(angle)).toFixed(2)},${(25 + radius * Math.sin(angle)).toFixed(2)}`;
});
const STAR = STAR_POINTS.join(" ");

const nameSize = (name: string) => (name.length <= 18 ? "text-[7.6cqw]" : name.length <= 32 ? "text-[5.6cqw]" : name.length <= 50 ? "text-[4.4cqw]" : "text-[3.6cqw]");

function GoogleG({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function GoogleWord({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block font-medium tracking-[-0.02em]", className)}>
      {GOOGLE_LETTERS.map(([letter, color], index) => <span key={index} style={{ color }}>{letter}</span>)}
    </span>
  );
}

/** Vector shading stays sharp in print, unlike a blurred shadow. */
function Stars3D({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 272 56" className={className}>
      <defs>
        <linearGradient id="poster-star" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE680" />
          <stop offset="0.55" stopColor="#FFC21A" />
          <stop offset="1" stopColor="#F59A00" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((star) => (
        <g key={star} transform={`translate(${star * 55 + 1} 1)`}>
          <polygon points={STAR} transform="translate(0 3.5)" fill="#B96F00" stroke="#B96F00" strokeWidth="3" strokeLinejoin="round" />
          <polygon points={STAR} fill="url(#poster-star)" stroke="#FFC21A" strokeWidth="3" strokeLinejoin="round" />
          {STAR_POINTS.map((point, index) => (
            <polygon key={point} points={`25,25 ${point} ${STAR_POINTS[(index + 1) % 10]}`} fill={index % 2 ? "#8A4B00" : "#FFFFFF"} opacity={index % 2 ? 0.15 : 0.26} />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** The corners sit outside the QR's own 4-module white quiet zone, so scanning is not affected. */
function ScanFrame({ color, src, alt, qrClass }: { color: string; src: string; alt: string; qrClass: string }) {
  return (
    <div className="relative p-[2.2cqw]">
      {CORNERS.map((corner) => <span key={corner} aria-hidden className={cn("absolute size-[10cqw]", corner)} style={{ borderColor: color }} />)}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={cn("block rounded-[2.4cqw] bg-white", qrClass)} />
    </div>
  );
}

export function NormalPoster({ shopName, qrSrc, qrName }: { shopName: string; qrSrc: string; qrName: string }) {
  return (
    <article data-size="4x6" data-design="normal" lang="en" className={cn(SHEET, "aspect-[2/3] max-w-[26rem] bg-white")} style={{ color: NAVY, ...POSTER_FONT }}>
      <h1 className="sr-only">{shopName}</h1>
      {/* cqw padding must sit inside the sheet, because the sheet is the size container. */}
      <div className="flex flex-1 flex-col items-center justify-between px-[7cqw] pb-[5.5cqw] pt-[7cqw] text-center">
        <div className="flex w-full flex-col items-center">
          <GoogleG className="size-[22cqw]" />
          <p className="mt-[4cqw] text-[9cqw] font-semibold leading-none tracking-[-0.03em]">Your opinion matters!</p>
          <p className="mt-[2.4cqw] text-[6.6cqw] font-medium leading-none tracking-[-0.01em]">Review us on <GoogleWord className="text-[7.8cqw] leading-none" /></p>
        </div>

        <div className="relative">
          <p className="absolute right-full top-1/2 mr-[1.6cqw] flex -translate-y-1/2 flex-col items-center text-[3.8cqw] font-semibold leading-[1.1]">
            <span>Scan</span>
            <span>me</span>
            <svg aria-hidden viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-[1cqw] size-[7cqw]">
              <path d="M6 4c0 14 8 22 22 22" />
              <path d="m21 19 8 7-8 7" />
            </svg>
          </p>
          <ScanFrame color={NAVY} src={qrSrc} alt={`QR code for ${shopName}`} qrClass="size-[56cqw]" />
        </div>

        <Stars3D className="h-[9.5cqw] w-auto" />

        <div className="flex w-full items-center gap-[3cqw] text-[3.4cqw] font-medium">
          <span aria-hidden className="h-[0.2cqw] flex-1" style={{ backgroundColor: `${NAVY}40` }} />
          <Globe aria-hidden className="size-[4cqw]" />
          <span>www.semsorted.com</span>
          {qrName !== "Main QR" && <span className="opacity-70">{qrName}</span>}
          <span aria-hidden className="h-[0.2cqw] flex-1" style={{ backgroundColor: `${NAVY}40` }} />
        </div>
      </div>
    </article>
  );
}

export function CustomPoster({ size, shopName, logoUrl, qrSrc, qrName, poster }: { size: "a4" | "a5"; shopName: string; logoUrl: string | null; qrSrc: string; qrName: string; poster: ReturnType<typeof posterFor> }) {
  const [beforeGoogle, afterGoogle] = poster.cta.split("Google");
  return (
    <article data-size={size} data-design="custom" lang={poster.lang === "hi" ? "hi" : "en"} className={cn(SHEET, "aspect-[210/297] max-w-[34rem]")} style={{ backgroundColor: poster.page, color: poster.ink }}>
      <div className="flex h-[46cqw] shrink-0 flex-col items-center px-[7cqw] pt-[5.5cqw] text-center">
        {logoUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="" className="h-[14cqw] max-w-[46cqw] object-contain" />
            <h1 className="sr-only">{shopName}</h1>
          </>
        ) : (
          <h1 className={cn("flex min-h-[12cqw] max-w-full items-center break-words font-semibold leading-[1.05] tracking-[-0.02em]", nameSize(shopName))} style={POSTER_FONT}>{shopName}</h1>
        )}
        <p className="mt-[2.2cqw] max-w-[86cqw] text-balance text-[8.4cqw] font-semibold leading-[1.04] tracking-[-0.03em]" style={POSTER_FONT}>{poster.title}</p>
        <p className="mt-[1.8cqw] max-w-[78cqw] text-balance text-[3.7cqw] font-medium leading-[1.25]" style={{ color: poster.muted }}>{poster.line}</p>
      </div>

      <div className="relative mx-[7cqw] flex flex-1 flex-col items-center rounded-t-[43cqw] px-[5cqw] pb-[2.4cqw] pt-[8cqw]" style={{ backgroundColor: poster.background, color: poster.foreground }}>
        <span aria-hidden className="pointer-events-none absolute -inset-x-[1.8cqw] -top-[1.8cqw] bottom-0 rounded-t-[45cqw] border-[0.28cqw] border-b-0" style={{ borderColor: poster.accent }} />
        <span aria-hidden className="flex gap-[1cqw]" style={{ color: poster.accent }}>
          {[0, 1, 2, 3, 4].map((star) => <Star key={star} strokeWidth={2.2} className="size-[4cqw]" />)}
        </span>
        <div className="mt-[1.4cqw]"><ScanFrame color={poster.accent} src={qrSrc} alt={`QR code for ${shopName}`} qrClass="size-[54cqw]" /></div>
        <p className="mt-[2.4cqw] text-center text-[4.6cqw] font-semibold leading-tight" style={POSTER_FONT}>
          {beforeGoogle}
          {/* Google's colors need a white base to stay readable on any brand color. */}
          <span className="inline-block rounded-[1.1cqw] bg-white px-[1.3cqw] py-[0.15cqw]"><GoogleWord className="font-semibold" /></span>
          {afterGoogle}
        </p>
        <p className={cn("mt-auto flex w-full px-[1.4cqw] text-[1.9cqw] font-medium", qrName === "Main QR" ? "justify-center" : "justify-between")} style={{ color: `${poster.foreground}B3` }}>
          <span>Powered by Semsorted</span>
          {qrName !== "Main QR" && <span>{qrName}</span>}
        </p>
      </div>
    </article>
  );
}
