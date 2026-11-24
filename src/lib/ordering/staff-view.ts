import { prisma } from "@/lib/prisma";
import { formatBillNo, OPEN_STATUSES, orderSelect, toOrderView, type OrderView } from "./service";
import { CAN, type Staff } from "./staff-auth";

const SERVED_VISIBLE_MS = 2 * 60 * 60 * 1000;

export type BoardOrder = OrderView & { tableLabel: string; partySize: number; guestName: string | null };
export type OpenTab = { id: string; tableId: string; tableLabel: string; status: string; partySize: number; billNo: string | null; totalPaise: number; orders: number; createdAt: string };
export type StaffBoard = { version: string; role: Staff["role"]; orders: BoardOrder[]; tabs: OpenTab[] };

export async function staffBoard(staff: Staff): Promise<StaffBoard> {
  const since = new Date(Date.now() - SERVED_VISIBLE_MS);
  const [settings, orders, tabs] = await Promise.all([
    prisma.orderingSettings.findUniqueOrThrow({ where: { shopId: staff.shopId }, select: { version: true } }),
    prisma.order.findMany({
      where: { shopId: staff.shopId, OR: [{ status: { in: ["RECEIVED", "PREPARING"] } }, { status: { in: ["SERVED", "CANCELLED"] }, updatedAt: { gte: since } }] },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: { ...orderSelect, session: { select: { partySize: true, guestName: true, table: { select: { label: true } } } } },
    }),
    (CAN.billTable as readonly string[]).includes(staff.role)
      ? prisma.tableSession.findMany({
          where: { shopId: staff.shopId, status: { in: OPEN_STATUSES } },
          orderBy: { createdAt: "asc" },
          select: { id: true, tableId: true, status: true, partySize: true, billFy: true, billNo: true, totalPaise: true, createdAt: true, table: { select: { label: true } }, _count: { select: { orders: { where: { status: { not: "CANCELLED" } } } } } },
        })
      : Promise.resolve([]),
  ]);

  return {
    version: settings.version.toString(),
    role: staff.role,
    orders: orders.map(({ session, ...order }) => ({ ...toOrderView(order), tableLabel: session.table.label, partySize: session.partySize, guestName: session.guestName })),
    tabs: tabs.map((tab) => ({
      id: tab.id,
      tableId: tab.tableId,
      tableLabel: tab.table.label,
      status: tab.status,
      partySize: tab.partySize,
      billNo: formatBillNo(tab),
      totalPaise: tab.totalPaise,
      orders: tab._count.orders,
      createdAt: tab.createdAt.toISOString(),
    })),
  };
}
