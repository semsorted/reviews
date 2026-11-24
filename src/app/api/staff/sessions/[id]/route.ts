import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isUuid, readBody } from "@/lib/admin/api";
import { bumpVersion, freezeBill, lockOpenTab } from "@/lib/ordering/service";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";
import { prisma } from "@/lib/prisma";

const CloseSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("paid"), method: z.enum(["UPI", "CASH"]) }),
  z.object({ action: z.literal("void") }),
]);

/**
 * Owner or manager closes a table: "paid" records the payment, "void" closes a tab with nothing to bill
 * (only cancelled orders, or none). Closing frees the table for the next guests.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff(CAN.markPaid);
    const { id } = await params;
    const body = await readBody(request, CloseSchema);
    if (!isUuid(id) || !body) return NextResponse.json({ error: "Please try again." }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const tab = await lockOpenTab(tx, { id, shopId: staff.shopId });
      if (!tab) return "closed";
      const billable = await tx.order.count({ where: { sessionId: id, status: { not: "CANCELLED" } } });
      if (body.action === "void") {
        if (billable) return "hasOrders";
        await tx.tableSession.update({ where: { id }, data: { status: "VOID" } });
      } else {
        if (!billable) return "empty";
        await freezeBill(tx, id, staff.shopId);
        await tx.tableSession.update({ where: { id }, data: { status: "PAID", paidMethod: body.method, paidAt: new Date() } });
      }
      await bumpVersion(tx, staff.shopId);
      return "ok";
    });
    if (result === "closed") return NextResponse.json({ error: "This table is already closed. The screen will refresh." }, { status: 409 });
    if (result === "hasOrders") return NextResponse.json({ error: "This table has orders to pay for. Mark it paid instead." }, { status: 409 });
    if (result === "empty") return NextResponse.json({ error: "Nothing to pay on this table. Close it without a bill." }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return staffErrorResponse(error, "CloseTable");
  }
}
