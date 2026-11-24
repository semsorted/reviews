import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sessionIdFor, STAFF_COOKIE } from "@/lib/ordering/staff-auth";

export async function POST() {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (token) await prisma.staffSession.deleteMany({ where: { id: sessionIdFor(token) } });
  const response = NextResponse.json({ success: true });
  response.cookies.delete(STAFF_COOKIE);
  return response;
}
