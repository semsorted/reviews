import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guestStatus } from "@/lib/ordering/guest-view";
import { findOrderingTable } from "@/lib/ordering/service";

const NO_STORE = { "Cache-Control": "no-store" };

/** Guests poll this while they wait. It answers 204 when nothing at the restaurant changed. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findOrderingTable(token);
  if (!found) return NextResponse.json({ error: "This table is not taking orders right now." }, { status: 404, headers: NO_STORE });

  const query = request.nextUrl.searchParams;
  if (query.get("v") === found.settings.version.toString()) return new NextResponse(null, { status: 204, headers: NO_STORE });
  const session = z.uuid().safeParse(query.get("s"));
  return NextResponse.json(await guestStatus(found, session.success ? session.data : undefined), { headers: NO_STORE });
}
