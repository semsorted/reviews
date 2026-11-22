import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { uuidSchema } from "@/lib/reviews/schema";

const FeedbackSchema = z.object({
  token: z.string().min(8).max(64),
  sessionId: uuidSchema,
  rating: z.union([z.literal(1), z.literal(2)]),
  message: z
    .string()
    .transform((text) => text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim())
    .pipe(z.string().min(1).max(1000)),
});

/** Saves a private message for the shop. It never replaces or blocks the customer's Google review. */
export async function POST(request: NextRequest) {
  const parsed = FeedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please write a short message." }, { status: 400 });
  const { token, sessionId, rating, message } = parsed.data;

  try {
    const [qr, session] = await Promise.all([
      prisma.qrCode.findUnique({
        where: { publicToken: token },
        select: { id: true, isActive: true, shop: { select: { id: true, isActive: true } } },
      }),
      prisma.reviewSession.findUnique({ where: { id: sessionId }, select: { qrCodeId: true } }),
    ]);
    if (!qr?.isActive || !qr.shop.isActive) return NextResponse.json({ error: "This review link is no longer active." }, { status: 404 });
    if (session?.qrCodeId !== qr.id) return NextResponse.json({ error: "Please scan the QR code again." }, { status: 403 });

    const existing = await prisma.reviewFeedback.findUnique({ where: { sessionId }, select: { message: true } });
    if (existing?.message) return NextResponse.json({ success: true });

    await prisma.reviewFeedback.upsert({
      where: { sessionId },
      create: { sessionId, shopId: qr.shop.id, rating, message, status: "OPEN" },
      update: { rating, message, status: "OPEN", resolvedAt: null },
    });
    await prisma.analyticsEvent.create({ data: { shopId: qr.shop.id, qrCodeId: qr.id, sessionId, eventType: "private_feedback" } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API:Review:Feedback]", error);
    return NextResponse.json({ error: "Could not send this message. Try again." }, { status: 503 });
  }
}
