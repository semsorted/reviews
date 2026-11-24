import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { conflict, isUuid, notFoundResponse, readBody } from "@/lib/admin/api";
import { prisma } from "@/lib/prisma";
import { upiPayee } from "@/lib/qr/upi";
import { generateToken } from "@/lib/utils";
import { rupeesToPaise } from "./bill";
import { hashSecret, normalizeLogin, passwordProblem, STAFF_ROLES } from "./staff-auth";
import type { Prisma } from "@prisma/client";

/**
 * Menu, tables, staff and bill settings, shared by the Semsorted admin and the restaurant's own panel.
 * Callers check who is signed in; these functions only ever touch rows of the shopId they are given.
 */
export type Actor = { adminId: string } | { staffId: string; name: string };

const invalid = (error = "Please check the details and try again.") => NextResponse.json({ error }, { status: 400 });
const nameText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).transform((text) => text || null);
const priceText = z.string().transform((text, ctx) => {
  const paise = rupeesToPaise(text);
  if (paise === null) ctx.addIssue({ code: "custom", message: "Enter a price like 120 or 45.50." });
  return paise ?? 0;
});
const blankToNull = (text: string) => text.trim() || null;
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const MAX_TABLES = 200;

/** Menu and table edits show up on open screens. */
const touch = (tx: Prisma.TransactionClient, shopId: string) => tx.orderingSettings.updateMany({ where: { shopId }, data: { version: { increment: 1 } } });

function audit(tx: Prisma.TransactionClient, actor: Actor, shopId: string, action: string, entityType: string, entityId: string, details: Prisma.InputJsonValue = {}) {
  const by = "adminId" in actor ? { userId: actor.adminId } : { userId: null };
  const who = "staffId" in actor ? { staffId: actor.staffId, staffName: actor.name } : {};
  return tx.auditLog.create({ data: { ...by, shopId, action, entityType, entityId, details: { ...(details as object), ...who } } });
}

// ---------- Bill settings ----------

const SettingsSchema = z
  .object({
    isEnabled: z.boolean(),
    gstin: z.string().max(20).transform((text) => blankToNull(text)?.toUpperCase() ?? null),
    gstRateBp: z.union([z.literal(0), z.literal(500), z.literal(1800)]),
    fssai: z.string().max(20).transform(blankToNull),
    upiUrl: z.string().max(500).transform(blankToNull),
  })
  .partial();

/** Restaurants can change their bill details. Only Semsorted turns ordering on or off. */
export async function saveSettings(request: NextRequest, shopId: string, actor: Actor) {
  const body = await readBody(request, SettingsSchema);
  if (!body) return invalid();
  if ("staffId" in actor && body.isEnabled !== undefined) return NextResponse.json({ error: "Only Semsorted can turn ordering on or off." }, { status: 403 });
  if (body.gstin && !GSTIN.test(body.gstin)) return invalid("Enter the 15-character GSTIN, like 08ABCDE1234F1Z5.");
  if (body.fssai && !/^\d{14}$/.test(body.fssai)) return invalid("The FSSAI number has 14 digits.");
  if (body.upiUrl && upiPayee(body.upiUrl) === null) return invalid("Paste a UPI link that starts with upi://pay?pa=");

  const current = await prisma.orderingSettings.findUnique({ where: { shopId }, select: { gstin: true, gstRateBp: true } });
  if (!current && "staffId" in actor) return notFoundResponse();
  const gstin = body.gstin !== undefined ? body.gstin : (current?.gstin ?? null);
  if ((body.gstRateBp ?? current?.gstRateBp ?? 0) > 0 && !gstin) return invalid("Add the GSTIN before charging GST.");

  const saved = await prisma.$transaction(async (tx) => {
    const settings = await tx.orderingSettings.upsert({
      where: { shopId },
      create: { shopId, ...body },
      update: { ...body, version: { increment: 1 } },
      select: { isEnabled: true, gstin: true, gstRateBp: true, fssai: true, upiUrl: true },
    });
    await audit(tx, actor, shopId, "ordering.settings", "OrderingSettings", shopId, body);
    return settings;
  });
  return NextResponse.json(saved);
}

// ---------- Menu ----------

const CategorySchema = z.object({ name: nameText(60), nameHi: optionalText(60).optional() });
const CategoryUpdateSchema = z.object({ name: nameText(60), nameHi: optionalText(60), sortOrder: z.number().int().min(0).max(999) }).partial();
const ItemSchema = z.object({ categoryId: z.uuid(), name: nameText(80), nameHi: optionalText(80).optional(), price: priceText, isVeg: z.boolean() });
const ItemUpdateSchema = z
  .object({ categoryId: z.uuid(), name: nameText(80), nameHi: optionalText(80), price: priceText, isVeg: z.boolean(), isAvailable: z.boolean(), sortOrder: z.number().int().min(0).max(999) })
  .partial();

export async function createCategory(request: NextRequest, shopId: string) {
  const body = await readBody(request, CategorySchema);
  if (!body) return invalid("Give the section a name, like Starters.");
  const category = await prisma.$transaction(async (tx) => {
    const last = await tx.menuCategory.aggregate({ where: { shopId }, _max: { sortOrder: true } });
    const created = await tx.menuCategory.create({ data: { shopId, name: body.name, nameHi: body.nameHi ?? null, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
    await touch(tx, shopId);
    return created;
  });
  return NextResponse.json({ category }, { status: 201 });
}

export async function updateCategory(request: NextRequest, shopId: string, id: string) {
  if (!isUuid(id)) return notFoundResponse();
  const body = await readBody(request, CategoryUpdateSchema);
  if (!body) return invalid();
  const count = await prisma.$transaction(async (tx) => {
    const { count } = await tx.menuCategory.updateMany({ where: { id, shopId }, data: body });
    await touch(tx, shopId);
    return count;
  });
  return count ? NextResponse.json({ success: true }) : notFoundResponse();
}

/** Deleting a section deletes its dishes. Old bills keep their own copy of every dish. */
export async function deleteCategory(shopId: string, id: string) {
  if (!isUuid(id)) return notFoundResponse();
  const count = await prisma.$transaction(async (tx) => {
    const { count } = await tx.menuCategory.deleteMany({ where: { id, shopId } });
    await touch(tx, shopId);
    return count;
  });
  return count ? NextResponse.json({ success: true }) : notFoundResponse();
}

export async function createItem(request: NextRequest, shopId: string) {
  const body = await readBody(request, ItemSchema);
  if (!body) return invalid("Add a dish name and a price like 120 or 45.50.");
  const item = await prisma.$transaction(async (tx) => {
    const category = await tx.menuCategory.findFirst({ where: { id: body.categoryId, shopId }, select: { id: true } });
    if (!category) return null;
    const last = await tx.menuItem.aggregate({ where: { categoryId: category.id }, _max: { sortOrder: true } });
    const created = await tx.menuItem.create({
      data: { shopId, categoryId: category.id, name: body.name, nameHi: body.nameHi ?? null, pricePaise: body.price, isVeg: body.isVeg, sortOrder: (last._max.sortOrder ?? -1) + 1 },
    });
    await touch(tx, shopId);
    return created;
  });
  return item ? NextResponse.json({ item }, { status: 201 }) : invalid("Pick a menu section first.");
}

export async function updateItem(request: NextRequest, shopId: string, id: string) {
  if (!isUuid(id)) return notFoundResponse();
  const body = await readBody(request, ItemUpdateSchema);
  if (!body) return invalid("Check the dish name and price.");
  const { price, ...rest } = body;
  const result = await prisma.$transaction(async (tx) => {
    if (rest.categoryId && !(await tx.menuCategory.findFirst({ where: { id: rest.categoryId, shopId }, select: { id: true } }))) return "badCategory";
    const { count } = await tx.menuItem.updateMany({ where: { id, shopId }, data: { ...rest, ...(price !== undefined && { pricePaise: price }) } });
    await touch(tx, shopId);
    return count ? "ok" : "missing";
  });
  if (result === "badCategory") return invalid("Pick a menu section from this restaurant.");
  return result === "ok" ? NextResponse.json({ success: true }) : notFoundResponse();
}

export async function deleteItem(shopId: string, id: string) {
  if (!isUuid(id)) return notFoundResponse();
  const count = await prisma.$transaction(async (tx) => {
    const { count } = await tx.menuItem.deleteMany({ where: { id, shopId } });
    await touch(tx, shopId);
    return count;
  });
  return count ? NextResponse.json({ success: true }) : notFoundResponse();
}

// ---------- Tables ----------

const AddTablesSchema = z.object({ count: z.number().int().min(1).max(50) });
const TableUpdateSchema = z.object({ label: nameText(20), isActive: z.boolean(), newQr: z.literal(true) }).partial();

/** Adds tables named T1, T2... after the highest number already used. Each gets its own QR token. */
export async function addTables(request: NextRequest, shopId: string) {
  const body = await readBody(request, AddTablesSchema);
  if (!body) return invalid("Add between 1 and 50 tables at a time.");
  const created = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${shopId}::text, 3))`;
    const existing = await tx.diningTable.findMany({ where: { shopId }, select: { label: true } });
    if (existing.length + body.count > MAX_TABLES) return null;
    const highest = Math.max(0, ...existing.map((table) => Number(/^T(\d+)$/.exec(table.label)?.[1] ?? 0)));
    const data = Array.from({ length: body.count }, (_, index) => ({ shopId, label: `T${highest + index + 1}`, publicToken: generateToken(24) }));
    await tx.diningTable.createMany({ data });
    await touch(tx, shopId);
    return data.length;
  });
  return created === null ? invalid(`A restaurant can have up to ${MAX_TABLES} tables.`) : NextResponse.json({ created }, { status: 201 });
}

/** Tables are never deleted, so their old bills stay. Pause one instead, or give it a new QR if the old one leaked. */
export async function updateTable(request: NextRequest, shopId: string, id: string) {
  if (!isUuid(id)) return notFoundResponse();
  const body = await readBody(request, TableUpdateSchema);
  if (!body) return invalid("Use a table name of up to 20 characters.");
  const { newQr, ...rest } = body;
  const count = await prisma.$transaction(async (tx) => {
    const { count } = await tx.diningTable.updateMany({ where: { id, shopId }, data: { ...rest, ...(newQr && { publicToken: generateToken(24) }) } });
    await touch(tx, shopId);
    return count;
  });
  return count ? NextResponse.json({ success: true }) : notFoundResponse();
}

// ---------- Staff ----------

const roleSchema = z.enum(STAFF_ROLES);
const StaffCreateSchema = z.object({ name: nameText(60), role: roleSchema, login: z.string().max(140), password: z.string().max(200) });
const StaffUpdateSchema = z.object({ name: nameText(60), role: roleSchema, isActive: z.boolean(), password: z.string().max(200) }).partial();

export const staffSelect = { id: true, name: true, login: true, role: true, isActive: true, lastLoginAt: true, lockedUntil: true } satisfies Prisma.RestaurantStaffSelect;

export async function createStaff(request: NextRequest, shopId: string, actor: Actor) {
  const body = await readBody(request, StaffCreateSchema);
  if (!body) return invalid("Add a name, a role, a login and a password.");
  const login = normalizeLogin(body.login);
  if (!login) return invalid("Use an email, a 10-digit mobile number, or a username like balaji.kitchen.");
  const problem = passwordProblem(body.password);
  if (problem) return invalid(problem);
  if (await prisma.restaurantStaff.findUnique({ where: { login }, select: { id: true } })) return conflict("This login is already taken. Try another one.");

  const passwordHash = await hashSecret(body.password);
  const staff = await prisma.$transaction(async (tx) => {
    const created = await tx.restaurantStaff.create({ data: { shopId, name: body.name, role: body.role, login, passwordHash }, select: staffSelect });
    await audit(tx, actor, shopId, "restaurant.staff_create", "RestaurantStaff", created.id, { role: body.role, login });
    return created;
  });
  return NextResponse.json({ staff }, { status: 201 });
}

/** A restaurant must always keep one active owner, and nobody can lock themselves out by mistake. */
export async function updateStaff(request: NextRequest, shopId: string, id: string, actor: Actor) {
  if (!isUuid(id)) return notFoundResponse();
  const body = await readBody(request, StaffUpdateSchema);
  if (!body) return invalid();
  const problem = body.password !== undefined ? passwordProblem(body.password) : null;
  if (problem) return invalid(problem);
  const isSelf = "staffId" in actor && actor.staffId === id;
  if (isSelf && (body.isActive === false || (body.role && body.role !== "OWNER"))) return invalid("You cannot turn off or change your own account. Ask Semsorted.");

  const { password, ...rest } = body;
  const passwordHash = password !== undefined ? await hashSecret(password) : undefined;
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${shopId}::text, 4))`;
    const current = await tx.restaurantStaff.findFirst({ where: { id, shopId }, select: { role: true, isActive: true } });
    if (!current) return "missing";
    const losesOwner = current.role === "OWNER" && current.isActive && (rest.isActive === false || (rest.role && rest.role !== "OWNER"));
    if (losesOwner && (await tx.restaurantStaff.count({ where: { shopId, role: "OWNER", isActive: true, NOT: { id } } })) === 0) return "lastOwner";
    await tx.restaurantStaff.update({ where: { id }, data: { ...rest, ...(passwordHash && { passwordHash, failedTries: 0, lockedUntil: null }) } });
    // A new password or a turned-off account signs that person out everywhere.
    if (passwordHash || rest.isActive === false || rest.role) await tx.staffSession.deleteMany({ where: { staffId: id } });
    await audit(tx, actor, shopId, "restaurant.staff_update", "RestaurantStaff", id, { ...rest, passwordChanged: Boolean(passwordHash) });
    return "ok";
  });
  if (result === "missing") return notFoundResponse();
  if (result === "lastOwner") return invalid("Keep at least one active owner. Add another owner first.");
  return NextResponse.json({ success: true });
}
