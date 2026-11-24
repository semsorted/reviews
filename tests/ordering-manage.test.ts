import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const shopId = "11111111-1111-4111-8111-111111111111";
const ownerId = "22222222-2222-4222-8222-222222222221";
const cookId = "22222222-2222-4222-8222-222222222222";

const m = vi.hoisted(() => ({
  staffFindFirst: vi.fn(),
  staffFindUnique: vi.fn(),
  staffCount: vi.fn(),
  staffUpdate: vi.fn(),
  staffCreate: vi.fn(),
  sessionsDelete: vi.fn(),
  audit: vi.fn(),
  lock: vi.fn(),
  settingsFind: vi.fn(),
  settingsUpsert: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const tx = {
    $executeRaw: m.lock,
    restaurantStaff: { findFirst: m.staffFindFirst, count: m.staffCount, update: m.staffUpdate, create: m.staffCreate },
    staffSession: { deleteMany: m.sessionsDelete },
    auditLog: { create: m.audit },
    orderingSettings: { upsert: m.settingsUpsert },
  };
  return {
    prisma: {
      restaurantStaff: { findUnique: m.staffFindUnique },
      orderingSettings: { findUnique: m.settingsFind },
      $transaction: (work: (client: typeof tx) => unknown) => work(tx),
    },
  };
});

import { createStaff, saveSettings, updateStaff } from "@/lib/ordering/manage";

const req = (body: unknown) => new NextRequest("http://localhost/x", { method: "POST", body: JSON.stringify(body) });
const owner = { staffId: ownerId, name: "Mohan" };

beforeEach(() => {
  vi.clearAllMocks();
  m.staffFindFirst.mockResolvedValue({ role: "OWNER", isActive: true });
  m.staffCount.mockResolvedValue(0);
  m.staffFindUnique.mockResolvedValue(null);
  m.staffCreate.mockImplementation(async ({ data }) => ({ id: cookId, name: data.name, login: data.login, role: data.role, isActive: true }));
  m.settingsFind.mockResolvedValue({ gstin: null, gstRateBp: 0 });
  m.settingsUpsert.mockResolvedValue({});
});

describe("restaurant staff accounts", () => {
  it("creates a login with a hashed password and no password in the audit log", async () => {
    const res = await createStaff(req({ name: "Ramu", role: "KITCHEN", login: "Balaji.Kitchen", password: "kitchen-123" }), shopId, owner);
    expect(res.status).toBe(201);
    const data = m.staffCreate.mock.calls[0][0].data;
    expect(data).toMatchObject({ shopId, name: "Ramu", role: "KITCHEN", login: "balaji.kitchen" });
    expect(data.passwordHash).toMatch(/^scrypt\$/);
    expect(JSON.stringify(m.audit.mock.calls)).not.toContain("kitchen-123");
  });

  it("refuses a login someone else already uses", async () => {
    m.staffFindUnique.mockResolvedValue({ id: "x" });
    expect((await createStaff(req({ name: "Ramu", role: "KITCHEN", login: "9829012345", password: "kitchen-123" }), shopId, owner)).status).toBe(409);
  });

  it("keeps at least one active owner", async () => {
    const res = await updateStaff(req({ isActive: false }), shopId, "33333333-3333-4333-8333-333333333333", { adminId: "admin" });
    expect(res.status).toBe(400);
    expect(m.staffUpdate).not.toHaveBeenCalled();
  });

  it("lets an owner be turned off when another owner remains, and signs them out", async () => {
    m.staffCount.mockResolvedValue(1);
    expect((await updateStaff(req({ isActive: false }), shopId, "33333333-3333-4333-8333-333333333333", { adminId: "admin" })).status).toBe(200);
    expect(m.sessionsDelete).toHaveBeenCalledWith({ where: { staffId: "33333333-3333-4333-8333-333333333333" } });
  });

  it("stops people from turning off or demoting themselves", async () => {
    expect((await updateStaff(req({ isActive: false }), shopId, ownerId, owner)).status).toBe(400);
    expect((await updateStaff(req({ role: "WAITER" }), shopId, ownerId, owner)).status).toBe(400);
    expect(m.staffUpdate).not.toHaveBeenCalled();
  });

  it("only touches staff of the given restaurant", async () => {
    m.staffFindFirst.mockResolvedValue(null);
    expect((await updateStaff(req({ name: "X" }), shopId, cookId, owner)).status).toBe(404);
    expect(m.staffFindFirst.mock.calls[0][0].where).toEqual({ id: cookId, shopId });
  });

  it("signs a person out when their password is reset", async () => {
    m.staffFindFirst.mockResolvedValue({ role: "KITCHEN", isActive: true });
    expect((await updateStaff(req({ password: "new-pass-99" }), shopId, cookId, owner)).status).toBe(200);
    expect(m.staffUpdate.mock.calls[0][0].data.passwordHash).toMatch(/^scrypt\$/);
    expect(m.sessionsDelete).toHaveBeenCalled();
  });
});

describe("restaurant bill settings", () => {
  it("does not let restaurant staff turn ordering on or off", async () => {
    expect((await saveSettings(req({ isEnabled: false }), shopId, owner)).status).toBe(403);
    expect(m.settingsUpsert).not.toHaveBeenCalled();
  });

  it("needs a GSTIN before GST", async () => {
    expect((await saveSettings(req({ gstRateBp: 500 }), shopId, owner)).status).toBe(400);
    expect((await saveSettings(req({ gstRateBp: 500, gstin: "08abcde1234f1z5" }), shopId, owner)).status).toBe(200);
    expect(m.settingsUpsert.mock.calls[0][0].update).toMatchObject({ gstin: "08ABCDE1234F1Z5", gstRateBp: 500 });
  });
});
