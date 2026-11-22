import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, conflict, isUuid, notFoundResponse, readBody } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { renewedEnd } from "@/lib/subscription";

const RenewSchema = z.object({ expectedEndsAt: z.iso.datetime() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (!isUuid(id)) return notFoundResponse();
    const body = await readBody(request, RenewSchema);
    if (!body) return badRequest();

    const current = new Date(body.expectedEndsAt);
    const subscriptionEndsAt = renewedEnd(current);
    // Matching the old date means a double tap can never add two years.
    const saved = await prisma.$transaction(async (tx) => {
      const { count } = await tx.shop.updateMany({ where: { id, subscriptionEndsAt: current }, data: { subscriptionEndsAt } });
      if (count === 0) return false;
      await tx.auditLog.create({
        data: {
          userId: admin.id,
          shopId: id,
          action: "shop.subscription_renew",
          entityType: "Shop",
          entityId: id,
          details: { from: current.toISOString(), to: subscriptionEndsAt.toISOString() },
        },
      });
      return true;
    });
    if (!saved) return conflict("This subscription already changed. Refresh to see the new date.");

    return NextResponse.json({ subscriptionEndsAt: subscriptionEndsAt.toISOString() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
