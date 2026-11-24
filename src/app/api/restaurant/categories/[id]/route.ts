import { NextRequest } from "next/server";
import { deleteCategory, updateCategory } from "@/lib/ordering/manage";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    return await updateCategory(request, (await requireStaff(CAN.manageMenu)).shopId, (await params).id);
  } catch (error) {
    return staffErrorResponse(error, "Category");
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    return await deleteCategory((await requireStaff(CAN.manageMenu)).shopId, (await params).id);
  } catch (error) {
    return staffErrorResponse(error, "Category");
  }
}
