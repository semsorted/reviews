import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, chipLabelSchema, conflict, isUuid, notFoundResponse, readBody } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { MIN_CHIPS } from "@/lib/reviews/rules";

type Context = { params: Promise<{ id: string; chipId: string }> };

const UpdateChipSchema = z
  .object({ label: chipLabelSchema.optional(), isActive: z.boolean().optional() })
  .refine((body) => body.label !== undefined || body.isActive !== undefined);

const tooFewChips = () => conflict(`Keep at least ${MIN_CHIPS} active chips so printed QR codes keep working.`);

// ponytail: count-then-write is safe for one admin; use a serializable transaction if multiple admins are added.
const wouldLeaveTooFew = async (shopId: string) =>
  (await prisma.reviewChip.count({ where: { shopId, isActive: true } })) <= MIN_CHIPS;

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const admin = await requireAdmin();
    const { id: shopId, chipId } = await params;
    if (!isUuid(shopId) || !isUuid(chipId)) return notFoundResponse();

    const body = await readBody(request, UpdateChipSchema);
    if (!body) return badRequest();

    const chip = await prisma.reviewChip.findFirst({
      where: { id: chipId, shopId },
      select: { id: true, label: true, isActive: true },
    });
    if (!chip) return notFoundResponse();

    if (body.isActive === false && chip.isActive && (await wouldLeaveTooFew(shopId))) return tooFewChips();

    if (body.label && body.label.toLowerCase() !== chip.label.toLowerCase()) {
      const duplicate = await prisma.reviewChip.findFirst({
        where: { shopId, label: { equals: body.label, mode: "insensitive" }, id: { not: chipId } },
        select: { id: true },
      });
      if (duplicate) return conflict("This chip already exists.");
    }

    const updated = await prisma.reviewChip.update({
      where: { id: chipId },
      data: body,
      select: { id: true, label: true, sortOrder: true, isActive: true },
    });
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

    const chip = await prisma.reviewChip.findFirst({
      where: { id: chipId, shopId },
      select: { id: true, isActive: true },
    });
    if (!chip) return notFoundResponse();
    if (chip.isActive && (await wouldLeaveTooFew(shopId))) return tooFewChips();

    await prisma.reviewChip.delete({ where: { id: chipId } });
    await prisma.auditLog.create({
      data: { userId: admin.id, shopId, action: "chip.delete", entityType: "ReviewChip", entityId: chipId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
