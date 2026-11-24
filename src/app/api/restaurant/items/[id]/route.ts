import { NextRequest } from "next/server";
import { deleteItem, updateItem } from "@/lib/ordering/manage";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    return await updateItem(request, (await requireStaff(CAN.manageMenu)).shopId, (await params).id);
  } catch (error) {
    return staffErrorResponse(error, "Item");
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    return await deleteItem((await requireStaff(CAN.manageMenu)).shopId, (await params).id);
  } catch (error) {
    return staffErrorResponse(error, "Item");
  }
}
