import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = vi.hoisted(() => ({
  $executeRaw: vi.fn(),
  qrCode: { update: vi.fn() },
  reviewSession: { count: vi.fn(), create: vi.fn() },
  analyticsEvent: { createMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: (work: (client: unknown) => unknown) => work(tx) } }));

import { recordScan } from "@/lib/reviews/record-scan";

const scan = {
  shopId: "11111111-1111-4111-8111-111111111111",
  qrCodeId: "33333333-3333-4333-8333-333333333333",
  sessionId: "22222222-2222-4222-8222-222222222222",
};

describe("recordScan", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records a normal scan", async () => {
    tx.reviewSession.count.mockResolvedValue(10);
    await recordScan(scan);
    expect(tx.qrCode.update).toHaveBeenCalledWith({ where: { id: scan.qrCodeId }, data: { scanCount: { increment: 1 } } });
    expect(tx.reviewSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: scan.sessionId, shopId: scan.shopId, qrCodeId: scan.qrCodeId }),
    });
    expect(tx.analyticsEvent.createMany.mock.calls[0][0].data).toHaveLength(2);
  });

  it("stops writing when one QR is flooded", async () => {
    tx.reviewSession.count.mockResolvedValue(300);
    await recordScan(scan);
    expect(tx.$executeRaw).toHaveBeenCalled();
    expect(tx.qrCode.update).not.toHaveBeenCalled();
    expect(tx.reviewSession.create).not.toHaveBeenCalled();
    expect(tx.analyticsEvent.createMany).not.toHaveBeenCalled();
  });
});
