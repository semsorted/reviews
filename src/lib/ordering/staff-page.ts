import { cache } from "react";
import { redirect } from "next/navigation";
import { publicAppUrl } from "@/lib/admin/api";
import { prisma } from "@/lib/prisma";
import { staffSelect } from "./manage";
import { CAN, getStaff, HOME_FOR, STAFF_ROLES, type Staff, type StaffRole } from "./staff-auth";

// The panel layout and its page both check the session; this reads it once per request.
const staffForRequest = cache(getStaff);

/** For restaurant panel pages: signed out goes to login, the wrong role goes to its own home. */
export async function requireStaffPage(roles: readonly StaffRole[] = STAFF_ROLES): Promise<Staff> {
  const staff = await staffForRequest();
  if (!staff) redirect("/restaurant/login");
  if (!roles.includes(staff.role)) redirect(HOME_FOR[staff.role]);
  return staff;
}

export type Can = Record<keyof typeof CAN, boolean>;

/** Plain booleans a client component can use to show only the buttons this role may press. */
export const canFor = (role: StaffRole) => Object.fromEntries(Object.entries(CAN).map(([action, roles]) => [action, (roles as readonly string[]).includes(role)])) as Can;

// Page loaders shared by the Semsorted admin and the restaurant panel. Every one is scoped to one shop.

export function menuFor(shopId: string) {
  return prisma.menuCategory.findMany({
    where: { shopId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      nameHi: true,
      items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, name: true, nameHi: true, pricePaise: true, isVeg: true, isAvailable: true } },
    },
  });
}

export async function tablesFor(shopId: string) {
  const tables = await prisma.diningTable.findMany({ where: { shopId }, orderBy: { createdAt: "asc" }, select: { id: true, label: true, isActive: true, publicToken: true } });
  return tables.map(({ publicToken, ...table }) => ({ ...table, url: publicAppUrl(`/t/${publicToken}`) }));
}

const loginTime = (date: Date) => date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Staff accounts without password hashes, with dates already turned into text for the screen. */
export async function staffFor(shopId: string) {
  const now = new Date();
  const rows = await prisma.restaurantStaff.findMany({ where: { shopId }, orderBy: [{ isActive: "desc" }, { createdAt: "asc" }], select: staffSelect });
  return rows.map(({ lastLoginAt, lockedUntil, role, ...row }) => ({
    ...row,
    role: role as StaffRole,
    lastLogin: lastLoginAt ? loginTime(lastLoginAt) : null,
    isLocked: Boolean(lockedUntil && lockedUntil > now),
  }));
}
export type StaffAccount = Awaited<ReturnType<typeof staffFor>>[number];
