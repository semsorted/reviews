import { NextRequest } from "next/server";
import { createCategory } from "@/lib/ordering/manage";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";

export async function POST(request: NextRequest) {
  try {
    return await createCategory(request, (await requireStaff(CAN.manageMenu)).shopId);
  } catch (error) {
    return staffErrorResponse(error, "Category");
  }
}
