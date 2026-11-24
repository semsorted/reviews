import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";
import { staffBoard } from "@/lib/ordering/staff-view";

const NO_STORE = { "Cache-Control": "no-store" };

/** Kitchen and owner screens poll this. 204 means nothing changed since their last version. */
export async function GET(request: NextRequest) {
  try {
    const staff = await requireStaff(CAN.seeOrders);
    const settings = await prisma.orderingSettings.findUniqueOrThrow({ where: { shopId: staff.shopId }, select: { version: true } });
    if (request.nextUrl.searchParams.get("v") === settings.version.toString()) return new NextResponse(null, { status: 204, headers: NO_STORE });
    return NextResponse.json(await staffBoard(staff), { headers: NO_STORE });
  } catch (error) {
    return staffErrorResponse(error, "Orders");
  }
}
