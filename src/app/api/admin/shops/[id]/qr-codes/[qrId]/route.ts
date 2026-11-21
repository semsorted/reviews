import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, isUuid, notFoundResponse, readBody } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string; qrId: string }> };

const UpdateQrSchema = z
  .object({ name: z.string().trim().min(2).max(60).optional(), isActive: z.boolean().optional() })
  .refine((body) => body.name !== undefined || body.isActive !== undefined);

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const admin = await requireAdmin();
    const { id: shopId, qrId } = await params;
    if (!isUuid(shopId) || !isUuid(qrId)) return notFoundResponse();

    const body = await readBody(request, UpdateQrSchema);
    if (!body) return badRequest();

    const qrCode = await prisma.qrCode.update({ where: { id: qrId, shopId }, data: body });
    await prisma.auditLog.create({
      data: { userId: admin.id, shopId, action: "qr.update", entityType: "QrCode", entityId: qrId, details: body },
    });

    return NextResponse.json({ qrCode });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const admin = await requireAdmin();
    const { id: shopId, qrId } = await params;
    if (!isUuid(shopId) || !isUuid(qrId)) return notFoundResponse();

    await prisma.qrCode.delete({ where: { id: qrId, shopId } });
    await prisma.auditLog.create({
      data: { userId: admin.id, shopId, action: "qr.delete", entityType: "QrCode", entityId: qrId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
