import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isUuid, readBody } from "@/lib/admin/api";
import { bumpVersion, freezeBill, lockTable, NEXT_STATUS } from "@/lib/ordering/service";
import { CAN, requireStaff, StaffAuthError, staffErrorResponse } from "@/lib/ordering/staff-auth";
import { prisma } from "@/lib/prisma";

const StatusSchema = z.object({ status: z.enum(["PREPARING", "SERVED", "CANCELLED"]) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff(CAN.seeOrders);
    const { id } = await params;
    const body = await readBody(request, StatusSchema);
    if (!isUuid(id) || !body) return NextResponse.json({ error: "Please try again." }, { status: 400 });
    const allowed = { PREPARING: CAN.cook, SERVED: CAN.serve, CANCELLED: CAN.cancel }[body.status] as readonly string[];
    if (!allowed.includes(staff.role)) throw new StaffAuthError(403);

    const moved = await prisma.$transaction(async (tx) => {
      const found = await tx.order.findFirst({ where: { id, shopId: staff.shopId }, select: { session: { select: { tableId: true } } } });
      if (!found) return "missing";
      await lockTable(tx, found.session.tableId);
      const order = await tx.order.findFirst({ where: { id, shopId: staff.shopId }, select: { status: true, session: { select: { id: true, status: true } } } });
      if (!order || !NEXT_STATUS[order.status]?.includes(body.status)) return "stale";
      // Only moves from the status this screen saw, so two staff tapping at once cannot undo each other.
      const { count } = await tx.order.updateMany({
        where: { id, shopId: staff.shopId, status: order.status },
        data: { status: body.status, servedAt: body.status === "SERVED" ? new Date() : undefined },
      });
      if (count === 0) return "stale";
      // A cancelled order comes off a bill the guest is already looking at.
      if (body.status === "CANCELLED" && order.session.status === "BILL_REQUESTED") await freezeBill(tx, order.session.id, staff.shopId);
      await bumpVersion(tx, staff.shopId);
      return "ok";
    });
    if (moved === "missing") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (moved === "stale") return NextResponse.json({ error: "This order already moved. The screen will refresh." }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return staffErrorResponse(error, "OrderStatus");
  }
}
