import { NextRequest } from "next/server";
import { adminErrorResponse } from "@/lib/auth/guard";
import { adminShop } from "@/lib/ordering/admin-shop";
import { saveSettings } from "@/lib/ordering/manage";

/** Turns ordering on or off for a restaurant and saves its bill details. The first save sets the restaurant up. */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId, actor } = await adminShop(params);
    return await saveSettings(request, shopId, actor);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
