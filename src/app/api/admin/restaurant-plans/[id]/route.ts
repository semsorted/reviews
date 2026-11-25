import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, notFoundResponse, readBody } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

const PlanSchema = z.object({ monthlyPrice: z.number().int().min(1).max(1_000_000), yearlyPrice: z.number().int().min(1).max(10_000_000) });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await readBody(request, PlanSchema);
    if (!body) return badRequest();
    const { count } = await prisma.restaurantPlan.updateMany({ where: { id }, data: body });
    if (count === 0) return notFoundResponse();
    await prisma.auditLog.create({ data: { userId: admin.id, action: "restaurant.plan_update", entityType: "RestaurantPlan", entityId: id, details: body } });
    return NextResponse.json(body);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
