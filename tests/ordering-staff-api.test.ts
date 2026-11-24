import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const shopId = "11111111-1111-4111-8111-111111111111";
const orderId = "66666666-6666-4666-8666-666666666666";
const sessionId = "33333333-3333-4333-8333-333333333333";

const m = vi.hoisted(() => ({
  staff: { staffId: "77777777-7777-4777-8777-777777777777", shopId: "11111111-1111-4111-8111-111111111111", role: "KITCHEN", name: "Ramu", shopName: "Balaji Dhaba" } as { staffId: string; shopId: string; role: string; name: string; shopName: string } | null,
  orderFind: vi.fn(),
  orderUpdate: vi.fn(),
  sessionFind: vi.fn(),
  sessionUpdate: vi.fn(),
  bump: vi.fn(),
  lock: vi.fn(),
  orderCount: vi.fn(),
  freeze: vi.fn(),
}));

vi.mock("@/lib/ordering/staff-auth", async (original) => {
  const real = await original<typeof import("@/lib/ordering/staff-auth")>();
  return {
    ...real,
    requireStaff: async (roles: readonly string[] = real.STAFF_ROLES) => {
      if (!m.staff) throw new real.StaffAuthError(401);
      if (!roles.includes(m.staff.role)) throw new real.StaffAuthError(403);
      return m.staff;
    },
  };
});
vi.mock("@/lib/ordering/service", async (original) => ({
  ...(await original<typeof import("@/lib/ordering/service")>()),
  freezeBill: m.freeze,
}));
vi.mock("@/lib/prisma", () => {
  const tx = {
    $executeRaw: m.lock,
    order: { findFirst: m.orderFind, updateMany: m.orderUpdate, count: m.orderCount },
    tableSession: { findFirst: m.sessionFind, update: m.sessionUpdate },
    orderingSettings: { update: m.bump },
  };
  return { prisma: { $transaction: (work: (client: typeof tx) => unknown) => work(tx) } };
});

import { PATCH as moveOrder } from "@/app/api/staff/orders/[id]/route";
import { PATCH as markPaid } from "@/app/api/staff/sessions/[id]/route";

const call = (handler: typeof moveOrder, id: string, body: unknown) =>
  handler(new NextRequest("http://localhost/api/staff", { method: "PATCH", body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  m.staff = { staffId: "77777777-7777-4777-8777-777777777777", shopId, role: "KITCHEN", name: "Ramu", shopName: "Balaji Dhaba" };
  m.orderFind.mockResolvedValue({ status: "RECEIVED", session: { id: sessionId, tableId: "88888888-8888-4888-8888-888888888888", status: "OPEN" } });
  m.orderCount.mockResolvedValue(2);
  m.orderUpdate.mockResolvedValue({ count: 1 });
  m.sessionFind.mockResolvedValue({ id: sessionId, tableId: "88888888-8888-4888-8888-888888888888", status: "OPEN" });
});

describe("restaurant staff API", () => {
  it("lets the kitchen move an order forward, only inside its own restaurant", async () => {
    expect((await call(moveOrder, orderId, { status: "PREPARING" })).status).toBe(200);
    expect(m.orderFind.mock.calls[0][0].where).toEqual({ id: orderId, shopId });
    expect(m.orderUpdate.mock.calls[0][0].where).toEqual({ id: orderId, shopId, status: "RECEIVED" });
    expect(m.bump).toHaveBeenCalled();
  });

  it("hides orders from other restaurants", async () => {
    m.orderFind.mockResolvedValue(null);
    expect((await call(moveOrder, orderId, { status: "SERVED" })).status).toBe(404);
  });

  it("never moves an order backwards or after someone else moved it", async () => {
    m.orderFind.mockResolvedValue({ status: "SERVED", session: { id: sessionId, tableId: "88888888-8888-4888-8888-888888888888", status: "OPEN" } });
    expect((await call(moveOrder, orderId, { status: "PREPARING" })).status).toBe(409);
    m.orderFind.mockResolvedValue({ status: "RECEIVED", session: { id: sessionId, tableId: "88888888-8888-4888-8888-888888888888", status: "OPEN" } });
    m.orderUpdate.mockResolvedValue({ count: 0 });
    expect((await call(moveOrder, orderId, { status: "SERVED" })).status).toBe(409);
    expect(m.bump).not.toHaveBeenCalled();
  });

  it("does not let the kitchen mark a bill paid", async () => {
    expect((await call(markPaid, sessionId, { action: "paid", method: "CASH" })).status).toBe(403);
    expect(m.sessionUpdate).not.toHaveBeenCalled();
  });

  it("lets the owner mark a bill paid", async () => {
    m.staff = { staffId: "77777777-7777-4777-8777-777777777778", shopId, role: "OWNER", name: "Mohan", shopName: "Balaji Dhaba" };
    expect((await call(markPaid, sessionId, { action: "paid", method: "UPI" })).status).toBe(200);
    expect(m.sessionUpdate.mock.calls[0][0].data).toMatchObject({ status: "PAID", paidMethod: "UPI" });
  });

  it("asks a signed-out screen to log in again", async () => {
    m.staff = null;
    expect((await call(moveOrder, orderId, { status: "SERVED" })).status).toBe(401);
  });
});

describe("waiter role", () => {
  it("lets a waiter mark food served but not start cooking, cancel or take payment", async () => {
    m.staff = { staffId: "77777777-7777-4777-8777-777777777779", shopId, role: "WAITER", name: "Sonu", shopName: "Balaji Dhaba" };
    expect((await call(moveOrder, orderId, { status: "SERVED" })).status).toBe(200);
    expect((await call(moveOrder, orderId, { status: "PREPARING" })).status).toBe(403);
    expect((await call(moveOrder, orderId, { status: "CANCELLED" })).status).toBe(403);
    expect((await call(markPaid, sessionId, { action: "paid", method: "CASH" })).status).toBe(403);
  });

  it("lets a manager take payment", async () => {
    m.staff = { staffId: "77777777-7777-4777-8777-777777777780", shopId, role: "MANAGER", name: "Ravi", shopName: "Balaji Dhaba" };
    expect((await call(markPaid, sessionId, { action: "paid", method: "CASH" })).status).toBe(200);
  });
});

describe("money safety on a table", () => {
  const owner = () => (m.staff = { staffId: "77777777-7777-4777-8777-777777777778", shopId, role: "OWNER", name: "Mohan", shopName: "Balaji Dhaba" });

  it("locks the table before closing the bill, so a new order cannot slip past it", async () => {
    owner();
    await call(markPaid, sessionId, { action: "paid", method: "UPI" });
    expect(m.lock).toHaveBeenCalled();
    expect(m.lock.mock.invocationCallOrder[0]).toBeLessThan(m.freeze.mock.invocationCallOrder[0]);
  });

  it("refuses a second Paid tap once the table is closed", async () => {
    owner();
    m.sessionFind.mockResolvedValueOnce({ id: sessionId, tableId: "t", status: "OPEN" }).mockResolvedValueOnce(null);
    expect((await call(markPaid, sessionId, { action: "paid", method: "UPI" })).status).toBe(409);
    expect(m.freeze).not.toHaveBeenCalled();
  });

  it("updates a bill the guest is looking at when an order is cancelled", async () => {
    m.orderFind.mockResolvedValue({ status: "RECEIVED", session: { id: sessionId, tableId: "t", status: "BILL_REQUESTED" } });
    expect((await call(moveOrder, orderId, { status: "CANCELLED" })).status).toBe(200);
    expect(m.freeze).toHaveBeenCalledWith(expect.anything(), sessionId, shopId);
  });

  it("closes a tab without a bill only when nothing is left to pay", async () => {
    owner();
    expect((await call(markPaid, sessionId, { action: "void" })).status).toBe(409);
    m.orderCount.mockResolvedValue(0);
    expect((await call(markPaid, sessionId, { action: "void" })).status).toBe(200);
    expect(m.sessionUpdate.mock.calls.at(-1)?.[0].data).toEqual({ status: "VOID" });
    expect((await call(markPaid, sessionId, { action: "paid", method: "CASH" })).status).toBe(409);
    expect(m.freeze).not.toHaveBeenCalled();
  });
});
