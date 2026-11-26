import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => {
  const fn = () => vi.fn();
  const client = {
    shop: { findUnique: fn(), create: fn(), update: fn(), delete: fn() },
    reviewChip: { count: fn(), findFirst: fn(), findMany: fn(), create: fn(), update: fn(), delete: fn() },
    qrCode: { findFirst: fn(), create: fn(), update: fn(), delete: fn() },
    auditLog: { create: fn() },
    $executeRaw: fn(),
    $transaction: vi.fn(),
  };
  return client;
});
const currentUser = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/auth/session", async (original) => ({
  ...(await original<typeof import("@/lib/auth/session")>()),
  getCurrentUser: currentUser,
}));

import * as shops from "@/app/api/admin/shops/route";
import * as shop from "@/app/api/admin/shops/[id]/route";
import * as chips from "@/app/api/admin/shops/[id]/chips/route";
import * as chip from "@/app/api/admin/shops/[id]/chips/[chipId]/route";
import * as qrs from "@/app/api/admin/shops/[id]/qr-codes/route";
import * as qr from "@/app/api/admin/shops/[id]/qr-codes/[qrId]/route";
import * as download from "@/app/api/admin/shops/[id]/qr-codes/[qrId]/download/route";
import { MAX_ACTIVE_CHIPS } from "@/lib/reviews/rules";

const shopId = "11111111-1111-4111-8111-111111111111";
const chipId = "44444444-4444-4444-8444-444444444441";
const chipTwo = "44444444-4444-4444-8444-444444444442";
const qrId = "33333333-3333-4333-8333-333333333333";
const admin = { id: "99999999-9999-4999-8999-999999999999", email: "a@b.co", role: "SUPER_ADMIN", fullName: null, avatarUrl: null };
const owner = { ...admin, role: "SHOP_OWNER" };
const shopParams = { params: Promise.resolve({ id: shopId }) };
const chipParams = { params: Promise.resolve({ id: shopId, chipId }) };
const qrParams = { params: Promise.resolve({ id: shopId, qrId }) };
const req = (method: string, body?: unknown, url = "http://localhost/api/admin") =>
  new NextRequest(url, { method, body: body === undefined ? undefined : JSON.stringify(body) });
const validShop = {
  name: "Sunset Cafe",
  businessCategory: "Cafe",
  googleReviewUrl: "https://g.page/r/sunset/review",
  defaultLanguage: "en",
  chips: ["Taste", "Service"],
};
const notFoundError = Object.assign(new Error("missing"), { code: "P2025" });

type Handler = () => Promise<Response>;
const handlers: [string, Handler][] = [
  ["POST shops", () => shops.POST(req("POST", validShop))],
  ["PATCH shop", () => shop.PATCH(req("PATCH", { name: "New name" }), shopParams)],
  ["DELETE shop", () => shop.DELETE(req("DELETE"), shopParams)],
  ["POST chips", () => chips.POST(req("POST", { label: "Parking" }), shopParams)],
  ["PATCH chips", () => chips.PATCH(req("PATCH", { orderedIds: [chipId, chipTwo] }), shopParams)],
  ["PATCH chip", () => chip.PATCH(req("PATCH", { isActive: false }), chipParams)],
  ["DELETE chip", () => chip.DELETE(req("DELETE"), chipParams)],
  ["POST QR", () => qrs.POST(req("POST", { name: "Counter" }), shopParams)],
  ["PATCH QR", () => qr.PATCH(req("PATCH", { isActive: false }), qrParams)],
  ["DELETE QR", () => qr.DELETE(req("DELETE"), qrParams)],
  ["download QR", () => download.GET(req("GET", undefined, "http://localhost/x?format=png"), qrParams)],
];

function expectNoWrites() {
  for (const model of [db.shop, db.reviewChip, db.qrCode]) {
    for (const method of ["create", "update", "delete"] as const) {
      expect(model[method]).not.toHaveBeenCalled();
    }
  }
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = "https://reviews.example.com";
  currentUser.mockResolvedValue(admin);
  db.$transaction.mockImplementation((work: unknown) => (typeof work === "function" ? work(db) : Promise.all(work as Promise<unknown>[])));
  db.shop.findUnique.mockResolvedValue({ id: shopId });
  db.shop.create.mockResolvedValue({ id: shopId });
  db.reviewChip.count.mockResolvedValue(3);
  db.reviewChip.findFirst.mockResolvedValue(null);
  db.qrCode.create.mockResolvedValue({ id: qrId });
  db.auditLog.create.mockResolvedValue({});
});

describe("admin authorization", () => {
  it.each(handlers)("%s returns 401 anonymously", async (_name, call) => {
    currentUser.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
    expectNoWrites();
  });

  it.each(handlers)("%s returns 403 for a non-admin", async (_name, call) => {
    currentUser.mockResolvedValue(owner);
    expect((await call()).status).toBe(403);
    expectNoWrites();
  });
});

describe("shops", () => {
  it("rejects a non-Google review URL", async () => {
    const response = await shops.POST(req("POST", { ...validShop, googleReviewUrl: "https://evil.com/review" }));
    expect(response.status).toBe(400);
    expect(db.shop.create).not.toHaveBeenCalled();
  });

  it("creates the first QR with one matching token", async () => {
    const response = await shops.POST(req("POST", validShop));
    expect(response.status).toBe(201);
    const { data } = db.shop.create.mock.calls[0][0];
    const created = data.qrCodes.create;
    expect(data.ownerId).toBe(admin.id);
    expect(created.destinationUrl).toBe(`https://reviews.example.com/r/${created.publicToken}`);
    expect(data.chips.create.map((c: { label: string }) => c.label)).toEqual(["Taste", "Service"]);
  });

  it("rejects duplicate starting chips", async () => {
    const response = await shops.POST(req("POST", { ...validShop, chips: ["Taste", " taste "] }));
    expect(response.status).toBe(409);
  });

  it("returns 404 when updating a missing shop", async () => {
    db.shop.update.mockRejectedValue(notFoundError);
    expect((await shop.PATCH(req("PATCH", { name: "New name" }), shopParams)).status).toBe(404);
  });
});

describe("chips", () => {
  it("rejects a case-insensitive duplicate", async () => {
    db.reviewChip.findFirst.mockResolvedValue({ id: chipTwo });
    const response = await chips.POST(req("POST", { label: "TASTE" }), shopParams);
    expect(response.status).toBe(409);
    expect(db.reviewChip.findFirst.mock.calls[0][0].where.label).toEqual({ equals: "TASTE", mode: "insensitive" });
    expect(db.reviewChip.create).not.toHaveBeenCalled();
  });

  it("stops at the active chip limit", async () => {
    db.reviewChip.count.mockResolvedValue(MAX_ACTIVE_CHIPS);
    expect((await chips.POST(req("POST", { label: "Parking" }), shopParams)).status).toBe(409);
  });

  it("refuses to deactivate below two active chips", async () => {
    db.reviewChip.findFirst.mockResolvedValueOnce({ id: chipId, isActive: true, label: "Taste" });
    db.reviewChip.count.mockResolvedValue(2);
    const response = await chip.PATCH(req("PATCH", { isActive: false }), chipParams);
    expect(response.status).toBe(409);
    expect(db.reviewChip.update).not.toHaveBeenCalled();
  });

  it("locks the shop before checking the chip floor", async () => {
    const order: string[] = [];
    db.$executeRaw.mockImplementation(async () => (order.push("lock"), 0));
    db.reviewChip.count.mockImplementation(async () => (order.push("count"), 3));
    db.reviewChip.findFirst.mockResolvedValueOnce({ id: chipId, isActive: true, label: "Taste" });
    db.reviewChip.update.mockImplementation(async () => (order.push("write"), { id: chipId }));
    await chip.PATCH(req("PATCH", { isActive: false }), chipParams);
    expect(order).toEqual(["lock", "count", "write"]);
  });

  it("refuses to delete below two active chips", async () => {
    db.reviewChip.findFirst.mockResolvedValueOnce({ id: chipId, isActive: true, label: "Taste" });
    db.reviewChip.count.mockResolvedValue(2);
    expect((await chip.DELETE(req("DELETE"), chipParams)).status).toBe(409);
    expect(db.reviewChip.delete).not.toHaveBeenCalled();
  });

  it("allows deleting an inactive chip with two active left", async () => {
    db.reviewChip.findFirst.mockResolvedValueOnce({ id: chipId, isActive: false, label: "Old" });
    db.reviewChip.count.mockResolvedValue(2);
    expect((await chip.DELETE(req("DELETE"), chipParams)).status).toBe(200);
    expect(db.reviewChip.delete).toHaveBeenCalledWith({ where: { id: chipId } });
  });

  it("returns 404 for another shop's chip", async () => {
    db.reviewChip.findFirst.mockResolvedValueOnce(null);
    expect((await chip.DELETE(req("DELETE"), chipParams)).status).toBe(404);
    expect(db.reviewChip.findFirst.mock.calls[0][0].where).toEqual({ id: chipId, shopId });
  });

  it("reorders only the shop's complete chip list", async () => {
    db.reviewChip.findMany.mockResolvedValue([{ id: chipId }, { id: chipTwo }]);
    const bad = await chips.PATCH(req("PATCH", { orderedIds: [chipId] }), shopParams);
    expect(bad.status).toBe(400);
    const good = await chips.PATCH(req("PATCH", { orderedIds: [chipTwo, chipId] }), shopParams);
    expect(good.status).toBe(200);
    expect(db.reviewChip.update).toHaveBeenCalledWith({ where: { id: chipTwo }, data: { sortOrder: 0 } });
    expect(db.reviewChip.update).toHaveBeenCalledWith({ where: { id: chipId }, data: { sortOrder: 1 } });
  });
});

describe("QR codes", () => {
  it("creates a QR whose URL uses its token", async () => {
    expect((await qrs.POST(req("POST", { name: "Counter" }), shopParams)).status).toBe(201);
    const { data } = db.qrCode.create.mock.calls[0][0];
    expect(data.destinationUrl).toBe(`https://reviews.example.com/r/${data.publicToken}`);
  });

  it("returns 404 for another shop's QR", async () => {
    db.qrCode.update.mockRejectedValue(notFoundError);
    expect((await qr.PATCH(req("PATCH", { isActive: false }), qrParams)).status).toBe(404);
    expect(db.qrCode.update.mock.calls[0][0].where).toEqual({ id: qrId, shopId });
  });

  it.each([
    ["png", "image/png", "counter-stand-qr.png"],
    ["svg", "image/svg+xml", "counter-stand-qr.svg"],
  ])("downloads %s as an attachment", async (format, type, filename) => {
    db.qrCode.findFirst.mockResolvedValue({ name: "Counter Stand!", publicToken: "abc12345" });
    const response = await download.GET(req("GET", undefined, `http://localhost/x?format=${format}`), qrParams);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(type);
    expect(response.headers.get("content-disposition")).toBe(`attachment; filename="${filename}"`);
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(100);
  });

  it("rejects an unknown download format", async () => {
    db.qrCode.findFirst.mockResolvedValue({ name: "Counter", publicToken: "abc12345" });
    expect((await download.GET(req("GET", undefined, "http://localhost/x?format=gif"), qrParams)).status).toBe(400);
  });
});
