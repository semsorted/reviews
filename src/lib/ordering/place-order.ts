import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bumpVersion, lockTable, MAX_ORDERS_PER_SESSION, MAX_WAITING_ORDERS, OPEN_STATUSES } from "./service";

const cleanText = (max: number) => z.string().transform((text) => text.replace(/[\u0000-\u001F\u007F]/g, " ").trim()).pipe(z.string().max(max));

/** What a guest phone or a waiter sends. Prices never come from the phone. */
export const OrderLinesSchema = z.object({
  key: z.uuid(),
  partySize: z.number().int().min(1).max(20),
  name: cleanText(40).optional(),
  note: cleanText(140).optional(),
  items: z
    .array(z.object({ itemId: z.uuid(), qty: z.number().int().min(1).max(20) }))
    .min(1)
    .max(30)
    .refine((items) => new Set(items.map((item) => item.itemId.toLowerCase())).size === items.length),
});
export type OrderLines = z.infer<typeof OrderLinesSchema>;

export type PlaceResult = { status: number; body: Record<string, unknown> };

class OrderStop {
  constructor(public result: PlaceResult) {}
}

/** Adds an order to the table's open tab, creating the tab if needed. Safe to retry with the same key. */
export async function placeOrder(table: { id: string; shopId: string }, body: OrderLines): Promise<PlaceResult> {
  const itemIds = body.items.map((item) => item.itemId.toLowerCase());
  try {
    return await prisma.$transaction(async (tx) => {
      await lockTable(tx, table.id);
      const repeat = await tx.order.findUnique({ where: { idempotencyKey: body.key }, select: { id: true, sessionId: true, shopId: true } });
      if (repeat) {
        if (repeat.shopId !== table.shopId) throw new OrderStop({ status: 409, body: { error: "Please try again." } });
        return { status: 200, body: { orderId: repeat.id, sessionId: repeat.sessionId } };
      }

      let session = await tx.tableSession.findFirst({ where: { tableId: table.id, status: { in: OPEN_STATUSES } }, select: { id: true, status: true, partySize: true } });
      if (!session) {
        session = await tx.tableSession.create({
          data: { shopId: table.shopId, tableId: table.id, partySize: body.partySize, guestName: body.name || null },
          select: { id: true, status: true, partySize: true },
        });
      } else if (session.status !== "OPEN" || body.partySize > session.partySize) {
        // Ordering more after asking for the bill reopens the tab. The bill is worked out again later.
        await tx.tableSession.update({ where: { id: session.id }, data: { status: "OPEN", partySize: Math.max(body.partySize, session.partySize) } });
      }

      // Cancelled orders do not count, so staff can clear junk orders without blocking the table.
      const all = await tx.order.count({ where: { sessionId: session.id, status: { not: "CANCELLED" } } });
      const waiting = await tx.order.count({ where: { sessionId: session.id, status: "RECEIVED" } });
      if (all >= MAX_ORDERS_PER_SESSION || waiting >= MAX_WAITING_ORDERS) {
        throw new OrderStop({ status: 429, body: { error: "This table has many orders waiting. Please ask the staff." } });
      }

      const menu = await tx.menuItem.findMany({ where: { id: { in: itemIds }, shopId: table.shopId, isAvailable: true }, select: { id: true, name: true, pricePaise: true, isVeg: true } });
      const byId = new Map(menu.map((item) => [item.id.toLowerCase(), item]));
      const unavailable = itemIds.filter((id) => !byId.has(id));
      if (unavailable.length) throw new OrderStop({ status: 409, body: { error: "Some items just ran out. Please update the order.", unavailable } });

      const order = await tx.order.create({
        data: {
          sessionId: session.id,
          shopId: table.shopId,
          idempotencyKey: body.key,
          note: body.note || null,
          items: {
            create: body.items.map((line) => {
              const item = byId.get(line.itemId.toLowerCase())!;
              return { menuItemId: item.id, name: item.name, pricePaise: item.pricePaise, isVeg: item.isVeg, qty: line.qty };
            }),
          },
        },
        select: { id: true },
      });
      await bumpVersion(tx, table.shopId);
      return { status: 201, body: { orderId: order.id, sessionId: session.id } };
    });
  } catch (error) {
    if (error instanceof OrderStop) return error.result;
    console.error("[Ordering:PlaceOrder]", error);
    return { status: 503, body: { error: "The order did not go through. Please try again." } };
  }
}
