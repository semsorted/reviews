import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSubscribed } from "@/lib/subscription";

export const STAFF_ROLES = ["OWNER", "MANAGER", "KITCHEN", "WAITER"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
export type Staff = { staffId: string; shopId: string; role: StaffRole; name: string; shopName: string };

export const ROLE_LABEL: Record<StaffRole, string> = { OWNER: "Owner", MANAGER: "Manager", KITCHEN: "Kitchen", WAITER: "Waiter" };

/** Who may do what inside a restaurant. Admin (Semsorted) can do everything from /admin. */
export const CAN = {
  seeOrders: ["OWNER", "MANAGER", "KITCHEN", "WAITER"],
  cook: ["OWNER", "MANAGER", "KITCHEN"],
  serve: ["OWNER", "MANAGER", "KITCHEN", "WAITER"],
  cancel: ["OWNER", "MANAGER", "KITCHEN"],
  takeOrder: ["OWNER", "MANAGER", "WAITER"],
  billTable: ["OWNER", "MANAGER", "WAITER"],
  markPaid: ["OWNER", "MANAGER"],
  toggleDish: ["OWNER", "MANAGER", "KITCHEN"],
  manageMenu: ["OWNER", "MANAGER"],
  manageTables: ["OWNER", "MANAGER"],
  seeSales: ["OWNER", "MANAGER"],
  manageStaff: ["OWNER"],
  billSettings: ["OWNER"],
} satisfies Record<string, StaffRole[]>;

export const STAFF_COOKIE = "sem_staff";
const SESSION_DAYS = 30;
export const MAX_TRIES = 5;
export const LOCK_MINUTES = 15;

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
// A real hash of a random secret, so unknown logins take as long as wrong passwords.
const DUMMY_HASH = "scrypt$Oq1d2rmzhPCGPjr+1f2BKA==$kEl5XBxXcxIpYPzaazIuHYL4ZS5hXbA5Gj9o+/rs2ZE=";

export async function hashSecret(secret: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(secret, salt, 32);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifySecret(secret: string, stored: string | null) {
  const [scheme, salt, hash] = (stored ?? DUMMY_HASH).split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scryptAsync(secret, Buffer.from(salt, "base64"), expected.length || 32);
  return stored !== null && expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Staff log in with an email, a 10-digit Indian mobile number, or a username like balaji.kitchen. */
export function normalizeLogin(input: string): string | null {
  const value = input.trim().toLowerCase();
  if (value.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 120 ? value : null;
  const digits = value.replace(/[\s-]/g, "").replace(/^\+?91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  if (/^\+?\d[\d\s-]*$/.test(value)) return /^[6-9]\d{9}$/.test(digits) ? digits : null;
  return /^[a-z][a-z0-9._-]{2,29}$/.test(value) ? value : null;
}

export const passwordProblem = (password: string) =>
  password.length < 8 ? "Use a password of at least 8 characters." : password.length > 72 ? "Use a password of at most 72 characters." : null;

export const sessionIdFor = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a staff session and returns the cookie. The database keeps only its hash. */
export async function startStaffSession(staffId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.staffSession.create({ data: { id: sessionIdFor(token), staffId, expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000) } });
  return { name: STAFF_COOKIE, value: token, options: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: SESSION_DAYS * 86_400 } };
}

/** Is this restaurant allowed to use ordering right now? */
export async function restaurantOpen(shopId: string) {
  const [settings, shop] = await Promise.all([
    prisma.orderingSettings.findUnique({ where: { shopId }, select: { isEnabled: true } }),
    prisma.shop.findUnique({ where: { id: shopId }, select: { name: true, isActive: true, subscriptionEndsAt: true } }),
  ]);
  return settings?.isEnabled && shop?.isActive && isSubscribed(shop.subscriptionEndsAt) ? shop.name : null;
}

/** The signed-in restaurant staff member, or null. Turning an account off signs it out at once. */
export async function getStaff(): Promise<Staff | null> {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const session = await prisma.staffSession.findUnique({
    where: { id: sessionIdFor(token) },
    select: { expiresAt: true, staff: { select: { id: true, shopId: true, role: true, name: true, isActive: true } } },
  });
  if (!session || session.expiresAt <= new Date() || !session.staff.isActive) return null;
  const shopName = await restaurantOpen(session.staff.shopId);
  if (!shopName) return null;
  return { staffId: session.staff.id, shopId: session.staff.shopId, role: session.staff.role as StaffRole, name: session.staff.name, shopName };
}

export class StaffAuthError extends Error {
  constructor(public status: 401 | 403) {
    super(status === 401 ? "Please log in again." : "Your role cannot do this. Ask the owner.");
  }
}

export async function requireStaff(roles: readonly StaffRole[] = STAFF_ROLES): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) throw new StaffAuthError(401);
  if (!roles.includes(staff.role)) throw new StaffAuthError(403);
  return staff;
}

export function staffErrorResponse(error: unknown, label: string) {
  if (error instanceof StaffAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
  const code = (error as { code?: string } | null)?.code;
  if (code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (code === "P2002") return NextResponse.json({ error: "This already exists" }, { status: 409 });
  console.error(`[API:Restaurant:${label}]`, error);
  return NextResponse.json({ error: "That did not save. Try again." }, { status: 503 });
}

type Attempt = { id: string; shop_id: string; password_hash: string; tries: number };

/**
 * Counts the try before checking the password, so parallel guesses cannot get past the limit.
 * The sixth try in a window locks the login for LOCK_MINUTES.
 */
export async function checkStaffLogin(login: string, password: string): Promise<{ staffId: string; shopId: string } | "locked" | null> {
  const [row] = await prisma.$queryRaw<Attempt[]>`
    UPDATE public.restaurant_staff SET failed_tries = failed_tries + 1
    WHERE login = ${login} AND is_active AND (locked_until IS NULL OR locked_until <= now())
    RETURNING id::text, shop_id::text, password_hash, failed_tries AS tries`;
  if (!row) {
    await verifySecret(password, null);
    const locked = await prisma.restaurantStaff.count({ where: { login, isActive: true, lockedUntil: { gt: new Date() } } });
    return locked ? "locked" : null;
  }
  if (row.tries > MAX_TRIES) {
    await prisma.restaurantStaff.update({ where: { id: row.id }, data: { failedTries: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) } });
    return "locked";
  }
  if (!(await verifySecret(password, row.password_hash))) return null;
  await prisma.restaurantStaff.update({ where: { id: row.id }, data: { failedTries: 0, lockedUntil: null, lastLoginAt: new Date() } });
  return { staffId: row.id, shopId: row.shop_id };
}

/** Where each role lands after logging in. */
export const HOME_FOR: Record<StaffRole, string> = { OWNER: "/restaurant/orders", MANAGER: "/restaurant/orders", KITCHEN: "/restaurant/kitchen", WAITER: "/restaurant/tables" };
