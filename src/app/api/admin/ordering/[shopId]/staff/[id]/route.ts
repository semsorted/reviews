import { NextRequest } from "next/server";
import { adminErrorResponse } from "@/lib/auth/guard";
import { adminShop } from "@/lib/ordering/admin-shop";
import { updateStaff } from "@/lib/ordering/manage";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ shopId: string; id: string }> }) {
  try {
    const { shopId, actor } = await adminShop(params);
    return await updateStaff(request, shopId, (await params).id, actor);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
