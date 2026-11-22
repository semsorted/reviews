import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { chartDays, dayKeys, formatWhen, parseDraftNotes, rangeStart, reviewStatus, type ReviewStatus, type TrackingRange } from "./tracking-core";

export const REVIEWS_PER_PAGE = 20;

const FUNNEL_KEYS = { qr_scan: "scans", draft_generated: "drafts", copy_click: "copied", google_review_click: "google" } as const;
type FunnelEvent = keyof typeof FUNNEL_KEYS;
export type Funnel = Record<(typeof FUNNEL_KEYS)[FunnelEvent], number>;
export type DayPoint = { day: string; label: string; scans: number; google: number };
export type ActivityItem = { id: string; what: string; shop: string; when: string; at: number };
export type RatingCount = { rating: number; count: number };
export type TrackedReview = { id: string; text: string; rating: number | null; chips: string; language: string; source: string; status: ReviewStatus; edited: boolean; when: string };

const emptyFunnel = (): Funnel => ({ scans: 0, drafts: 0, copied: 0, google: 0 });
const shopFilter = (shopId?: string) => (shopId ? Prisma.sql`AND shop_id = ${shopId}::uuid` : Prisma.empty);

const AUDIT_LABELS: Record<string, string> = {
  "shop.create": "Shop created",
  "shop.update": "Shop details updated",
  "shop.delete": "Shop deleted",
  "qr.create": "QR created",
  "qr.update": "QR updated",
  "qr.delete": "QR deleted",
  "chip.create": "Chip added",
  "chip.update": "Chip updated",
  "chip.delete": "Chip removed",
  "attention.resolve": "Customer issue resolved",
  "attention.reopen": "Customer issue reopened",
};
const EVENT_LABELS: Record<string, string> = {
  qr_scan: "QR scanned",
  draft_generated: "Review drafted",
  copy_click: "Review copied",
  google_review_click: "Sent to Google",
  private_feedback: "Private message received",
};

/** Counts unique customers, so tapping a button twice does not inflate results. */
async function funnelRows(since: Date, shopId?: string) {
  return prisma.$queryRaw<{ shop_id: string; event_type: FunnelEvent; sessions: number }[]>`
    SELECT shop_id::text, event_type, COUNT(DISTINCT session_id)::int AS sessions
    FROM public.analytics_events
    WHERE event_type IN (${Prisma.join(Object.keys(FUNNEL_KEYS))}) AND created_at >= ${since}::timestamptz ${shopFilter(shopId)}
    GROUP BY 1, 2`;
}

async function ratingRows(since: Date, shopId?: string) {
  return prisma.$queryRaw<{ shop_id: string; rating: number; count: number }[]>`
    SELECT shop_id::text, substring(customer_notes from '^Rating ([1-5])')::int AS rating, COUNT(*)::int AS count
    FROM public.review_drafts
    WHERE customer_notes ~ '^Rating [1-5]' AND created_at >= ${since}::timestamptz ${shopFilter(shopId)}
    GROUP BY 1, 2`;
}

async function dailyPoints(range: TrackingRange, shopId?: string): Promise<DayPoint[]> {
  const keys = dayKeys(chartDays(range));
  const since = new Date(`${keys[0]}T00:00:00+05:30`);
  const rows = await prisma.$queryRaw<{ day: string; event_type: string; sessions: number }[]>`
    SELECT to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day, event_type, COUNT(DISTINCT session_id)::int AS sessions
    FROM public.analytics_events
    WHERE event_type IN ('qr_scan', 'google_review_click') AND created_at >= ${since}::timestamptz ${shopFilter(shopId)}
    GROUP BY 1, 2`;
  const value = (day: string, type: string) => rows.find((row) => row.day === day && row.event_type === type)?.sessions ?? 0;
  return keys.map((day) => ({
    day,
    label: new Date(`${day}T12:00:00+05:30`).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }),
    scans: value(day, "qr_scan"),
    google: value(day, "google_review_click"),
  }));
}

async function geminiUsage(shopId?: string) {
  const rows = await prisma.aiUsageLog.groupBy({
    by: ["status"],
    where: { provider: "gemini", createdAt: { gte: new Date(Date.now() - 86_400_000) }, ...(shopId ? { shopId } : {}) },
    _count: { _all: true },
  });
  const count = (status: string) => rows.find((row) => row.status === status)?._count._all ?? 0;
  return { success: count("SUCCESS"), failed: count("FAILED") };
}

async function recentActivity(shopId?: string, take = 12): Promise<ActivityItem[]> {
  const where = shopId ? { shopId } : {};
  const [audits, events] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take, select: { id: true, action: true, createdAt: true, details: true, shop: { select: { name: true } } } }),
    prisma.analyticsEvent.findMany({
      where: { ...where, eventType: { in: Object.keys(EVENT_LABELS) } },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, eventType: true, createdAt: true, shop: { select: { name: true } } },
    }),
  ]);
  return [
    ...audits.map((row) => ({
      id: row.id,
      what: AUDIT_LABELS[row.action] ?? row.action,
      shop: row.shop?.name ?? (row.details as { name?: string } | null)?.name ?? "Deleted shop",
      when: formatWhen(row.createdAt),
      at: row.createdAt.getTime(),
    })),
    ...events.map((row) => ({ id: row.id, what: EVENT_LABELS[row.eventType], shop: row.shop.name, when: formatWhen(row.createdAt), at: row.createdAt.getTime() })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, take);
}

function ratingSummary(rows: { rating: number; count: number }[]) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const average = total ? rows.reduce((sum, row) => sum + row.rating * row.count, 0) / total : null;
  const breakdown: RatingCount[] = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: rows.find((row) => row.rating === rating)?.count ?? 0 }));
  return { average, breakdown };
}

export async function getOverview(range: TrackingRange) {
  const since = rangeStart(range);
  // ponytail: loads every shop for instant search; add server pagination past a few hundred shops.
  const [shops, funnels, ratings, latest, daily, gemini, activity, openItems] = await Promise.all([
    prisma.shop.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, businessCategory: true, isActive: true, createdAt: true, _count: { select: { qrCodes: true } } } }),
    funnelRows(since),
    ratingRows(since),
    prisma.analyticsEvent.groupBy({ by: ["shopId"], _max: { createdAt: true } }),
    dailyPoints(range),
    geminiUsage(),
    recentActivity(),
    prisma.reviewFeedback.groupBy({ by: ["shopId"], where: { status: "OPEN" }, _count: { _all: true } }),
  ]);

  const totals = emptyFunnel();
  const byShop = new Map<string, Funnel>();
  for (const row of funnels) {
    const key = FUNNEL_KEYS[row.event_type];
    const funnel = byShop.get(row.shop_id) ?? emptyFunnel();
    funnel[key] = row.sessions;
    totals[key] += row.sessions;
    byShop.set(row.shop_id, funnel);
  }

  const rows = shops.map((shop) => {
    const shopRatings = ratings.filter((row) => row.shop_id === shop.id);
    const last = latest.find((row) => row.shopId === shop.id)?._max.createdAt;
    return {
      id: shop.id,
      name: shop.name,
      businessCategory: shop.businessCategory,
      isActive: shop.isActive,
      qrCount: shop._count.qrCodes,
      ...(byShop.get(shop.id) ?? emptyFunnel()),
      rating: ratingSummary(shopRatings).average,
      lastActivity: last ? formatWhen(last) : null,
      open: openItems.find((row) => row.shopId === shop.id)?._count._all ?? 0,
    };
  });

  return { shops: rows, totals, rating: ratingSummary(ratings.reduce<RatingCount[]>((all, row) => {
    const found = all.find((item) => item.rating === row.rating);
    if (found) found.count += row.count;
    else all.push({ rating: row.rating, count: row.count });
    return all;
  }, [])), daily, gemini, activity };
}

export async function getShopTracking(shopId: string, range: TrackingRange, page: number) {
  const since = rangeStart(range);
  const where = { shopId, createdAt: { gte: since } };
  const [funnels, ratings, chips, daily, qrRows, total, drafts, gemini, activity] = await Promise.all([
    funnelRows(since, shopId),
    ratingRows(since, shopId),
    prisma.$queryRaw<{ label: string; count: number }[]>`
      SELECT c.label, COUNT(*)::int AS count
      FROM public.review_chips c
      JOIN public.review_drafts d ON d.shop_id = c.shop_id
      WHERE c.shop_id = ${shopId}::uuid AND d.created_at >= ${since}::timestamptz
        AND position(', ' || c.label || ', ' IN ', ' || substring(d.customer_notes from '^Rating [1-5]: (.*)$') || ', ') > 0
      GROUP BY c.label
      ORDER BY count DESC, c.label
      LIMIT 8`,
    dailyPoints(range, shopId),
    prisma.$queryRaw<{ id: string; event_type: string; sessions: number }[]>`
      SELECT qr_code_id::text AS id, event_type, COUNT(DISTINCT session_id)::int AS sessions
      FROM public.analytics_events
      WHERE shop_id = ${shopId}::uuid AND qr_code_id IS NOT NULL AND event_type IN ('qr_scan', 'google_review_click') AND created_at >= ${since}::timestamptz
      GROUP BY 1, 2`,
    prisma.reviewDraft.count({ where }),
    prisma.reviewDraft.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * REVIEWS_PER_PAGE,
      take: REVIEWS_PER_PAGE,
      select: { id: true, sessionId: true, generatedText: true, customerNotes: true, language: true, provider: true, isCopied: true, createdAt: true },
    }),
    geminiUsage(shopId),
    recentActivity(shopId, 6),
  ]);

  const events = drafts.length
    ? await prisma.analyticsEvent.findMany({
        where: { shopId, sessionId: { in: drafts.map((draft) => draft.sessionId) }, eventType: { in: ["copy_click", "google_review_click"] } },
        select: { sessionId: true, eventType: true, metadata: true },
      })
    : [];

  const reviews: TrackedReview[] = drafts.map((draft) => {
    const own = events.filter((event) => {
      const draftId = (event.metadata as { draftId?: string } | null)?.draftId;
      return event.sessionId === draft.sessionId && (!draftId || draftId === draft.id);
    });
    const isCopied = draft.isCopied || own.some((event) => event.eventType === "copy_click");
    const notes = parseDraftNotes(draft.customerNotes);
    return {
      id: draft.id,
      text: draft.generatedText,
      rating: notes.rating,
      chips: notes.chips,
      language: draft.language,
      source: draft.provider === "gemini" ? "Gemini" : "Instant",
      status: reviewStatus(isCopied, own.some((event) => event.eventType === "google_review_click")),
      edited: own.some((event) => event.eventType === "copy_click" && (event.metadata as { edited?: boolean } | null)?.edited === true),
      when: formatWhen(draft.createdAt),
    };
  });

  const funnel = emptyFunnel();
  for (const row of funnels) funnel[FUNNEL_KEYS[row.event_type]] = row.sessions;
  const qrStat = (id: string, type: string) => qrRows.find((row) => row.id === id && row.event_type === type)?.sessions ?? 0;

  return { funnel, rating: ratingSummary(ratings), chips, daily, qrStat, reviews, total, pages: Math.max(1, Math.ceil(total / REVIEWS_PER_PAGE)), gemini, activity };
}
