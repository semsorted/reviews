import { prisma } from "@/lib/prisma";
import { MAX_SCANS_PER_QR_PER_HOUR } from "@/lib/reviews/rules";
import { generateToken } from "@/lib/utils";

export async function recordScan({ shopId, qrCodeId, sessionId }: { shopId: string; qrCodeId: string; sessionId: string }) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${qrCodeId}::text, 1))`;
    const recent = await tx.reviewSession.count({
      where: { qrCodeId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= MAX_SCANS_PER_QR_PER_HOUR) return;

    await tx.qrCode.update({ where: { id: qrCodeId }, data: { scanCount: { increment: 1 } } });
    await tx.reviewSession.create({
      data: { id: sessionId, shopId, qrCodeId, anonymousSessionId: `anon_${generateToken(18)}` },
    });
    await tx.analyticsEvent.createMany({
      data: ["qr_scan", "page_view"].map((eventType) => ({ shopId, qrCodeId, sessionId, eventType })),
    });
  });
}
