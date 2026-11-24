import { NextRequest } from "next/server";
import { adminErrorResponse } from "@/lib/auth/guard";
import { adminShop } from "@/lib/ordering/admin-shop";
import { deleteCategory, updateCategory } from "@/lib/ordering/manage";

type Context = { params: Promise<{ shopId: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    return await updateCategory(request, (await adminShop(params)).shopId, (await params).id);
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    return await deleteCategory((await adminShop(params)).shopId, (await params).id);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
