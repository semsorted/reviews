import { NextRequest, NextResponse } from "next/server";
import { badRequest, conflict, hasDuplicateLabels, publicQrUrl, readBody, ShopCreateSchema } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await readBody(request, ShopCreateSchema);
    if (!body) return badRequest();
    if (hasDuplicateLabels(body.chips)) return conflict("Each chip must be different.");

    const { chips, logoUrl, ...details } = body;
    const baseSlug = details.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "shop";
    const publicToken = generateToken(18);

    const shop = await prisma.shop.create({
      data: {
        ...details,
        ownerId: admin.id,
        slug: `${baseSlug}-${generateToken(6).toLowerCase()}`,
        logoUrl: logoUrl || null,
        chips: { create: chips.map((label, sortOrder) => ({ label, sortOrder })) },
        qrCodes: {
          create: { name: "Main QR", publicToken, destinationUrl: publicQrUrl(publicToken) },
        },
        auditLogs: { create: { userId: admin.id, action: "shop.create", entityType: "Shop" } },
      },
      select: { id: true },
    });

    return NextResponse.json({ shop }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
