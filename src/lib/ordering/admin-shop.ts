import { isUuid } from "@/lib/admin/api";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import type { Actor } from "./manage";

/** adminErrorResponse turns Prisma's P2025 code into a 404. */
class NotFound extends Error {
  code = "P2025";
}

/** The signed-in Semsorted admin and a business that exists. Throws for adminErrorResponse otherwise. */
export async function adminShop(params: Promise<{ shopId: string }>): Promise<{ shopId: string; actor: Actor }> {
  const admin = await requireAdmin();
  const { shopId } = await params;
  if (!isUuid(shopId) || !(await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } }))) throw new NotFound("Not found");
  return { shopId, actor: { adminId: admin.id } };
}
