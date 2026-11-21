import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, isUuid, notFoundResponse, publicQrUrl, readBody } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/utils";

const CreateQrSchema = z.object({ name: z.string().trim().min(2).max(60) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id: shopId } = await params;
    if (!isUuid(shopId)) return notFoundResponse();

    const body = await readBody(request, CreateQrSchema);
    if (!body) return badRequest();

    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } });
    if (!shop) return notFoundResponse();

    const publicToken = generateToken(18);
    const qrCode = await prisma.qrCode.create({
      data: { shopId, name: body.name, publicToken, destinationUrl: publicQrUrl(publicToken) },
    });
    await prisma.auditLog.create({
      data: { userId: admin.id, shopId, action: "qr.create", entityType: "QrCode", entityId: qrCode.id },
    });

    return NextResponse.json({ qrCode }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
