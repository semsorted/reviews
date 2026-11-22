import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, isUuid, notFoundResponse, readBody } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

const UpdateSchema = z.object({
  status: z.enum(["OPEN", "RESOLVED"]),
  ownerNote: z.string().trim().max(1000).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (!isUuid(id)) return notFoundResponse();

    const body = await readBody(request, UpdateSchema);
    if (!body) return badRequest();

    const item = await prisma.reviewFeedback.update({
      where: { id },
      data: {
        status: body.status,
        resolvedAt: body.status === "RESOLVED" ? new Date() : null,
        ...(body.ownerNote !== undefined ? { ownerNote: body.ownerNote || null } : {}),
      },
      select: { id: true, shopId: true, status: true },
    });
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        shopId: item.shopId,
        action: body.status === "RESOLVED" ? "attention.resolve" : "attention.reopen",
        entityType: "ReviewFeedback",
        entityId: item.id,
      },
    });
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
