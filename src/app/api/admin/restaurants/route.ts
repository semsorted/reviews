import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { conflict, publicQrUrl, readBody } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { hashSecret, normalizeLogin, passwordProblem } from "@/lib/ordering/staff-auth";
import { prisma } from "@/lib/prisma";
import { chipsForShopType } from "@/lib/reviews/catalog";
import { isAllowedGoogleReviewUrl, MAX_ACTIVE_CHIPS } from "@/lib/reviews/rules";
import { generateToken } from "@/lib/utils";

const RestaurantSchema = z.object({
  name: z.string().trim().min(2).max(80),
  businessCategory: z.string().trim().min(2).max(60),
  googleReviewUrl: z.string().trim().refine(isAllowedGoogleReviewUrl),
  ownerName: z.string().trim().min(1).max(60),
  ownerLogin: z.string().max(140),
  ownerPassword: z.string().max(200),
});

/**
 * Adds a restaurant in one step: the business (with its Google review QR and chips),
 * ordering switched on, and the owner's login.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await readBody(request, RestaurantSchema);
    if (!body) return NextResponse.json({ error: "Fill in the restaurant name, type, Google review link and the owner's details." }, { status: 400 });
    const login = normalizeLogin(body.ownerLogin);
    if (!login) return NextResponse.json({ error: "The owner login must be an email, a 10-digit mobile number, or a username like balaji.owner." }, { status: 400 });
    const problem = passwordProblem(body.ownerPassword);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    if (await prisma.restaurantStaff.findUnique({ where: { login }, select: { id: true } })) return conflict("This owner login is already taken. Try another one.");

    const passwordHash = await hashSecret(body.ownerPassword);
    const baseSlug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "restaurant";
    const publicToken = generateToken(18);
    const shop = await prisma.$transaction(async (tx) => {
      const created = await tx.shop.create({
        data: {
          name: body.name,
          businessCategory: body.businessCategory,
          googleReviewUrl: body.googleReviewUrl,
          ownerId: admin.id,
          slug: `${baseSlug}-${generateToken(6).toLowerCase()}`,
          chips: { create: chipsForShopType(body.businessCategory).slice(0, MAX_ACTIVE_CHIPS).map((label, sortOrder) => ({ label, sortOrder })) },
          qrCodes: { create: { name: "Main QR", publicToken, destinationUrl: publicQrUrl(publicToken) } },
        },
        select: { id: true },
      });
      await tx.orderingSettings.create({ data: { shopId: created.id, isEnabled: true } });
      await tx.restaurantStaff.create({ data: { shopId: created.id, name: body.ownerName, role: "OWNER", login, passwordHash } });
      await tx.auditLog.create({ data: { userId: admin.id, shopId: created.id, action: "restaurant.create", entityType: "Shop", entityId: created.id, details: { ownerLogin: login } } });
      return created;
    });
    return NextResponse.json({ shop }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
