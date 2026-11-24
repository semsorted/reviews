import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readBody } from "@/lib/admin/api";
import { OrderLinesSchema, placeOrder } from "@/lib/ordering/place-order";
import { findOrderingTable } from "@/lib/ordering/service";

const GuestOrderSchema = OrderLinesSchema.extend({ token: z.string().min(16).max(64) });

/** A guest orders from the table QR. */
export async function POST(request: NextRequest) {
  const body = await readBody(request, GuestOrderSchema);
  if (!body) return NextResponse.json({ error: "Please check your order and try again." }, { status: 400 });
  const found = await findOrderingTable(body.token);
  if (!found) return NextResponse.json({ error: "This table is not taking orders right now. Please ask the staff." }, { status: 404 });
  const result = await placeOrder(found.table, body);
  return NextResponse.json(result.body, { status: result.status });
}
