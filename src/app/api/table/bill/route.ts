import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readBody } from "@/lib/admin/api";
import { findOrderingTable, lockOpenTab, requestBill } from "@/lib/ordering/service";
import { prisma } from "@/lib/prisma";

const BillSchema = z.object({ token: z.string().min(16).max(64), sessionId: z.uuid() });

export async function POST(request: NextRequest) {
  const body = await readBody(request, BillSchema);
  if (!body) return NextResponse.json({ error: "Please try again." }, { status: 400 });
  const found = await findOrderingTable(body.token);
  if (!found) return NextResponse.json({ error: "This table is not taking orders right now." }, { status: 404 });

  try {
    const ok = await prisma.$transaction(async (tx) => {
      const tab = await lockOpenTab(tx, { id: body.sessionId, tableId: found.table.id, shopId: found.table.shopId });
      return tab ? requestBill(tx, tab.id, found.table.shopId) : false;
    });
    return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: "There is nothing to bill on this table yet." }, { status: 409 });
  } catch (error) {
    console.error("[API:Table:Bill]", error);
    return NextResponse.json({ error: "The bill did not open. Please try again." }, { status: 503 });
  }
}
