import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readBody } from "@/lib/admin/api";
import { checkStaffLogin, HOME_FOR, LOCK_MINUTES, MAX_TRIES, normalizeLogin, restaurantOpen, startStaffSession, type StaffRole } from "@/lib/ordering/staff-auth";
import { prisma } from "@/lib/prisma";

const LoginSchema = z.object({ login: z.string().max(140), password: z.string().min(1).max(200) });

/** One login for every restaurant role. The response says where that role should go. */
export async function POST(request: NextRequest) {
  const body = await readBody(request, LoginSchema);
  const login = body && normalizeLogin(body.login);
  if (!body || !login) return NextResponse.json({ error: "Enter your login and password." }, { status: 400 });
  const result = await checkStaffLogin(login, body.password);
  // Locked and wrong get the same answer, so this page cannot be used to find out which logins exist.
  if (!result || result === "locked") {
    return NextResponse.json({ error: `The login or password is wrong. After ${MAX_TRIES} wrong tries, the account waits ${LOCK_MINUTES} minutes.` }, { status: 401 });
  }
  if (!(await restaurantOpen(result.shopId))) return NextResponse.json({ error: "Ordering is switched off for this restaurant. Please call Semsorted." }, { status: 403 });

  const staff = await prisma.restaurantStaff.findUniqueOrThrow({ where: { id: result.staffId }, select: { role: true } });
  const cookie = await startStaffSession(result.staffId);
  const response = NextResponse.json({ home: HOME_FOR[staff.role as StaffRole] });
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
