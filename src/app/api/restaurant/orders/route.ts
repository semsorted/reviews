import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readBody } from "@/lib/admin/api";
import { OrderLinesSchema, placeOrder } from "@/lib/ordering/place-order";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";
import { prisma } from "@/lib/prisma";

const WaiterOrderSchema = OrderLinesSchema.extend({ tableId: z.uuid() });

/** A waiter takes an order at the table for guests who don't want to use their phone. */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaff(CAN.takeOrder);
    const body = await readBody(request, WaiterOrderSchema);
    if (!body) return NextResponse.json({ error: "Please check the order and try again." }, { status: 400 });
    const table = await prisma.diningTable.findFirst({ where: { id: body.tableId, shopId: staff.shopId, isActive: true }, select: { id: true, shopId: true } });
    if (!table) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const result = await placeOrder(table, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    return staffErrorResponse(error, "WaiterOrder");
  }
}
