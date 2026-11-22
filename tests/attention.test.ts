import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  qrFind: vi.fn(),
  sessionFind: vi.fn(),
  feedbackFind: vi.fn(),
  feedbackUpsert: vi.fn(),
  feedbackUpdate: vi.fn(),
  eventCreate: vi.fn(),
  auditCreate: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    qrCode: { findUnique: mocks.qrFind },
    reviewSession: { findUnique: mocks.sessionFind },
    reviewFeedback: { findUnique: mocks.feedbackFind, upsert: mocks.feedbackUpsert, update: mocks.feedbackUpdate },
    analyticsEvent: { create: mocks.eventCreate },
    auditLog: { create: mocks.auditCreate },
  },
}));
vi.mock("@/lib/auth/session", async (original) => ({
  ...(await original<typeof import("@/lib/auth/session")>()),
  getCurrentUser: mocks.currentUser,
}));

import { POST as sendFeedback } from "@/app/api/review/feedback/route";
import { PATCH as updateAttention } from "@/app/api/admin/attention/[id]/route";

const shopId = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";
const qrId = "33333333-3333-4333-8333-333333333333";
const itemId = "55555555-5555-4555-8555-555555555555";
const body = { token: "public-token-123", sessionId, rating: 2, message: "  The order was late.  " };
const request = (url: string, method: string, payload: unknown) => new NextRequest(`http://localhost${url}`, { method, body: JSON.stringify(payload) });
const post = (payload: unknown) => sendFeedback(request("/api/review/feedback", "POST", payload));
const patch = (payload: unknown, id = itemId) => updateAttention(request(`/api/admin/attention/${id}`, "PATCH", payload), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.qrFind.mockResolvedValue({ id: qrId, isActive: true, shop: { id: shopId, isActive: true } });
  mocks.sessionFind.mockResolvedValue({ qrCodeId: qrId });
  mocks.feedbackFind.mockResolvedValue(null);
  mocks.feedbackUpsert.mockResolvedValue({ id: itemId });
  mocks.feedbackUpdate.mockResolvedValue({ id: itemId, shopId, status: "RESOLVED" });
  mocks.eventCreate.mockResolvedValue({});
  mocks.auditCreate.mockResolvedValue({});
  mocks.currentUser.mockResolvedValue({ id: "admin-id", role: "SUPER_ADMIN" });
});

describe("private customer feedback", () => {
  it("saves a low-rating message for the server's shop", async () => {
    const response = await post({ ...body, shopId: "forged" });
    expect(response.status).toBe(200);
    expect(mocks.feedbackUpsert.mock.calls[0][0]).toMatchObject({
      where: { sessionId },
      create: { sessionId, shopId, rating: 2, message: "The order was late.", status: "OPEN" },
    });
    expect(mocks.eventCreate).toHaveBeenCalledWith({ data: { shopId, qrCodeId: qrId, sessionId, eventType: "private_feedback" } });
  });

  it("removes characters the database cannot store", async () => {
    await post({ ...body, message: "Late\u0000 order\u0007" });
    expect(mocks.feedbackUpsert.mock.calls[0][0].create.message).toBe("Late order");
  });

  it.each([
    ["3 stars", { rating: 3 }],
    ["empty message", { message: "   " }],
    ["very long message", { message: "a".repeat(1001) }],
    ["bad session", { sessionId: "nope" }],
  ])("rejects %s", async (_name, change) => {
    expect((await post({ ...body, ...change })).status).toBe(400);
    expect(mocks.feedbackUpsert).not.toHaveBeenCalled();
  });

  it("rejects a session from another QR", async () => {
    mocks.sessionFind.mockResolvedValue({ qrCodeId: "66666666-6666-4666-8666-666666666666" });
    expect((await post(body)).status).toBe(403);
    expect(mocks.feedbackUpsert).not.toHaveBeenCalled();
  });

  it.each([
    ["unknown QR", null],
    ["paused QR", { id: qrId, isActive: false, shop: { id: shopId, isActive: true } }],
    ["paused shop", { id: qrId, isActive: true, shop: { id: shopId, isActive: false } }],
  ])("rejects a %s", async (_name, qr) => {
    mocks.qrFind.mockResolvedValue(qr);
    expect((await post(body)).status).toBe(404);
  });

  it("keeps the first message if the form is sent twice", async () => {
    mocks.feedbackFind.mockResolvedValue({ message: "First message" });
    expect((await post(body)).status).toBe(200);
    expect(mocks.feedbackUpsert).not.toHaveBeenCalled();
  });
});

describe("needs attention admin action", () => {
  it.each([
    ["signed out", null, 401],
    ["not an admin", { id: "user", role: "SHOP_OWNER" }, 403],
  ])("blocks a user who is %s", async (_name, user, status) => {
    mocks.currentUser.mockResolvedValue(user);
    expect((await patch({ status: "RESOLVED" })).status).toBe(status);
    expect(mocks.feedbackUpdate).not.toHaveBeenCalled();
  });

  it("resolves an item with an owner note and audit log", async () => {
    const response = await patch({ status: "RESOLVED", ownerNote: "  Called and fixed.  " });
    expect(response.status).toBe(200);
    const { where, data } = mocks.feedbackUpdate.mock.calls[0][0];
    expect(where).toEqual({ id: itemId });
    expect(data).toMatchObject({ status: "RESOLVED", ownerNote: "Called and fixed." });
    expect(data.resolvedAt).toBeInstanceOf(Date);
    expect(mocks.auditCreate.mock.calls[0][0].data).toMatchObject({ userId: "admin-id", shopId, action: "attention.resolve", entityType: "ReviewFeedback", entityId: itemId });
  });

  it("reopens an item", async () => {
    mocks.feedbackUpdate.mockResolvedValue({ id: itemId, shopId, status: "OPEN" });
    await patch({ status: "OPEN" });
    expect(mocks.feedbackUpdate.mock.calls[0][0].data).toMatchObject({ status: "OPEN", resolvedAt: null });
    expect(mocks.auditCreate.mock.calls[0][0].data.action).toBe("attention.reopen");
  });

  it.each([{ status: "DELETED" }, { status: "RESOLVED", ownerNote: "a".repeat(1001) }])("rejects bad input %#", async (payload) => {
    expect((await patch(payload)).status).toBe(400);
  });

  it("returns 404 for a bad ID", async () => {
    expect((await patch({ status: "RESOLVED" }, "nope")).status).toBe(404);
  });
});

describe("review_feedback table", () => {
  const sql = () => readFileSync("supabase/migrations/20261123000000_review_feedback.sql", "utf8");

  it("is private to the server", () => {
    expect(sql()).toContain("ALTER TABLE public.review_feedback ENABLE ROW LEVEL SECURITY");
    expect(sql()).toContain("REVOKE ALL ON public.review_feedback FROM PUBLIC, anon, authenticated");
    expect(sql()).not.toMatch(/CREATE POLICY/i);
  });

  it("allows one attention item per customer session", () => {
    expect(sql()).toMatch(/session_id UUID NOT NULL UNIQUE/);
  });
});
