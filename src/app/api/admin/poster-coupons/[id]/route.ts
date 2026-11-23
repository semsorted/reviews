import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, isUuid, notFoundResponse, readBody } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({ isActive: z.boolean() });

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (!isUuid(id)) return notFoundResponse();
    const body = await readBody(request, UpdateSchema);
    if (!body) return badRequest();

    const saved = await prisma.$transaction(async (tx) => {
      const { count } = await tx.posterCoupon.updateMany({ where: { id }, data: body });
      if (count === 0) return false;
      await tx.auditLog.create({ data: { userId: admin.id, action: "poster.coupon_update", entityType: "PosterCoupon", entityId: id, details: body } });
      return true;
    });
    return saved ? NextResponse.json(body) : notFoundResponse();
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (!isUuid(id)) return notFoundResponse();

    const deleted = await prisma.$transaction(async (tx) => {
      const { count } = await tx.posterCoupon.deleteMany({ where: { id } });
      if (count === 0) return false;
      await tx.auditLog.create({ data: { userId: admin.id, action: "poster.coupon_delete", entityType: "PosterCoupon", entityId: id } });
      return true;
    });
    return deleted ? NextResponse.json({ success: true }) : notFoundResponse();
  } catch (error) {
    return adminErrorResponse(error);
  }
}
