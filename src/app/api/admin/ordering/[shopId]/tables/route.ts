import { NextRequest } from "next/server";
import { adminErrorResponse } from "@/lib/auth/guard";
import { adminShop } from "@/lib/ordering/admin-shop";
import { addTables } from "@/lib/ordering/manage";

export async function POST(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    return await addTables(request, (await adminShop(params)).shopId);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
