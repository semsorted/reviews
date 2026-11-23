import { NextRequest, NextResponse } from "next/server";
import { badRequest, isUuid, notFoundResponse, readBody, ShopUpdateSchema } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (!isUuid(id)) return notFoundResponse();

    const body = await readBody(request, ShopUpdateSchema);
    if (!body) return badRequest();

    const shop = await prisma.shop.update({
      where: { id },
      data: {
        ...body,
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl || null } : {}),
        ...(body.websiteUrl !== undefined ? { websiteUrl: body.websiteUrl || null } : {}),
        auditLogs: {
          create: { userId: admin.id, action: "shop.update", entityType: "Shop", entityId: id, details: { ...body, ...(body.logoUrl?.startsWith("data:") ? { logoUrl: "uploaded image" } : {}) } },
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ shop });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (!isUuid(id)) return notFoundResponse();

    await prisma.$transaction([
      prisma.shop.delete({ where: { id } }),
      prisma.auditLog.create({
        data: { userId: admin.id, action: "shop.delete", entityType: "Shop", entityId: id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
