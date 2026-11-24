import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isUuid, readBody } from "@/lib/admin/api";
import { bumpVersion } from "@/lib/ordering/service";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";
import { prisma } from "@/lib/prisma";

const AvailableSchema = z.object({ isAvailable: z.boolean() });

/** Owner turns a dish off when it runs out, and on again later. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff(CAN.toggleDish);
    const { id } = await params;
    const body = await readBody(request, AvailableSchema);
    if (!isUuid(id) || !body) return NextResponse.json({ error: "Please try again." }, { status: 400 });
    const count = await prisma.$transaction(async (tx) => {
      const { count } = await tx.menuItem.updateMany({ where: { id, shopId: staff.shopId }, data: { isAvailable: body.isAvailable } });
      if (count) await bumpVersion(tx, staff.shopId);
      return count;
    });
    return count ? NextResponse.json({ success: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return staffErrorResponse(error, "Menu");
  }
}
