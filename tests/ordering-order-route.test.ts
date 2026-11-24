import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const ids = {
  shop: "11111111-1111-4111-8111-111111111111",
  table: "22222222-2222-4222-8222-222222222222",
  session: "33333333-3333-4333-8333-333333333333",
  key: "44444444-4444-4444-8444-444444444444",
  paneer: "55555555-5555-4555-8555-555555555551",
  naan: "55555555-5555-4555-8555-555555555552",
  order: "66666666-6666-4666-8666-666666666666",
};
const token = "TableToken1234567890";

const m = vi.hoisted(() => ({
  tableFind: vi.fn(),
  settingsFind: vi.fn(),
  shopFind: vi.fn(),
  lock: vi.fn(),
  orderFindKey: vi.fn(),
  sessionFindFirst: vi.fn(),
  sessionCreate: vi.fn(),
  sessionUpdate: vi.fn(),
  orderCount: vi.fn(),
  menuFind: vi.fn(),
  orderCreate: vi.fn(),
  bump: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const tx = {
    $executeRaw: m.lock,
    order: { findUnique: m.orderFindKey, count: m.orderCount, create: m.orderCreate },
    tableSession: { findFirst: m.sessionFindFirst, create: m.sessionCreate, update: m.sessionUpdate },
    menuItem: { findMany: m.menuFind },
    orderingSettings: { update: m.bump },
  };
  return {
    prisma: {
      diningTable: { findUnique: m.tableFind },
      orderingSettings: { findUnique: m.settingsFind },
      shop: { findUnique: m.shopFind },
      $transaction: (work: (client: typeof tx) => unknown) => work(tx),
    },
  };
});

import { POST } from "@/app/api/table/order/route";

const post = (body: unknown) => POST(new NextRequest("http://localhost/api/table/order", { method: "POST", body: JSON.stringify(body) }));
const order = (overrides: Record<string, unknown> = {}) => ({
  token,
  key: ids.key,
  partySize: 3,
  items: [{ itemId: ids.paneer, qty: 2 }, { itemId: ids.naan, qty: 4 }],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  m.tableFind.mockResolvedValue({ id: ids.table, shopId: ids.shop, label: "T1", isActive: true });
  m.settingsFind.mockResolvedValue({ shopId: ids.shop, isEnabled: true, version: BigInt(4) });
  m.shopFind.mockResolvedValue({ id: ids.shop, name: "Balaji Dhaba", isActive: true, subscriptionEndsAt: new Date(Date.now() + 86_400_000) });
  m.orderFindKey.mockResolvedValue(null);
  m.sessionFindFirst.mockResolvedValue(null);
  m.sessionCreate.mockResolvedValue({ id: ids.session, status: "OPEN", partySize: 3 });
  m.orderCount.mockResolvedValue(0);
  m.menuFind.mockResolvedValue([
    { id: ids.paneer, name: "Paneer tikka", pricePaise: 22000, isVeg: true },
    { id: ids.naan, name: "Butter naan", pricePaise: 4000, isVeg: true },
  ]);
  m.orderCreate.mockResolvedValue({ id: ids.order });
});

describe("POST /api/table/order", () => {
  it("takes prices from the menu, not from the phone", async () => {
    const res = await post(order({ items: [{ itemId: ids.paneer, qty: 2, pricePaise: 1 }, { itemId: ids.naan, qty: 4 }] }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ orderId: ids.order, sessionId: ids.session });
    const data = m.orderCreate.mock.calls[0][0].data;
    expect(data.items.create).toEqual([
      { menuItemId: ids.paneer, name: "Paneer tikka", pricePaise: 22000, isVeg: true, qty: 2 },
      { menuItemId: ids.naan, name: "Butter naan", pricePaise: 4000, isVeg: true, qty: 4 },
    ]);
    expect(m.menuFind.mock.calls[0][0].where).toMatchObject({ shopId: ids.shop, isAvailable: true });
    expect(m.lock).toHaveBeenCalled();
    expect(m.bump).toHaveBeenCalledWith({ where: { shopId: ids.shop }, data: { version: { increment: 1 } } });
  });

  it("returns the same order when the phone sends it twice", async () => {
    m.orderFindKey.mockResolvedValue({ id: ids.order, sessionId: ids.session, shopId: ids.shop });
    const res = await post(order());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ orderId: ids.order, sessionId: ids.session });
    expect(m.orderCreate).not.toHaveBeenCalled();
  });

  it("tells the guest which items just ran out", async () => {
    m.menuFind.mockResolvedValue([{ id: ids.paneer, name: "Paneer tikka", pricePaise: 22000, isVeg: true }]);
    const res = await post(order());
    expect(res.status).toBe(409);
    expect((await res.json()).unavailable).toEqual([ids.naan]);
    expect(m.orderCreate).not.toHaveBeenCalled();
  });

  it("adds to the table's open tab and reopens it after a bill request", async () => {
    m.sessionFindFirst.mockResolvedValue({ id: ids.session, status: "BILL_REQUESTED", partySize: 2 });
    const res = await post(order());
    expect(res.status).toBe(201);
    expect(m.sessionCreate).not.toHaveBeenCalled();
    expect(m.sessionUpdate).toHaveBeenCalledWith({ where: { id: ids.session }, data: { status: "OPEN", partySize: 3 } });
  });

  it("limits how many orders one tab can wait on", async () => {
    m.orderCount.mockResolvedValueOnce(3).mockResolvedValueOnce(5);
    const res = await post(order());
    expect(res.status).toBe(429);
    expect(m.orderCreate).not.toHaveBeenCalled();
  });

  it("stops orders when ordering is off or the subscription ended", async () => {
    m.settingsFind.mockResolvedValue({ shopId: ids.shop, isEnabled: false, version: BigInt(4) });
    expect((await post(order())).status).toBe(404);
    m.settingsFind.mockResolvedValue({ shopId: ids.shop, isEnabled: true, version: BigInt(4) });
    m.shopFind.mockResolvedValue({ id: ids.shop, name: "Balaji Dhaba", isActive: true, subscriptionEndsAt: new Date(Date.now() - 1000) });
    expect((await post(order())).status).toBe(404);
  });

  it.each([
    ["no items", { items: [] }],
    ["the same item twice", { items: [{ itemId: ids.paneer, qty: 1 }, { itemId: ids.paneer, qty: 1 }] }],
    ["a huge quantity", { items: [{ itemId: ids.paneer, qty: 50 }] }],
    ["a bad key", { key: "not-a-uuid" }],
    ["too many people", { partySize: 99 }],
  ])("rejects %s", async (_label, overrides) => {
    expect((await post(order(overrides))).status).toBe(400);
    expect(m.orderCreate).not.toHaveBeenCalled();
  });
});
