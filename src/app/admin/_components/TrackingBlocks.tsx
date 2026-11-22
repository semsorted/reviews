import Link from "next/link";
import { Copy, ExternalLink, PencilLine, Star } from "lucide-react";
import type { ActivityItem, Funnel, RatingCount, TrackedReview } from "@/lib/admin/tracking";
import { percent, RANGES, type ReviewStatus, type TrackingRange } from "@/lib/admin/tracking-core";
import { TONE_CLASS, type Tone } from "@/lib/admin/tones";
import { cn } from "@/lib/utils";

const LANGUAGE_LABELS: Record<string, string> = { en: "English", hi: "Hindi", hinglish: "Hinglish" };

export function PageHead({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[clamp(2.25rem,4vw,3rem)] font-semibold leading-none">{title}</h1>
        {text && <p className="mt-2 max-w-[60ch] text-moss">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function RangeTabs({ base, range, params = {} }: { base: string; range: TrackingRange; params?: Record<string, string> }) {
  return (
    <nav aria-label="Date range" className="inline-flex max-w-full overflow-x-auto rounded-full bg-paper p-1">
      {RANGES.map((item) => (
        <Link
          key={item.value}
          href={{ pathname: base, query: { ...params, range: item.value } }}
          aria-current={item.value === range ? "page" : undefined}
          className={cn("inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold", item.value === range ? "bg-night text-white" : "text-moss hover:text-ink")}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-2xl bg-paper p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export type CoverStatData = { label: string; value: number | string; note: string; tone: Tone; href?: string };

export function CoverStats({ stats }: { stats: CoverStatData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const body = (
          <>
            <svg aria-hidden viewBox="-2 -2 52 52" className="absolute -right-7 -top-6 size-36 opacity-[0.14]">
              <path fill="none" stroke="currentColor" strokeWidth="8.5" d="M34 14A10 10 0 1 0 24 24A10 10 0 1 1 14 34" />
            </svg>
            <span className="relative text-sm font-medium opacity-95">{stat.label}</span>
            <span className="relative mt-5 block font-display text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-none tabular-nums">{stat.value}</span>
            <span className="relative mt-2 block text-xs opacity-90">{stat.note}</span>
          </>
        );
        const className = cn(
          "relative flex min-h-40 flex-col overflow-hidden rounded-l-md rounded-r-2xl p-4 pl-5 shadow-[inset_8px_0_12px_-8px_rgb(0_0_0/0.38),0_14px_24px_-18px_rgb(6_24_56/0.7)]",
          TONE_CLASS[stat.tone]
        );
        return stat.href ? (
          <Link key={stat.label} href={stat.href} data-stat={stat.label} className={cn(className, "transition-transform hover:-translate-y-0.5")}>{body}</Link>
        ) : (
          <div key={stat.label} data-stat={stat.label} className={className}>{body}</div>
        );
      })}
    </div>
  );
}

function Bar({ label, value, max, color = "bg-g-blue" }: { label: React.ReactNode; value: number; max: number; color?: string }) {
  return (
    <div className="text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 tabular-nums text-moss">{value}</span>
      </div>
      <span className="mt-1 block h-2 overflow-hidden rounded-full bg-mist">
        <span className={cn("block h-full rounded-full", color)} style={{ width: `${percent(value, max)}%` }} />
      </span>
    </div>
  );
}

export function FunnelBars({ funnel }: { funnel: Funnel }) {
  const rows = [
    ["QR scans", funnel.scans, "bg-g-blue"],
    ["Reviews ready", funnel.drafts, "bg-[#174ea6]"],
    ["Copied", funnel.copied, "bg-g-yellow"],
    ["Sent to Google", funnel.google, "bg-g-green"],
  ] as const;
  return <div className="space-y-3">{rows.map(([label, value, color]) => <Bar key={label} label={label} value={value} max={funnel.scans} color={color} />)}</div>;
}

export function RatingBars({ ratings }: { ratings: RatingCount[] }) {
  const max = Math.max(...ratings.map((row) => row.count), 1);
  if (!ratings.some((row) => row.count)) return <p className="text-sm text-moss">No ratings in this period.</p>;
  return (
    <div className="space-y-3">
      {ratings.map((row) => (
        <Bar key={row.rating} value={row.count} max={max} color="bg-g-yellow" label={<span className="inline-flex items-center gap-1">{row.rating}<Star aria-label="star" className="size-3.5 fill-g-yellow text-g-yellow" /></span>} />
      ))}
    </div>
  );
}

export function ChipBars({ chips }: { chips: { label: string; count: number }[] }) {
  const max = Math.max(...chips.map((chip) => chip.count), 1);
  if (!chips.length) return <p className="text-sm text-moss">No chips chosen in this period.</p>;
  return <div className="space-y-3">{chips.map((chip) => <Bar key={chip.label} label={chip.label} value={chip.count} max={max} color="bg-g-green" />)}</div>;
}

export function GeminiUsage({ usage }: { usage: { success: number; failed: number } }) {
  return (
    <div>
      <p className="font-display text-[2.25rem] font-semibold leading-none tabular-nums">{usage.success + usage.failed}</p>
      <p className="mt-2 text-sm text-moss">{usage.success} worked, {usage.failed} failed in the last 24 hours. Gemini runs only when a review would repeat.</p>
    </div>
  );
}

export function ActivityFeed({ items, showShop = true }: { items: ActivityItem[]; showShop?: boolean }) {
  if (!items.length) return <p className="text-sm text-moss">Nothing has happened yet.</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
          <p className="text-sm font-medium">{item.what}</p>
          <p className="truncate text-xs text-moss">{showShop ? `${item.shop}, ` : ""}{item.when}</p>
        </li>
      ))}
    </ul>
  );
}

const STATUS_STYLE: Record<ReviewStatus, { icon: typeof Copy; className: string }> = {
  "Sent to Google": { icon: ExternalLink, className: "bg-g-green-tint text-g-green" },
  Copied: { icon: Copy, className: "bg-g-blue-tint text-g-blue" },
  "Not copied": { icon: PencilLine, className: "bg-mist text-moss" },
};

export function ReviewList({ reviews }: { reviews: TrackedReview[] }) {
  if (!reviews.length) return <p className="text-sm text-moss">No reviews in this period.</p>;
  return (
    <ul className="divide-y divide-line">
      {reviews.map((review) => {
        const status = STATUS_STYLE[review.status];
        const Icon = status.icon;
        return (
          <li key={review.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <span className="inline-flex items-center gap-2">
                {review.rating !== null && (
                  <span className="flex" role="img" aria-label={`${review.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} aria-hidden className={cn("size-4", star <= review.rating! ? "fill-g-yellow text-g-yellow" : "fill-transparent text-line")} />
                    ))}
                  </span>
                )}
                <span className="text-xs text-moss">{review.when}</span>
              </span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", status.className)}>
                <Icon aria-hidden className="size-3" />
                {review.status}
              </span>
            </div>
            <p className="mt-2 leading-relaxed">{review.text}</p>
            <p className="mt-1.5 text-xs text-moss">
              {[review.chips, LANGUAGE_LABELS[review.language] ?? review.language, review.source, review.edited ? "Customer edited before copying" : ""].filter(Boolean).join(", ")}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function Pager({ base, page, pages, params, label = "Review pages" }: { base: string; page: number; pages: number; params: Record<string, string>; label?: string }) {
  if (pages <= 1) return null;
  const link = "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold";
  return (
    <nav aria-label={label} className="mt-5 flex items-center justify-between">
      {page > 1 ? <Link href={{ pathname: base, query: { ...params, page: page - 1 } }} className={`${link} bg-mist hover:bg-line`}>Newer</Link> : <span />}
      <span className="text-sm tabular-nums text-moss">Page {page} of {pages}</span>
      {page < pages ? <Link href={{ pathname: base, query: { ...params, page: page + 1 } }} className={`${link} bg-mist hover:bg-line`}>Older</Link> : <span />}
    </nav>
  );
}
