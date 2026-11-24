import { NextRequest } from "next/server";
import { createStaff } from "@/lib/ordering/manage";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaff(CAN.manageStaff);
    return await createStaff(request, staff.shopId, { staffId: staff.staffId, name: staff.name });
  } catch (error) {
    return staffErrorResponse(error, "Staff");
  }
}
