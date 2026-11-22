import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { MAX_DRAFTS_PER_SESSION } from "@/lib/reviews/rules";
import { uuidSchema } from "@/lib/reviews/schema";

const AnalyticsEventSchema = z.object({
  token: z.string().min(8).max(64),
  sessionId: uuidSchema,
  eventType: z.enum(["copy_click", "regenerate_click", "google_review_click"]),
  draftId: uuidSchema.optional(),
  edited: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = AnalyticsEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
  const { token, sessionId, eventType, draftId, edited } = parsed.data;

  try {
    const qr = await prisma.qrCode.findUnique({
      where: { publicToken: token },
      select: { id: true, isActive: true, shop: { select: { id: true, isActive: true } } },
    });
    if (!qr?.isActive || !qr.shop.isActive) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const session = await prisma.reviewSession.findUnique({
      where: { id: sessionId },
      select: { qrCodeId: true },
    });
    if (session?.qrCodeId !== qr.id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 403 });
    }

    // A session can create a limited number of drafts, so its events are limited the same way.
    const recorded = await prisma.analyticsEvent.count({ where: { sessionId, eventType } });
    if (recorded >= MAX_DRAFTS_PER_SESSION) return NextResponse.json({ success: true });

    await prisma.analyticsEvent.create({
      data: {
        shopId: qr.shop.id,
        qrCodeId: qr.id,
        sessionId,
        eventType,
        metadata: { ...(draftId ? { draftId } : {}), ...(eventType === "copy_click" && edited ? { edited: true } : {}) },
      },
    });

    if (eventType === "copy_click" && draftId) {
      await prisma.reviewDraft.updateMany({
        where: { id: draftId, sessionId, shopId: qr.shop.id },
        data: { isCopied: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API:Analytics]", error);
    return NextResponse.json({ error: "Could not record event" }, { status: 503 });
  }
}
