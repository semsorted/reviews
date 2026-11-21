import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  qrFind: vi.fn(),
  sessionFind: vi.fn(),
  chipFind: vi.fn(),
  draftCount: vi.fn(),
  draftCreate: vi.fn(),
  draftUpdateOne: vi.fn(),
  draftUpdate: vi.fn(),
  eventCreate: vi.fn(),
  eventCount: vi.fn(),
  lock: vi.fn(),
  generate: vi.fn(),
  template: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    qrCode: { findUnique: mocks.qrFind },
    reviewSession: { findUnique: mocks.sessionFind },
    reviewChip: { findMany: mocks.chipFind },
    reviewDraft: { update: mocks.draftUpdateOne, updateMany: mocks.draftUpdate },
    analyticsEvent: { create: mocks.eventCreate, count: mocks.eventCount },
    $transaction: (work: (tx: unknown) => unknown) =>
      work({ $executeRaw: mocks.lock, reviewDraft: { count: mocks.draftCount, create: mocks.draftCreate } }),
  },
}));
vi.mock("@/lib/ai/ai-router", () => ({
  aiRouter: { generateReviewDraft: mocks.generate, generateSafeFallbackDraft: mocks.template },
}));

import { POST as generate } from "@/app/api/review/generate/route";
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
    businessCategory: "Cafe",
    defaultLanguage: "hinglish",
    defaultAiProvider: "openai",
    isActive: true,
  },
};
const body = { token: "public-token-123", sessionId, rating: 4, chipIds: [chipB, chipA] };
const post = (url: string, payload: unknown) =>
  new NextRequest(`http://localhost${url}`, { method: "POST", body: JSON.stringify(payload) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.qrFind.mockResolvedValue(activeQr);
  mocks.sessionFind.mockResolvedValue({ qrCodeId: qrId });
  mocks.chipFind.mockResolvedValue([
    { id: chipA, label: "Taste" },
    { id: chipB, label: "Service" },
  ]);
  mocks.draftCount.mockResolvedValue(0);
  mocks.draftCreate.mockResolvedValue({ id: draftId });
  mocks.draftUpdateOne.mockResolvedValue({});
  mocks.eventCreate.mockResolvedValue({});
  mocks.eventCount.mockResolvedValue(0);
  mocks.lock.mockResolvedValue(0);
  mocks.template.mockReturnValue({
    draftText: "Template review for Sunset Cafe.",
    provider: "fallback",
    model: "safe-template-fallback",
    isFallback: true,
  });
  mocks.draftUpdate.mockResolvedValue({ count: 1 });
  mocks.generate.mockResolvedValue({
    draftText: "Good service and taste at Sunset Cafe.",
    provider: "openai",
    model: "test-model",
    isFallback: false,
  });
});

describe("POST /api/review/generate", () => {
  it("drafts from the server's shop data and the selected chips", async () => {
    const response = await generate(post("/api/review/generate", body));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      draftId,
      draftText: "Good service and taste at Sunset Cafe.",
    });
    expect(mocks.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId,
        sessionId,
        shopName: "Sunset Cafe",
        businessCategory: "Cafe",
        rating: 4,
        chips: ["Service", "Taste"],
        style: "natural",
        language: "hinglish",
      }),
      { preferredProvider: "openai" }
    );
  });

  it.each([
    ["unknown token", null],
    ["inactive QR", { ...activeQr, isActive: false }],
    ["inactive shop", { ...activeQr, shop: { ...activeQr.shop, isActive: false } }],
  ])("returns 404 for %s", async (_name, qr) => {
    mocks.qrFind.mockResolvedValue(qr);
    const response = await generate(post("/api/review/generate", body));
    expect(response.status).toBe(404);
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("rejects a session from another QR", async () => {
    mocks.sessionFind.mockResolvedValue({ qrCodeId: "66666666-6666-4666-8666-666666666666" });
    const response = await generate(post("/api/review/generate", body));
    expect(response.status).toBe(403);
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it.each([
    ["one chip", [chipA]],
    ["five chips", [chipA, chipB, chipC, chipD, chipE]],
    ["duplicate chips", [chipA, chipA]],
  ])("rejects %s", async (_name, chipIds) => {
    const response = await generate(post("/api/review/generate", { ...body, chipIds }));
    expect(response.status).toBe(400);
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("rejects an inactive or other-shop chip", async () => {
    mocks.chipFind.mockResolvedValue([{ id: chipA, label: "Taste" }]);
    const response = await generate(post("/api/review/generate", body));
    expect(response.status).toBe(400);
    expect(mocks.chipFind).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [chipB, chipA] }, shopId, isActive: true } })
    );
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("limits drafts per session", async () => {
    mocks.draftCount.mockResolvedValueOnce(5);
    const response = await generate(post("/api/review/generate", body));
    expect(response.status).toBe(429);
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.draftCreate).not.toHaveBeenCalled();
  });

  it("reserves the draft under a lock before paying for AI", async () => {
    const order: string[] = [];
    mocks.lock.mockImplementation(async () => (order.push("lock"), 0));
    mocks.draftCreate.mockImplementation(async () => (order.push("reserve"), { id: draftId }));
    mocks.generate.mockImplementation(async () => {
      order.push("ai");
      return { draftText: "AI review text.", provider: "openai", model: "test-model", isFallback: false };
    });
    await generate(post("/api/review/generate", body));
    expect(order).toEqual(["lock", "reserve", "ai"]);
    expect(mocks.draftUpdateOne).toHaveBeenCalledWith({
      where: { id: draftId },
      data: { generatedText: "AI review text.", provider: "openai", model: "test-model" },
    });
  });

  it("keeps customers moving with a free template at the shop cap", async () => {
    mocks.draftCount.mockResolvedValueOnce(0).mockResolvedValueOnce(120);
    const response = await generate(post("/api/review/generate", body));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ draftId, draftText: "Template review for Sunset Cafe." });
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("returns the template when AI fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.generate.mockRejectedValue(new Error("provider down"));
    const response = await generate(post("/api/review/generate", body));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ draftId, draftText: "Template review for Sunset Cafe." });
    spy.mockRestore();
  });

  it("still returns the draft when analytics fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.eventCreate.mockRejectedValue(new Error("analytics down"));
    const response = await generate(post("/api/review/generate", body));
    expect(response.status).toBe(200);
    spy.mockRestore();
  });

  it("returns 503 when the database fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.qrFind.mockRejectedValue(new Error("connection refused"));
    const response = await generate(post("/api/review/generate", body));
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
    const response = await track(post("/api/analytics/event", event));
    expect(response.status).toBe(200);
    expect(mocks.eventCreate).not.toHaveBeenCalled();
    expect(mocks.eventCount).toHaveBeenCalledWith({ where: { sessionId, eventType: "copy_click" } });
  });

  it("rejects a mismatched token and session", async () => {
    mocks.sessionFind.mockResolvedValue({ qrCodeId: "66666666-6666-4666-8666-666666666666" });
    const response = await track(post("/api/analytics/event", event));
    expect(response.status).toBe(403);
    expect(mocks.eventCreate).not.toHaveBeenCalled();
  });
});
