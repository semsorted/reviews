import { prisma } from "@/lib/prisma";
import { generateQrSvg } from "@/lib/qr/generator";
import { billUpiUrl } from "./bill";
import { findOrderingTable, formatBillNo, OPEN_STATUSES, orderSelect, reviewLinkFor, toOrderView, type OrderView } from "./service";

/** A paid bill stays visible to its own phone for a few hours, for the review prompt. */
const PAID_VISIBLE_MS = 6 * 60 * 60 * 1000;

export type GuestBill = {
  billNo: string | null;
  status: string;
  gstRateBp: number;
  subtotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  roundOffPaise: number;
  totalPaise: number;
  gstin: string | null;
  fssai: string | null;
  paidMethod: string | null;
  upiQr: string | null;
};

export type GuestStatus = {
  version: string;
  session: { id: string; status: string; partySize: number } | null;
  orders: OrderView[];
  bill: GuestBill | null;
  reviewUrl: string | null;
};

export async function guestStatus(found: NonNullable<Awaited<ReturnType<typeof findOrderingTable>>>, sessionId?: string): Promise<GuestStatus> {
  const { table, settings, shop } = found;
  const own = sessionId
    ? await prisma.tableSession.findFirst({ where: { id: sessionId, tableId: table.id } })
    : null;
  const usable = own && (OPEN_STATUSES.includes(own.status) || (own.status === "PAID" && own.paidAt && Date.now() - own.paidAt.getTime() < PAID_VISIBLE_MS));
  const session = usable ? own : await prisma.tableSession.findFirst({ where: { tableId: table.id, status: { in: OPEN_STATUSES } } });
  const version = settings.version.toString();
  if (!session) return { version, session: null, orders: [], bill: null, reviewUrl: null };

  const orders = await prisma.order.findMany({ where: { sessionId: session.id }, orderBy: { createdAt: "asc" }, select: orderSelect });
  const billNo = formatBillNo(session);
  const hasBill = session.status === "BILL_REQUESTED" || session.status === "PAID";
  const upiUrl = hasBill && session.status !== "PAID" && billNo ? billUpiUrl(settings.upiUrl, session.totalPaise, billNo) : null;
  const upiQr = upiUrl ? `data:image/svg+xml;base64,${Buffer.from(await generateQrSvg({ url: upiUrl, margin: 4 })).toString("base64")}` : null;

  return {
    version,
    session: { id: session.id, status: session.status, partySize: session.partySize },
    orders: orders.map(toOrderView),
    bill: hasBill
      ? {
          billNo,
          status: session.status,
          gstRateBp: session.gstRateBp,
          subtotalPaise: session.subtotalPaise,
          cgstPaise: session.cgstPaise,
          sgstPaise: session.sgstPaise,
          roundOffPaise: session.roundOffPaise,
          totalPaise: session.totalPaise,
          gstin: settings.gstin,
          fssai: settings.fssai,
          paidMethod: session.paidMethod,
          upiQr,
        }
      : null,
    reviewUrl: session.status === "PAID" ? await reviewLinkFor(shop.id) : null,
  };
}
