import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, chipLabelSchema, conflict, isUuid, notFoundResponse, readBody } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { MAX_ACTIVE_CHIPS } from "@/lib/reviews/rules";

type Context = { params: Promise<{ id: string }> };

const CreateChipSchema = z.object({ label: chipLabelSchema });
const ReorderSchema = z.object({ orderedIds: z.array(z.uuid()).min(1) });

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const admin = await requireAdmin();
    const { id: shopId } = await params;
    if (!isUuid(shopId)) return notFoundResponse();

    const body = await readBody(request, CreateChipSchema);
    if (!body) return badRequest();

    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } });
    if (!shop) return notFoundResponse();

    const duplicate = await prisma.reviewChip.findFirst({
      where: { shopId, label: { equals: body.label, mode: "insensitive" } },
      select: { id: true },
    });
    if (duplicate) return conflict("This chip already exists.");

    const total = await prisma.reviewChip.count({ where: { shopId } });
    if (total >= MAX_ACTIVE_CHIPS) return conflict(`A shop can have up to ${MAX_ACTIVE_CHIPS} chips.`);

    const chip = await prisma.reviewChip.create({
      data: { shopId, label: body.label, sortOrder: total },
      select: { id: true, label: true, sortOrder: true, isActive: true },
    });
    await prisma.auditLog.create({
      data: { userId: admin.id, shopId, action: "chip.create", entityType: "ReviewChip", entityId: chip.id },
    });

    return NextResponse.json({ chip }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    await requireAdmin();
    const { id: shopId } = await params;
    if (!isUuid(shopId)) return notFoundResponse();

    const body = await readBody(request, ReorderSchema);
    if (!body) return badRequest();

    const existing = await prisma.reviewChip.findMany({ where: { shopId }, select: { id: true } });
    const known = new Set(existing.map((chip) => chip.id));
    const ordered = new Set(body.orderedIds);
    if (ordered.size !== body.orderedIds.length || ordered.size !== known.size || body.orderedIds.some((id) => !known.has(id))) {
      return badRequest();
    }

    await prisma.$transaction(
      body.orderedIds.map((id, sortOrder) => prisma.reviewChip.update({ where: { id }, data: { sortOrder } }))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
