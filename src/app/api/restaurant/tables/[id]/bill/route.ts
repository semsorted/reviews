import { NextRequest, NextResponse } from "next/server";
import { isUuid } from "@/lib/admin/api";
import { lockOpenTab, requestBill } from "@/lib/ordering/service";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";
import { prisma } from "@/lib/prisma";

/** Staff prepare the bill for a table, the same as a guest tapping "Get bill". */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff(CAN.billTable);
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const ok = await prisma.$transaction(async (tx) => {
      const tab = await lockOpenTab(tx, { tableId: id, shopId: staff.shopId });
      return tab ? requestBill(tx, tab.id, staff.shopId) : false;
    });
    return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: "There is nothing to bill on this table yet." }, { status: 409 });
  } catch (error) {
    return staffErrorResponse(error, "TableBill");
  }
}
