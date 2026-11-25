import { NextResponse } from "next/server";
import { adminErrorResponse } from "@/lib/auth/guard";
import { adminShop } from "@/lib/ordering/admin-shop";
import { prisma } from "@/lib/prisma";

/** Deletes a restaurant for good: its business, QR, menu, tables, staff logins, orders, bills and payments. */
export async function DELETE(_request: Request, context: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId, actor } = await adminShop(context.params);
    if (!("adminId" in actor)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    await prisma.$transaction(
      async (tx) => {
        const shop = await tx.shop.findUniqueOrThrow({ where: { id: shopId }, select: { name: true } });
        // Tables cannot be removed while tabs point at them, so clear the tabs (and their orders) first.
        await tx.tableSession.deleteMany({ where: { shopId } });
        await tx.shop.delete({ where: { id: shopId } });
        await tx.auditLog.create({ data: { userId: actor.adminId, action: "restaurant.delete", entityType: "Shop", entityId: shopId, details: { name: shop.name } } });
      },
      { timeout: 30_000 },
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
