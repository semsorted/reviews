import { NextRequest } from "next/server";
import { updateStaff } from "@/lib/ordering/manage";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff(CAN.manageStaff);
    return await updateStaff(request, staff.shopId, (await params).id, { staffId: staff.staffId, name: staff.name });
  } catch (error) {
    return staffErrorResponse(error, "Staff");
  }
}
