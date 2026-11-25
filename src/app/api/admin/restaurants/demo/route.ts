import { NextResponse } from "next/server";
import { conflict } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { createDemoRestaurant } from "@/lib/ordering/demo";

/** Adds one sample restaurant. The staff passwords are shown once, here, and never stored in plain text. */
export async function POST() {
  try {
    const admin = await requireAdmin();
    const demo = await createDemoRestaurant(admin.id);
    return demo ? NextResponse.json(demo, { status: 201 }) : conflict("The sample restaurant already exists.");
  } catch (error) {
    return adminErrorResponse(error);
  }
}
