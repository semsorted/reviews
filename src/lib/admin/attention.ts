import { prisma } from "@/lib/prisma";
import { formatWhen, parseDraftNotes } from "./tracking-core";

export const ATTENTION_PER_PAGE = 12;
export const ATTENTION_FILTERS = ["OPEN", "RESOLVED", "ALL"] as const;
export type AttentionFilter = (typeof ATTENTION_FILTERS)[number];

export type AttentionItem = {
  id: string;
  shopId: string;
  shopName: string;
  rating: number;
  message: string | null;
  status: "OPEN" | "RESOLVED";
  ownerNote: string;
  when: string;
  resolvedWhen: string | null;
  chips: string;
  draft: string | null;
  wentToGoogle: boolean;
};

export const parseAttentionFilter = (value: string | string[] | undefined): AttentionFilter =>
  ATTENTION_FILTERS.find((filter) => filter === value) ?? "OPEN";

export const openAttentionCount = (shopId?: string) => prisma.reviewFeedback.count({ where: { status: "OPEN", ...(shopId ? { shopId } : {}) } });

export async function getAttention(filter: AttentionFilter, page: number, shopId?: string, take = ATTENTION_PER_PAGE) {
  const shopWhere = shopId ? { shopId } : {};
  const where = { ...shopWhere, ...(filter === "ALL" ? {} : { status: filter }) };
  const [rows, total, open, resolved] = await Promise.all([
    prisma.reviewFeedback.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * take,
      take,
      select: { id: true, sessionId: true, shopId: true, rating: true, message: true, status: true, ownerNote: true, resolvedAt: true, createdAt: true, shop: { select: { name: true } } },
    }),
    prisma.reviewFeedback.count({ where }),
    prisma.reviewFeedback.count({ where: { ...shopWhere, status: "OPEN" } }),
    prisma.reviewFeedback.count({ where: { ...shopWhere, status: "RESOLVED" } }),
  ]);

  const sessionIds = rows.map((row) => row.sessionId);
  const [drafts, googleEvents] = sessionIds.length
    ? await Promise.all([
        prisma.reviewDraft.findMany({ where: { sessionId: { in: sessionIds } }, orderBy: { createdAt: "desc" }, select: { sessionId: true, generatedText: true, customerNotes: true } }),
        prisma.analyticsEvent.findMany({ where: { sessionId: { in: sessionIds }, eventType: "google_review_click" }, select: { sessionId: true } }),
      ])
    : [[], []];
  const wentToGoogle = new Set(googleEvents.map((event) => event.sessionId));

  const items: AttentionItem[] = rows.map((row) => {
    const draft = drafts.find((item) => item.sessionId === row.sessionId);
    return {
      id: row.id,
      shopId: row.shopId,
      shopName: row.shop.name,
      rating: row.rating,
      message: row.message,
      status: row.status === "RESOLVED" ? "RESOLVED" : "OPEN",
      ownerNote: row.ownerNote ?? "",
      when: formatWhen(row.createdAt),
      resolvedWhen: row.resolvedAt ? formatWhen(row.resolvedAt) : null,
      chips: parseDraftNotes(draft?.customerNotes ?? null).chips,
      draft: draft?.generatedText ?? null,
      wentToGoogle: wentToGoogle.has(row.sessionId),
    };
  });

  return { items, total, open, resolved, pages: Math.max(1, Math.ceil(total / take)) };
}
