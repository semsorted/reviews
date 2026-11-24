import { NextRequest } from "next/server";
import { adminErrorResponse } from "@/lib/auth/guard";
import { adminShop } from "@/lib/ordering/admin-shop";
import { updateTable } from "@/lib/ordering/manage";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ shopId: string; id: string }> }) {
  try {
    return await updateTable(request, (await adminShop(params)).shopId, (await params).id);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
