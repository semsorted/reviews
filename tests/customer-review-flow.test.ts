import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  qrFind: vi.fn(),
  sessionFind: vi.fn(),
  draftCount: vi.fn(),
  draftCreate: vi.fn(),
  draftUpdate: vi.fn(),
  eventCreate: vi.fn(),
  eventCount: vi.fn(),
  lock: vi.fn(),
  afterWork: [] as Promise<unknown>[],
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    qrCode: { findUnique: mocks.qrFind },
    reviewSession: { findUnique: mocks.sessionFind },
    reviewDraft: { updateMany: mocks.draftUpdate },
    analyticsEvent: { create: mocks.eventCreate, count: mocks.eventCount },
    $transaction: (work: (tx: unknown) => unknown) =>
      work({ $executeRaw: mocks.lock, reviewDraft: { count: mocks.draftCount, create: mocks.draftCreate } }),
  },
}));
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  after: (work: () => unknown) => {
    mocks.afterWork.push(Promise.resolve().then(work));
  },
}));

import { POST as record } from "@/app/api/review/generate/route";
import { POST as track } from "@/app/api/analytics/event/route";

const shopId = "11111111-1111-4111-8111-111111111111";
const qrId = "33333333-3333-4333-8333-333333333333";
const sessionId = "22222222-2222-4222-8222-222222222222";
const draftId = "55555555-5555-4555-8555-555555555555";
const chipA = "44444444-4444-4444-8444-444444444441";
const chipB = "44444444-4444-4444-8444-444444444442";
const chipC = "44444444-4444-4444-8444-444444444443";
const chipD = "44444444-4444-4444-8444-444444444444";
const chipE = "44444444-4444-4444-8444-444444444445";

const activeQr = {
  id: qrId,
  isActive: true,
  shop: {
    id: shopId,
    name: "Sunset Cafe",
    defaultLanguage: "hinglish",
    isActive: true,
    chips: [
      { id: chipA, label: "Taste" },
      { id: chipB, label: "Service" },
    ],
  },
};
const body = { token: "public-token-123", sessionId, rating: 4, chipIds: [chipB, chipA] };
const post = (url: string, payload: unknown) =>
  new NextRequest(`http://localhost${url}`, { method: "POST", body: JSON.stringify(payload) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.afterWork.length = 0;
  mocks.qrFind.mockResolvedValue(activeQr);
  mocks.sessionFind.mockResolvedValue({ qrCodeId: qrId });
  mocks.draftCount.mockResolvedValue(0);
  mocks.draftCreate.mockResolvedValue({ id: draftId });
  mocks.eventCreate.mockResolvedValue({});
  mocks.eventCount.mockResolvedValue(0);
  mocks.draftUpdate.mockResolvedValue({ count: 1 });
  mocks.lock.mockResolvedValue(0);
});

describe("POST /api/review/generate", () => {
  it("records a draft from the server's shop data", async () => {
    const response = await record(post("/api/review/generate", body));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ draftId });
    const { data } = mocks.draftCreate.mock.calls[0][0];
    expect(data).toMatchObject({ sessionId, shopId, customerNotes: "Rating 4: Service, Taste", language: "hinglish", provider: "instant" });
    expect(data.generatedText).toContain("Sunset Cafe");
  });

  it("records analytics after the response", async () => {
    await record(post("/api/review/generate", body));
    await Promise.all(mocks.afterWork);
    expect(mocks.eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventType: "draft_generated", shopId, sessionId }) })
    );
  });

  it.each([
    ["unknown token", null],
    ["inactive QR", { ...activeQr, isActive: false }],
    ["inactive shop", { ...activeQr, shop: { ...activeQr.shop, isActive: false } }],
  ])("returns 404 for %s", async (_name, qr) => {
    mocks.qrFind.mockResolvedValue(qr);
    expect((await record(post("/api/review/generate", body))).status).toBe(404);
    expect(mocks.draftCreate).not.toHaveBeenCalled();
  });

  it("rejects a session from another QR", async () => {
    mocks.sessionFind.mockResolvedValue({ qrCodeId: "66666666-6666-4666-8666-666666666666" });
    expect((await record(post("/api/review/generate", body))).status).toBe(403);
    expect(mocks.draftCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["one chip", [chipA]],
    ["five chips", [chipA, chipB, chipC, chipD, chipE]],
    ["duplicate chips", [chipA, chipA]],
  ])("rejects %s", async (_name, chipIds) => {
    expect((await record(post("/api/review/generate", { ...body, chipIds }))).status).toBe(400);
    expect(mocks.draftCreate).not.toHaveBeenCalled();
  });

  it("rejects an inactive or other-shop chip", async () => {
    mocks.qrFind.mockResolvedValue({ ...activeQr, shop: { ...activeQr.shop, chips: [{ id: chipA, label: "Taste" }] } });
    expect((await record(post("/api/review/generate", body))).status).toBe(400);
    expect(mocks.qrFind.mock.calls[0][0].select.shop.select.chips.where).toEqual({
      id: { in: [chipB, chipA] },
      isActive: true,
    });
    expect(mocks.draftCreate).not.toHaveBeenCalled();
  });

  it("limits drafts per session under a lock", async () => {
    const order: string[] = [];
    mocks.lock.mockImplementation(async () => (order.push("lock"), 0));
    mocks.draftCount.mockImplementation(async () => (order.push("count"), 5));
    const response = await record(post("/api/review/generate", body));
    expect(response.status).toBe(429);
    expect(order).toEqual(["lock", "count"]);
    expect(mocks.draftCreate).not.toHaveBeenCalled();
  });

  it("still succeeds when analytics fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.eventCreate.mockRejectedValue(new Error("analytics down"));
    expect((await record(post("/api/review/generate", body))).status).toBe(200);
    await Promise.all(mocks.afterWork);
    spy.mockRestore();
  });

  it("returns 503 when the database fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.qrFind.mockRejectedValue(new Error("connection refused"));
    const response = await record(post("/api/review/generate", body));
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("connection refused");
    spy.mockRestore();
  });
});

describe("POST /api/analytics/event", () => {
  const event = { token: "public-token-123", sessionId, eventType: "copy_click", draftId };

  it("derives the shop and QR on the server", async () => {
    const response = await track(post("/api/analytics/event", { ...event, shopId: "forged" }));
    expect(response.status).toBe(200);
    expect(mocks.eventCreate).toHaveBeenCalledWith({
      data: { shopId, qrCodeId: qrId, sessionId, eventType: "copy_click", metadata: { draftId } },
    });
    expect(mocks.draftUpdate).toHaveBeenCalledWith({
      where: { id: draftId, sessionId, shopId },
      data: { isCopied: true },
    });
  });

  it("stops recording repeated events for one session", async () => {
    mocks.eventCount.mockResolvedValue(5);
    expect((await track(post("/api/analytics/event", event))).status).toBe(200);
    expect(mocks.eventCreate).not.toHaveBeenCalled();
  });

  it("rejects a mismatched token and session", async () => {
    mocks.sessionFind.mockResolvedValue({ qrCodeId: "66666666-6666-4666-8666-666666666666" });
    expect((await track(post("/api/analytics/event", event))).status).toBe(403);
    expect(mocks.eventCreate).not.toHaveBeenCalled();
  });
});
