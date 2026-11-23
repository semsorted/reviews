import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, conflict, readBody } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { couponCode, formatInr } from "@/lib/poster-pricing";
import { prisma } from "@/lib/prisma";

const CouponSchema = z.object({
  code: z.string().transform(couponCode).pipe(z.string().regex(/^[A-Z0-9]{3,20}$/)),
  amountOff: z.number().int().min(1).max(1_000_000),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await readBody(request, CouponSchema);
    if (!body) return badRequest();

    const { customPrice } = await prisma.posterPricing.findUniqueOrThrow({ where: { id: 1 } });
    if (body.amountOff >= customPrice) return conflict(`Discount must be less than the Custom price of ${formatInr(customPrice)}.`);

    const created = await prisma.$transaction(async (tx) => {
      const { count } = await tx.posterCoupon.createMany({ data: body, skipDuplicates: true });
      if (count === 0) return false;
      await tx.auditLog.create({ data: { userId: admin.id, action: "poster.coupon_create", entityType: "PosterCoupon", entityId: body.code, details: body } });
      return true;
    });
    if (!created) return conflict("This coupon code already exists.");

    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
