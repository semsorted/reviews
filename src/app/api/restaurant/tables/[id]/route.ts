import { NextRequest } from "next/server";
import { updateTable } from "@/lib/ordering/manage";
import { CAN, requireStaff, staffErrorResponse } from "@/lib/ordering/staff-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await updateTable(request, (await requireStaff(CAN.manageTables)).shopId, (await params).id);
  } catch (error) {
    return staffErrorResponse(error, "Table");
  }
}
