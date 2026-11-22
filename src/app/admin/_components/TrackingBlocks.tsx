import Link from "next/link";
import { Check, Copy, ExternalLink, PencilLine, Star } from "lucide-react";
import type { ActivityItem, Funnel, RatingCount, TrackedReview } from "@/lib/admin/tracking";
import { percent, RANGES, type ReviewStatus, type TrackingRange } from "@/lib/admin/tracking-core";
import { cn } from "@/lib/utils";

const LANGUAGE_LABELS: Record<string, string> = { en: "English", hi: "Hindi", hinglish: "Hinglish" };

export function RangeTabs({ base, range, params = {} }: { base: string; range: TrackingRange; params?: Record<string, string> }) {
  return (
    <nav aria-label="Date range" className="inline-flex max-w-full overflow-x-auto rounded-full bg-paper p-1">
      {RANGES.map((item) => (
        <Link
          key={item.value}
          href={{ pathname: base, query: { ...params, range: item.value } }}
          aria-current={item.value === range ? "page" : undefined}
          className={cn("inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold", item.value === range ? "bg-g-blue text-white" : "text-moss hover:text-ink")}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function Panel({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl bg-paper p-5", className)}>
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function StatRow({ funnel, average }: { funnel: Funnel; average: number | null }) {
  const stats = [
    { label: "QR scans", value: funnel.scans, note: "Unique customers" },
    { label: "Reviews ready", value: funnel.drafts, note: `${percent(funnel.drafts, funnel.scans)}% of scans` },
    { label: "Copied", value: funnel.copied, note: `${percent(funnel.copied, funnel.drafts)}% of reviews` },
    { label: "Sent to Google", value: funnel.google, note: `${percent(funnel.google, funnel.scans)}% of scans` },
    { label: "Average rating", value: average === null ? "No data" : average.toFixed(1), note: "From customer taps" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line md:grid-cols-5">
      {stats.map((stat, index) => (
        <div key={stat.label} className={cn("bg-paper p-4", index === 4 && "col-span-2 md:col-span-1")}>
          <dt className="text-sm text-moss">{stat.label}</dt>
          <dd className="mt-1 font-display text-[1.9rem] font-semibold leading-none tabular-nums">{stat.value}</dd>
          <dd className="mt-1.5 text-xs text-moss">{stat.note}</dd>
        </div>
      ))}
    </dl>
  );
}

function Bar({ label, value, max, suffix }: { label: React.ReactNode; value: number; max: number; suffix?: string }) {
  return (
    <div className="text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 tabular-nums text-moss">{value}{suffix}</span>
      </div>
      <span className="mt-1 block h-2 overflow-hidden rounded-full bg-mist">
        <span className="block h-full rounded-full bg-g-blue" style={{ width: `${percent(value, max)}%` }} />
      </span>
    </div>
  );
}

export function FunnelBars({ funnel }: { funnel: Funnel }) {
  const rows = [["QR scans", funnel.scans], ["Reviews ready", funnel.drafts], ["Copied", funnel.copied], ["Sent to Google", funnel.google]] as const;
  return <div className="space-y-3">{rows.map(([label, value]) => <Bar key={label} label={label} value={value} max={funnel.scans} />)}</div>;
}

export function RatingBars({ ratings }: { ratings: RatingCount[] }) {
  const max = Math.max(...ratings.map((row) => row.count), 1);
  if (!ratings.some((row) => row.count)) return <p className="text-sm text-moss">No ratings in this period.</p>;
  return (
    <div className="space-y-3">
      {ratings.map((row) => (
        <Bar key={row.rating} value={row.count} max={max} label={<span className="inline-flex items-center gap-1">{row.rating}<Star aria-label="star" className="size-3.5 fill-g-yellow text-g-yellow" /></span>} />
      ))}
    </div>
  );
}

export function ChipBars({ chips }: { chips: { label: string; count: number }[] }) {
  const max = Math.max(...chips.map((chip) => chip.count), 1);
  if (!chips.length) return <p className="text-sm text-moss">No chips chosen in this period.</p>;
  return <div className="space-y-3">{chips.map((chip) => <Bar key={chip.label} label={chip.label} value={chip.count} max={max} />)}</div>;
}

export function GeminiUsage({ usage }: { usage: { success: number; failed: number } }) {
  return (
    <div>
      <p className="font-display text-[1.9rem] font-semibold leading-none tabular-nums">{usage.success + usage.failed}</p>
      <p className="mt-1.5 text-sm text-moss">{usage.success} worked, {usage.failed} failed in the last 24 hours. Gemini runs only when a review would repeat.</p>
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

const STATUS_STYLE: Record<ReviewStatus, { icon: typeof Check; className: string }> = {
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

export function Pager({ base, page, pages, params }: { base: string; page: number; pages: number; params: Record<string, string> }) {
  if (pages <= 1) return null;
  const link = "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold";
  return (
    <nav aria-label="Review pages" className="mt-5 flex items-center justify-between">
      {page > 1 ? <Link href={{ pathname: base, query: { ...params, page: page - 1 } }} className={`${link} bg-mist hover:bg-line`}>Newer</Link> : <span />}
      <span className="text-sm tabular-nums text-moss">Page {page} of {pages}</span>
      {page < pages ? <Link href={{ pathname: base, query: { ...params, page: page + 1 } }} className={`${link} bg-mist hover:bg-line`}>Older</Link> : <span />}
    </nav>
  );
}
