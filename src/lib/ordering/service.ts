import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MIN_CHIPS } from "@/lib/reviews/rules";
import { isSubscribed } from "@/lib/subscription";
import { billNumber, billTotals, financialYear } from "./bill";

type Tx = Prisma.TransactionClient;

export const MAX_ORDERS_PER_SESSION = 15;
export const MAX_WAITING_ORDERS = 5;
export const OPEN_STATUSES = ["OPEN", "BILL_REQUESTED"];
/** Kitchen can only move an order forward. */
export const NEXT_STATUS: Record<string, string[]> = { RECEIVED: ["PREPARING", "SERVED", "CANCELLED"], PREPARING: ["SERVED", "CANCELLED"] };

/**
 * Orders, bills and payments for one table all take this lock first,
 * so an order can never slip into a tab while that tab is being billed or closed.
 */
export const lockTable = (tx: Tx, tableId: string) => tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${tableId}::text, 2))`;

/** Locks the table, then returns its tab only if it is still open after the lock. */
export async function lockOpenTab(tx: Tx, where: { id?: string; tableId?: string; shopId: string }) {
  const found = await tx.tableSession.findFirst({ where: { ...where, status: { in: OPEN_STATUSES } }, select: { tableId: true, id: true } });
  if (!found) return null;
  await lockTable(tx, found.tableId);
  return tx.tableSession.findFirst({ where: { id: found.id, status: { in: OPEN_STATUSES } }, select: { id: true, tableId: true, status: true } });
}

/** "Get bill" from a guest or staff. Returns false when the tab has nothing to bill. */
export async function requestBill(tx: Tx, sessionId: string, shopId: string) {
  if ((await tx.order.count({ where: { sessionId, status: { not: "CANCELLED" } } })) === 0) return false;
  await freezeBill(tx, sessionId, shopId);
  await tx.tableSession.update({ where: { id: sessionId }, data: { status: "BILL_REQUESTED", billRequestedAt: new Date() } });
  await bumpVersion(tx, shopId);
  return true;
}

/** Every change bumps one number, so screens can ask "anything new?" with a single indexed read. */
export const bumpVersion = (tx: Tx, shopId: string) => tx.orderingSettings.update({ where: { shopId }, data: { version: { increment: 1 } } });

/** A table that can take orders right now, with its restaurant. */
export async function findOrderingTable(token: string) {
  if (!/^[A-Za-z0-9]{16,64}$/.test(token)) return null;
  const table = await prisma.diningTable.findUnique({ where: { publicToken: token }, select: { id: true, shopId: true, label: true, isActive: true } });
  if (!table?.isActive) return null;
  const [settings, shop] = await Promise.all([
    prisma.orderingSettings.findUnique({ where: { shopId: table.shopId } }),
    prisma.shop.findUnique({ where: { id: table.shopId }, select: { id: true, name: true, address: true, logoUrl: true, primaryColor: true, isActive: true, subscriptionEndsAt: true } }),
  ]);
  if (!settings?.isEnabled || !shop?.isActive || !isSubscribed(shop.subscriptionEndsAt)) return null;
  return { table, settings, shop };
}

/** Freezes the bill: totals from every order that was not cancelled, and a gapless number per financial year. */
export async function freezeBill(tx: Tx, sessionId: string, shopId: string) {
  const [session, settings, orders] = await Promise.all([
    tx.tableSession.findUniqueOrThrow({ where: { id: sessionId }, select: { billFy: true, billNo: true } }),
    tx.orderingSettings.findUniqueOrThrow({ where: { shopId }, select: { gstRateBp: true } }),
    tx.order.findMany({ where: { sessionId, status: { not: "CANCELLED" } }, select: { items: { select: { pricePaise: true, qty: true } } } }),
  ]);
  const totals = billTotals(orders.flatMap((order) => order.items), settings.gstRateBp);
  let { billFy, billNo } = session;
  if (billNo === null) {
    const fy = financialYear();
    // One row update hands out the next number, so two bills can never share one.
    const [next] = await tx.$queryRaw<{ bill_fy: number; bill_seq: number }[]>`
      UPDATE public.ordering_settings
      SET bill_seq = CASE WHEN bill_fy = ${fy} THEN bill_seq + 1 ELSE 1 END, bill_fy = ${fy}
      WHERE shop_id = ${shopId}::uuid RETURNING bill_fy, bill_seq`;
    billFy = next.bill_fy;
    billNo = next.bill_seq;
  }
  return tx.tableSession.update({
    where: { id: sessionId },
    data: {
      billFy,
      billNo,
      gstRateBp: settings.gstRateBp,
      subtotalPaise: totals.subtotal,
      cgstPaise: totals.cgst,
      sgstPaise: totals.sgst,
      roundOffPaise: totals.roundOff,
      totalPaise: totals.total,
    },
  });
}

export const formatBillNo = (session: { billFy: number | null; billNo: number | null }) =>
  session.billFy !== null && session.billNo !== null ? billNumber(session.billFy, session.billNo) : null;

/** The shop's review QR, only when the review page would actually open. */
export async function reviewLinkFor(shopId: string) {
  const qr = await prisma.qrCode.findFirst({
    where: { shopId, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { publicToken: true, shop: { select: { isActive: true, subscriptionEndsAt: true, _count: { select: { chips: { where: { isActive: true } } } } } } },
  });
  if (!qr?.shop.isActive || !isSubscribed(qr.shop.subscriptionEndsAt) || qr.shop._count.chips < MIN_CHIPS) return null;
  return `/r/${qr.publicToken}`;
}

export type OrderView = {
  id: string;
  status: string;
  createdAt: string;
  note: string | null;
  items: { name: string; qty: number; pricePaise: number; isVeg: boolean }[];
};

export const orderSelect = {
  id: true,
  status: true,
  createdAt: true,
  note: true,
  items: { select: { name: true, qty: true, pricePaise: true, isVeg: true } },
} satisfies Prisma.OrderSelect;

export const toOrderView = (order: Prisma.OrderGetPayload<{ select: typeof orderSelect }>): OrderView => ({ ...order, createdAt: order.createdAt.toISOString() });
