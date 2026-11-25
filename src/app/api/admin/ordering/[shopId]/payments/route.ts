import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, conflict, readBody } from "@/lib/admin/api";
import { adminErrorResponse } from "@/lib/auth/guard";
import { adminShop } from "@/lib/ordering/admin-shop";
import { prisma } from "@/lib/prisma";
import { PAY_METHODS, PERIOD_MONTHS, priceFor } from "@/lib/restaurant-plans";
import { extendedEnd } from "@/lib/subscription";

const PaymentSchema = z.object({
  key: z.uuid(),
  planId: z.string().max(20),
  period: z.enum(["month", "year"]),
  method: z.enum(PAY_METHODS),
  reference: z.string().trim().max(40).optional(),
  expectedEndsAt: z.iso.datetime(),
});

/** The admin saw the money arrive: record it and extend the subscription. The amount always comes from the plan, never from the page. */
export async function POST(request: NextRequest, context: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId, actor } = await adminShop(context.params);
    const body = await readBody(request, PaymentSchema);
    if (!body || !("adminId" in actor)) return badRequest();

    const repeat = await prisma.shopPayment.findUnique({ where: { idempotencyKey: body.key }, select: { id: true, shopId: true } });
    if (repeat) return repeat.shopId === shopId ? NextResponse.json({ id: repeat.id }) : conflict("Please try again.");

    const plan = await prisma.restaurantPlan.findUnique({ where: { id: body.planId } });
    if (!plan) return badRequest();
    const months = PERIOD_MONTHS[body.period];
    const current = new Date(body.expectedEndsAt);
    const periodTo = extendedEnd(current, months);
    const periodFrom = new Date(Math.max(current.getTime(), Date.now()));

    // Matching the old end date means a double tap can never add the time twice.
    const id = await prisma.$transaction(async (tx) => {
      const { count } = await tx.shop.updateMany({ where: { id: shopId, subscriptionEndsAt: current }, data: { subscriptionEndsAt: periodTo } });
      if (count === 0) return null;
      const payment = await tx.shopPayment.create({
        data: {
          shopId, planId: plan.id, planName: plan.name, months, amount: priceFor(plan, body.period), method: body.method,
          reference: body.reference || null, idempotencyKey: body.key, periodFrom, periodTo, createdBy: actor.adminId,
        },
        select: { id: true, amount: true },
      });
      await tx.auditLog.create({
        data: { userId: actor.adminId, shopId, action: "restaurant.payment", entityType: "ShopPayment", entityId: payment.id, details: { plan: plan.id, months, amount: payment.amount, method: body.method, to: periodTo.toISOString() } },
      });
      return payment.id;
    });
    if (!id) return conflict("This plan already changed. Refresh to see the new date.");
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
