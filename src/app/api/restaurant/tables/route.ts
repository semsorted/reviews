import { NextRequest } from "next/server";
import { addTables } from "@/lib/ordering/manage";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";

export async function POST(request: NextRequest) {
  try {
    return await addTables(request, (await requireStaff(CAN.manageTables)).shopId);
  } catch (error) {
    return staffErrorResponse(error, "Tables");
  }
}
