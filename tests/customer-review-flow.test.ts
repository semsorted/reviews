import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  qrFind: vi.fn(),
  sessionFind: vi.fn(),
  draftCount: vi.fn(),
  draftCreate: vi.fn(),
  draftUpdate: vi.fn(),
  draftFindMany: vi.fn(),
  draftFindFirst: vi.fn(),
  draftUpdateOne: vi.fn(),
  feedbackUpsert: vi.fn(),
  feedbackDelete: vi.fn(),
  aiCount: vi.fn(),
  aiWrite: vi.fn(),
  aiConfigured: vi.fn(),
  usage: vi.fn(),
  eventCreate: vi.fn(),
  eventCount: vi.fn(),
  lock: vi.fn(),
  afterWork: [] as Promise<unknown>[],
}));

vi.mock("@/lib/ai/gemini.provider", () => ({
  GeminiProvider: class {
    isConfigured = mocks.aiConfigured;
    generateReviewDraft = mocks.aiWrite;
    getDefaultModel = () => "test-model";
  },
}));
vi.mock("@/lib/ai/usage-tracker", () => ({ trackAiUsage: mocks.usage }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    qrCode: { findUnique: mocks.qrFind },
    reviewSession: { findUnique: mocks.sessionFind },
    reviewDraft: { updateMany: mocks.draftUpdate },
    analyticsEvent: { create: mocks.eventCreate, count: mocks.eventCount },
    aiUsageLog: { count: mocks.aiCount },
    $transaction: (work: (tx: unknown) => unknown) =>
      work({
        $executeRaw: mocks.lock,
        reviewDraft: {
          count: mocks.draftCount,
          create: mocks.draftCreate,
          findMany: mocks.draftFindMany,
          findFirst: mocks.draftFindFirst,
          update: mocks.draftUpdateOne,
        },
        reviewFeedback: { upsert: mocks.feedbackUpsert, deleteMany: mocks.feedbackDelete },
      }),
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
import { MAX_AI_DRAFTS_PER_SESSION, MAX_AI_DRAFTS_PER_SHOP_PER_DAY } from "@/lib/reviews/rules";
import { localCandidates } from "@/lib/reviews/unique-draft";

const aiText = "Sunset Cafe me service aur taste dono ka experience kaafi achha laga mujhe.";

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
  mocks.draftFindMany.mockResolvedValue([]);
  mocks.draftFindFirst.mockResolvedValue(null);
  mocks.draftUpdateOne.mockResolvedValue({ id: draftId });
  mocks.aiCount.mockResolvedValue(0);
  mocks.aiConfigured.mockReturnValue(true);
  mocks.aiWrite.mockResolvedValue({ draftText: aiText, model: "test-model", inputTokens: 10, outputTokens: 20, latencyMs: 300 });
  mocks.usage.mockResolvedValue(undefined);
});

describe("POST /api/review/generate", () => {
  const seen = localCandidates({ shopName: "Sunset Cafe", rating: 4, chips: ["Service", "Taste"], language: "hinglish" }, sessionId, 0);
  const allUsed = () => mocks.draftFindMany.mockImplementation(async ({ where }) => where.generatedText.in.map((generatedText: string) => ({ generatedText })));

  it("keeps the draft the customer sees when this shop has not used it", async () => {
    const response = await record(post("/api/review/generate", body));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ draftId, text: seen[0], source: "instant" });
    const { data } = mocks.draftCreate.mock.calls[0][0];
    expect(data).toMatchObject({ sessionId, shopId, customerNotes: "Rating 4: Service, Taste", language: "hinglish", provider: "instant", generatedText: seen[0] });
    expect(mocks.aiWrite).not.toHaveBeenCalled();
  });

  it.each([1, 2])("adds a %i-star customer to Needs attention", async (rating) => {
    await record(post("/api/review/generate", { ...body, rating }));
    expect(mocks.feedbackUpsert).toHaveBeenCalledWith({
      where: { sessionId },
      create: { sessionId, shopId, rating },
      update: { rating },
    });
    expect(mocks.feedbackDelete).not.toHaveBeenCalled();
  });

  it("removes an unsent attention item when the customer raises the rating", async () => {
    await record(post("/api/review/generate", { ...body, rating: 3 }));
    expect(mocks.feedbackDelete).toHaveBeenCalledWith({ where: { sessionId, message: null, status: "OPEN" } });
    expect(mocks.feedbackUpsert).not.toHaveBeenCalled();
  });

  it("checks other customers' reviews from this shop under a shop lock", async () => {
    await record(post("/api/review/generate", body));
    expect(mocks.lock).toHaveBeenCalledTimes(1);
    expect(mocks.draftFindMany.mock.calls[0][0].where).toMatchObject({ shopId, sessionId: { not: sessionId } });
  });

  it("swaps to another local review when the first was used, without Gemini", async () => {
    mocks.draftFindMany.mockResolvedValue([{ generatedText: seen[0] }]);
    const data = await (await record(post("/api/review/generate", body))).json();
    expect(data).toMatchObject({ text: seen[1], source: "instant" });
    expect(mocks.aiWrite).not.toHaveBeenCalled();
  });

  it("updates this customer's open draft instead of adding another", async () => {
    mocks.draftFindFirst.mockResolvedValue({ id: draftId });
    await record(post("/api/review/generate", body));
    expect(mocks.draftUpdateOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: draftId } }));
    expect(mocks.draftCreate).not.toHaveBeenCalled();
  });

  it("uses Gemini only when every local review is already used", async () => {
    allUsed();
    mocks.draftFindMany.mockImplementationOnce(async ({ where }) => where.generatedText.in.map((generatedText: string) => ({ generatedText })));
    mocks.draftFindMany.mockImplementationOnce(async () => []);
    const data = await (await record(post("/api/review/generate", body))).json();
    expect(mocks.aiWrite).toHaveBeenCalledTimes(1);
    expect(data).toMatchObject({ text: aiText, source: "gemini" });
    expect(mocks.draftCreate.mock.calls[0][0].data).toMatchObject({ provider: "gemini", generatedText: aiText });
    expect(mocks.lock).toHaveBeenCalledTimes(2);
  });

  it("keeps the customer moving when Gemini fails", async () => {
    allUsed();
    mocks.aiWrite.mockRejectedValue(new Error("429 RESOURCE_EXHAUSTED"));
    const response = await record(post("/api/review/generate", body));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ text: seen[0], source: "repeat" });
    expect(mocks.usage).toHaveBeenCalledWith(expect.objectContaining({ status: "FAILED" }));
  });

  it("retries once after a temporary Gemini error", async () => {
    mocks.draftFindMany.mockImplementationOnce(async ({ where }) => where.generatedText.in.map((generatedText: string) => ({ generatedText })));
    mocks.aiWrite.mockRejectedValueOnce(new Error('{"error":{"code":503,"message":"high demand"}}'));
    await expect((await record(post("/api/review/generate", body))).json()).resolves.toMatchObject({ text: aiText, source: "gemini" });
    expect(mocks.aiWrite).toHaveBeenCalledTimes(2);
  });

  it("does not retry when the free quota is finished", async () => {
    allUsed();
    mocks.aiWrite.mockRejectedValue(new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}'));
    await expect((await record(post("/api/review/generate", body))).json()).resolves.toMatchObject({ source: "repeat" });
    expect(mocks.aiWrite).toHaveBeenCalledTimes(1);
  });

  it("does not call Gemini when the key is missing", async () => {
    allUsed();
    mocks.aiConfigured.mockReturnValue(false);
    await expect((await record(post("/api/review/generate", body))).json()).resolves.toMatchObject({ source: "repeat" });
    expect(mocks.aiWrite).not.toHaveBeenCalled();
  });

  it.each([
    ["session", MAX_AI_DRAFTS_PER_SESSION, 0],
    ["shop", 0, MAX_AI_DRAFTS_PER_SHOP_PER_DAY],
  ])("stops free quota abuse at the %s limit", async (_name, sessionCalls, shopCalls) => {
    allUsed();
    mocks.aiCount.mockResolvedValueOnce(sessionCalls).mockResolvedValueOnce(shopCalls);
    await expect((await record(post("/api/review/generate", body))).json()).resolves.toMatchObject({ source: "repeat" });
    expect(mocks.aiWrite).not.toHaveBeenCalled();
  });

  it("rejects an unsafe Gemini draft after one retry", async () => {
    allUsed();
    mocks.aiWrite.mockResolvedValue({ draftText: "Written by AI for this shop, visit https://example.com today.", model: "m", inputTokens: 1, outputTokens: 1, latencyMs: 1 });
    await expect((await record(post("/api/review/generate", body))).json()).resolves.toMatchObject({ source: "repeat" });
    expect(mocks.aiWrite).toHaveBeenCalledTimes(2);
  });

  it("retries once when Gemini invents a detail", async () => {
    mocks.draftFindMany.mockImplementationOnce(async ({ where }) => where.generatedText.in.map((generatedText: string) => ({ generatedText })));
    mocks.aiWrite.mockResolvedValueOnce({ draftText: "Maine Sunset Cafe se kuch liya tha aur taste theek tha.", model: "m", inputTokens: 1, outputTokens: 1, latencyMs: 1 });
    await expect((await record(post("/api/review/generate", body))).json()).resolves.toMatchObject({ text: aiText, source: "gemini" });
    expect(mocks.aiWrite).toHaveBeenCalledTimes(2);
  });

  it("does not retry past the session's Gemini limit", async () => {
    allUsed();
    mocks.aiCount.mockResolvedValueOnce(MAX_AI_DRAFTS_PER_SESSION - 1).mockResolvedValueOnce(0);
    mocks.aiWrite.mockResolvedValue({ draftText: "Written by AI for this shop, visit https://example.com today.", model: "m", inputTokens: 1, outputTokens: 1, latencyMs: 1 });
    await record(post("/api/review/generate", body));
    expect(mocks.aiWrite).toHaveBeenCalledTimes(1);
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

  it("accepts uppercase IDs without a database error", async () => {
    const response = await record(
      post("/api/review/generate", { ...body, sessionId: sessionId.toUpperCase(), chipIds: [chipB.toUpperCase(), chipA.toUpperCase()] })
    );
    expect(response.status).toBe(200);
    expect(mocks.sessionFind.mock.calls[0][0].where.id).toBe(sessionId);
    expect(mocks.qrFind.mock.calls[0][0].select.shop.select.chips.where.id.in).toEqual([chipB, chipA]);
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

  it("records that a customer edited the review, without storing their words", async () => {
    await track(post("/api/analytics/event", { ...event, edited: true }));
    expect(mocks.eventCreate).toHaveBeenCalledWith({
      data: { shopId, qrCodeId: qrId, sessionId, eventType: "copy_click", metadata: { draftId, edited: true } },
    });
  });

  it.each([
    ["paused QR", { ...activeQr, isActive: false }],
    ["paused shop", { ...activeQr, shop: { ...activeQr.shop, isActive: false } }],
  ])("ignores events for a %s", async (_name, qr) => {
    mocks.qrFind.mockResolvedValue(qr);
    expect((await track(post("/api/analytics/event", event))).status).toBe(404);
    expect(mocks.eventCreate).not.toHaveBeenCalled();
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
