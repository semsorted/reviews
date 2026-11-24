import { NextRequest } from "next/server";
import { saveSettings } from "@/lib/ordering/manage";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";

export async function PUT(request: NextRequest) {
  try {
    const staff = await requireStaff(CAN.billSettings);
    return await saveSettings(request, staff.shopId, { staffId: staff.staffId, name: staff.name });
  } catch (error) {
    return staffErrorResponse(error, "Settings");
  }
}
