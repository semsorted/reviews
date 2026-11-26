import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { badRequest, chipLabelSchema, conflict, isUuid, notFoundResponse, readBody } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { MIN_CHIPS } from "@/lib/reviews/rules";

type Context = { params: Promise<{ id: string; chipId: string }> };

const UpdateChipSchema = z
  .object({ label: chipLabelSchema.optional(), isActive: z.boolean().optional(), isPinned: z.boolean().optional() })
  .refine((body) => body.label !== undefined || body.isActive !== undefined || body.isPinned !== undefined);

const tooFewChips = () => conflict(`Keep at least ${MIN_CHIPS} active chips so printed QR codes keep working.`);

type Tx = Prisma.TransactionClient;

const lockShopChips = (tx: Tx, shopId: string) =>
  tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${shopId}::text, 2))`;

const wouldLeaveTooFew = async (tx: Tx, shopId: string) =>
  (await tx.reviewChip.count({ where: { shopId, isActive: true } })) <= MIN_CHIPS;

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const admin = await requireAdmin();
    const { id: shopId, chipId } = await params;
    if (!isUuid(shopId) || !isUuid(chipId)) return notFoundResponse();

    const body = await readBody(request, UpdateChipSchema);
    if (!body) return badRequest();

    const updated = await prisma.$transaction(async (tx) => {
      await lockShopChips(tx, shopId);
      const chip = await tx.reviewChip.findFirst({
        where: { id: chipId, shopId },
        select: { id: true, label: true, isActive: true },
      });
      if (!chip) return notFoundResponse();
      if (body.isActive === false && chip.isActive && (await wouldLeaveTooFew(tx, shopId))) return tooFewChips();

      if (body.label && body.label.toLowerCase() !== chip.label.toLowerCase()) {
        const duplicate = await tx.reviewChip.findFirst({
          where: { shopId, label: { equals: body.label, mode: "insensitive" }, id: { not: chipId } },
          select: { id: true },
        });
        if (duplicate) return conflict("This chip already exists.");
      }

      return tx.reviewChip.update({
        where: { id: chipId },
        data: body,
        select: { id: true, label: true, sortOrder: true, isActive: true, isPinned: true },
      });
    });
    if (updated instanceof NextResponse) return updated;

    await prisma.auditLog.create({
      data: { userId: admin.id, shopId, action: "chip.update", entityType: "ReviewChip", entityId: chipId, details: body },
    });

    return NextResponse.json({ chip: updated });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const admin = await requireAdmin();
    const { id: shopId, chipId } = await params;
    if (!isUuid(shopId) || !isUuid(chipId)) return notFoundResponse();

    const refused = await prisma.$transaction(async (tx) => {
      await lockShopChips(tx, shopId);
      const chip = await tx.reviewChip.findFirst({
        where: { id: chipId, shopId },
        select: { id: true, isActive: true },
      });
      if (!chip) return notFoundResponse();
      if (chip.isActive && (await wouldLeaveTooFew(tx, shopId))) return tooFewChips();
      await tx.reviewChip.delete({ where: { id: chipId } });
      return null;
    });
    if (refused) return refused;

    await prisma.auditLog.create({
      data: { userId: admin.id, shopId, action: "chip.delete", entityType: "ReviewChip", entityId: chipId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
