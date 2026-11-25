import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { planUpiUrl, priceFor, yearlySaving } from "@/lib/restaurant-plans";
import { extendedEnd } from "@/lib/subscription";

const shopId = "11111111-1111-4111-8111-111111111111";
const key = "33333333-3333-4333-8333-333333333333";
const admin = "44444444-4444-4444-8444-444444444444";
const at = (iso: string) => new Date(iso);

const m = vi.hoisted(() => ({ paymentFind: vi.fn(), planFind: vi.fn(), shopUpdate: vi.fn(), paymentCreate: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/admin/api", async (original) => ({ ...(await original<object>()) }));
vi.mock("@/lib/ordering/admin-shop", () => ({ adminShop: async () => ({ shopId, actor: { adminId: admin } }) }));
vi.mock("@/lib/auth/guard", () => ({ adminErrorResponse: () => new Response("err", { status: 500 }) }));
vi.mock("@/lib/prisma", () => {
  const tx = { shop: { updateMany: m.shopUpdate }, shopPayment: { create: m.paymentCreate }, auditLog: { create: m.audit } };
  return { prisma: { shopPayment: { findUnique: m.paymentFind }, restaurantPlan: { findUnique: m.planFind }, $transaction: (work: (client: typeof tx) => unknown) => work(tx) } };
});

import { POST } from "@/app/api/admin/ordering/[shopId]/payments/route";

const ends = "2026-12-10T06:30:00.000Z";
const call = (body: object) => POST(new NextRequest("http://localhost/x", { method: "POST", body: JSON.stringify({ key, planId: "cafe", period: "year", method: "UPI", expectedEndsAt: ends, ...body }) }), { params: Promise.resolve({ shopId }) });

beforeEach(() => {
  vi.clearAllMocks();
  m.paymentFind.mockResolvedValue(null);
  m.planFind.mockResolvedValue({ id: "cafe", name: "Dhaba / Cafe", monthlyPrice: 299, yearlyPrice: 2499 });
  m.shopUpdate.mockResolvedValue({ count: 1 });
  m.paymentCreate.mockResolvedValue({ id: "pay-1", amount: 2499 });
});

describe("plan prices", () => {
  it("picks monthly or yearly and shows the yearly saving", () => {
    const plan = { monthlyPrice: 299, yearlyPrice: 2499 };
    expect(priceFor(plan, "month")).toBe(299);
    expect(priceFor(plan, "year")).toBe(2499);
    expect(yearlySaving(plan)).toBe(1089);
  });
  it("fills the amount into our UPI link and needs a valid link", () => {
    const url = planUpiUrl("upi://pay?pa=shop@upi&pn=Semsorted", 2499, "Balaji Dhaba!");
    expect(url).toContain("am=2499.00");
    expect(url).toContain("pa=shop@upi");
    expect(url).toContain("Semsorted%20Balaji%20Dhaba");
    expect(planUpiUrl(undefined, 299, "X")).toBeNull();
  });
});

describe("extendedEnd", () => {
  const now = at("2026-11-25T06:30:00Z");
  it("adds a month and keeps unused time", () => expect(extendedEnd(at("2026-12-10T06:30:00Z"), 1, now)).toEqual(at("2027-01-10T06:30:00Z")));
  it("clamps month ends", () => expect(extendedEnd(at("2027-01-31T06:30:00Z"), 1, now)).toEqual(at("2027-02-28T06:30:00Z")));
  it("starts an expired plan from today", () => expect(extendedEnd(at("2026-01-01T06:30:00Z"), 1, now)).toEqual(at("2026-12-25T06:30:00Z")));
});

describe("POST payments", () => {
  it("takes the amount from the plan and extends the end date", async () => {
    const res = await call({});
    expect(res.status).toBe(201);
    expect(m.shopUpdate).toHaveBeenCalledWith({ where: { id: shopId, subscriptionEndsAt: at(ends) }, data: { subscriptionEndsAt: at("2027-12-10T06:30:00.000Z") } });
    expect(m.paymentCreate.mock.calls[0][0].data).toMatchObject({ shopId, amount: 2499, months: 12, createdBy: admin, idempotencyKey: key });
    expect(m.audit).toHaveBeenCalledOnce();
  });
  it("ignores an amount sent by the page", async () => {
    await call({ amount: 1 });
    expect(m.paymentCreate.mock.calls[0][0].data.amount).toBe(2499);
  });
  it("a retried tap returns the same payment and adds nothing", async () => {
    m.paymentFind.mockResolvedValue({ id: "pay-1", shopId });
    const res = await call({});
    expect(res.status).toBe(200);
    expect(m.shopUpdate).not.toHaveBeenCalled();
  });
  it("a changed end date is a conflict and records nothing", async () => {
    m.shopUpdate.mockResolvedValue({ count: 0 });
    expect((await call({})).status).toBe(409);
    expect(m.paymentCreate).not.toHaveBeenCalled();
  });
  it("rejects an unknown plan", async () => {
    m.planFind.mockResolvedValue(null);
    expect((await call({ planId: "nope" })).status).toBe(400);
  });
});

describe("plans migration", () => {
  const sql = readFileSync("supabase/migrations/20261128000000_restaurant_plans.sql", "utf8");
  it.each(["restaurant_plans", "shop_payments"])("%s is closed to browsers", (table) => {
    expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    expect(sql).toMatch(new RegExp(`REVOKE ALL ON[\\s\\S]*public\\.${table}[\\s\\S]*FROM PUBLIC, anon, authenticated`));
  });
  it("stops the same payment being saved twice", () => expect(sql).toContain("idempotency_key UUID NOT NULL UNIQUE"));
});
