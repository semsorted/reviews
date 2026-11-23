import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, readBody } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

const price = z.number().int().min(1).max(1_000_000);
const PricingSchema = z.object({ normalPrice: price, customPrice: price });

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await readBody(request, PricingSchema);
    if (!body) return badRequest();

    await prisma.$transaction([
      prisma.posterPricing.upsert({ where: { id: 1 }, create: { id: 1, ...body }, update: body }),
      prisma.auditLog.create({ data: { userId: admin.id, action: "poster.pricing_update", entityType: "PosterPricing", entityId: "1", details: body } }),
    ]);
    return NextResponse.json(body);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
