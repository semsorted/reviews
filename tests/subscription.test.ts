import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";

const mocks = vi.hoisted(() => ({ update: vi.fn(), audit: vi.fn(), user: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: (run: (tx: unknown) => unknown) => run({ shop: { updateMany: mocks.update }, auditLog: { create: mocks.audit } }) },
}));
vi.mock("@/lib/auth/session", async (original) => ({ ...(await original<typeof import("@/lib/auth/session")>()), getCurrentUser: mocks.user }));

import { POST as renew } from "@/app/api/admin/shops/[id]/subscription/route";
import { isSubscribed, renewedEnd, subscriptionInfo } from "@/lib/subscription";

const at = (value: string) => new Date(value);
const now = at("2026-11-23T06:30:00Z"); // 23 Nov 2026, 12:00 India time

describe("subscription time left", () => {
  it.each([
    ["2027-11-23T06:30:00Z", "1 year left", "active"],
    ["2027-11-22T06:30:00Z", "11 months 30 days left", "active"],
    ["2027-01-25T06:30:00Z", "2 months 2 days left", "active"],
    ["2026-12-24T06:30:00Z", "1 month 1 day left", "active"],
    ["2026-12-23T06:30:00Z", "1 month left", "ending"],
    ["2026-11-24T06:30:00Z", "1 day left", "ending"],
    ["2026-11-23T18:00:00Z", "Ends today", "ending"],
    ["2026-11-23T06:29:00Z", "Expired", "expired"],
  ])("%s shows %s", (end, label, state) => {
    expect(subscriptionInfo(at(end), now)).toMatchObject({ label, state });
  });

  it("counts days on the India calendar", () => {
    expect(subscriptionInfo(at("2026-11-23T19:00:00Z"), now)).toMatchObject({ label: "1 day left", daysLeft: 1, endsOn: "24 Nov 2026" });
  });

  it("stops at the exact end time", () => {
    expect(isSubscribed(at("2026-11-23T06:30:01Z"), now)).toBe(true);
    expect(isSubscribed(now, now)).toBe(false);
  });
});

describe("renewing", () => {
  it("adds a year to the current end when renewed early", () => {
    expect(renewedEnd(at("2027-01-10T06:30:00Z"), now)).toEqual(at("2028-01-10T06:30:00Z"));
  });

  it("starts from today when already expired", () => {
    expect(renewedEnd(at("2026-01-10T06:30:00Z"), now)).toEqual(at("2027-11-23T06:30:00Z"));
  });

  it("keeps 29 February inside February", () => {
    expect(renewedEnd(at("2028-02-29T06:30:00Z"), at("2028-01-01T00:00:00Z"))).toEqual(at("2029-02-28T06:30:00Z"));
  });
});

describe("POST renew subscription", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const admin = { id: "99999999-9999-4999-8999-999999999999", email: "a@b.co", role: "SUPER_ADMIN", fullName: null, avatarUrl: null };
  const expectedEndsAt = "2099-01-10T06:30:00.000Z";
  const call = (body: unknown = { expectedEndsAt }) => renew(new NextRequest("http://localhost/api", { method: "POST", body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user.mockResolvedValue(admin);
    mocks.update.mockResolvedValue({ count: 1 });
  });

  it("saves one more year and an audit entry", async () => {
    const response = await call();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ subscriptionEndsAt: "2100-01-10T06:30:00.000Z" });
    expect(mocks.update).toHaveBeenCalledWith({ where: { id, subscriptionEndsAt: at(expectedEndsAt) }, data: { subscriptionEndsAt: at("2100-01-10T06:30:00.000Z") } });
    expect(mocks.audit.mock.calls[0][0].data).toMatchObject({ userId: admin.id, shopId: id, action: "shop.subscription_renew" });
  });

  it("does not add a second year on a double tap", async () => {
    mocks.update.mockResolvedValue({ count: 0 });
    expect((await call()).status).toBe(409);
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("blocks anyone who is not the admin", async () => {
    mocks.user.mockResolvedValue({ ...admin, role: "SHOP_OWNER" });
    expect((await call()).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects a bad date", async () => {
    expect((await call({ expectedEndsAt: "soon" })).status).toBe(400);
  });
});

describe("subscription migration", () => {
  const sql = readFileSync("supabase/migrations/20261124000000_shop_subscription.sql", "utf8");
  it("starts existing businesses from their created date, with no end-less shop", () => {
    expect(sql).toMatch(/created_at \+ INTERVAL '1 year'/);
    expect(sql).toMatch(/SET NOT NULL/);
    expect(sql).toMatch(/SET DEFAULT \(now\(\) \+ INTERVAL '1 year'\)/);
  });
});
