import { NextRequest } from "next/server";
import { adminErrorResponse } from "@/lib/auth/guard";
import { adminShop } from "@/lib/ordering/admin-shop";
import { createStaff } from "@/lib/ordering/manage";

export async function POST(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId, actor } = await adminShop(params);
    return await createStaff(request, shopId, actor);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
