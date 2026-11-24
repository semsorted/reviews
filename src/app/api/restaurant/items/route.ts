import { NextRequest } from "next/server";
import { createItem } from "@/lib/ordering/manage";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";

export async function POST(request: NextRequest) {
  try {
    return await createItem(request, (await requireStaff(CAN.manageMenu)).shopId);
  } catch (error) {
    return staffErrorResponse(error, "Item");
  }
}
