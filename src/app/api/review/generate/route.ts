import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { toReviewLanguage, writeInstantDraft } from "@/lib/reviews/instant-draft";
import { MAX_CHIPS, MAX_DRAFTS_PER_SESSION, MIN_CHIPS } from "@/lib/reviews/rules";
import { uuidSchema } from "@/lib/reviews/schema";

const RecordDraftSchema = z.object({
  token: z.string().min(8).max(64),
  sessionId: uuidSchema,
  rating: z.number().int().min(1).max(5),
  chipIds: z
    .array(uuidSchema)
    .min(MIN_CHIPS)
    .max(MAX_CHIPS)
    .refine((ids) => new Set(ids).size === ids.length),
});

/** Records a draft for shop stats. The customer's text is written on their device and never waits for this. */
export async function POST(request: NextRequest) {
  const parsed = RecordDraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please choose a rating and 2 to 4 options." }, { status: 400 });
  }
  const { token, sessionId, rating, chipIds } = parsed.data;

  try {
    const [qr, session] = await Promise.all([
      prisma.qrCode.findUnique({
        where: { publicToken: token },
        select: {
          id: true,
          isActive: true,
          shop: {
            select: {
              id: true,
              name: true,
              defaultLanguage: true,
              isActive: true,
              chips: { where: { id: { in: chipIds }, isActive: true }, select: { id: true, label: true } },
            },
          },
        },
      }),
      prisma.reviewSession.findUnique({ where: { id: sessionId }, select: { qrCodeId: true } }),
    ]);
    if (!qr?.isActive || !qr.shop.isActive) {
      return NextResponse.json({ error: "This review link is no longer active." }, { status: 404 });
    }
    if (session?.qrCodeId !== qr.id) {
      return NextResponse.json({ error: "Please scan the QR code again." }, { status: 403 });
    }

    const { shop } = qr;
    if (shop.chips.length !== chipIds.length) {
      return NextResponse.json({ error: "Those options changed. Please refresh and try again." }, { status: 400 });
    }
    const labels = chipIds.map((id) => shop.chips.find((chip) => chip.id === id)!.label);
    const language = toReviewLanguage(shop.defaultLanguage);

    const draft = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${sessionId}::text, 0))`;
      if ((await tx.reviewDraft.count({ where: { sessionId } })) >= MAX_DRAFTS_PER_SESSION) return null;
      return tx.reviewDraft.create({
        data: {
          sessionId,
          shopId: shop.id,
          customerNotes: `Rating ${rating}: ${labels.join(", ")}`,
          generatedText: writeInstantDraft({ shopName: shop.name, rating, chips: labels, language }),
          provider: "instant",
          model: "instant-writer",
          language,
          style: "natural",
        },
        select: { id: true },
      });
    });
    if (!draft) return NextResponse.json({ error: "Draft limit reached." }, { status: 429 });

    after(() =>
      prisma.analyticsEvent
        .create({
          data: {
            shopId: shop.id,
            qrCodeId: qr.id,
            sessionId,
            eventType: "draft_generated",
            metadata: { draftId: draft.id, rating, chipIds },
          },
        })
        .catch((error: unknown) => console.error("[API:Review:Record] Analytics failed", error))
    );

    return NextResponse.json({ draftId: draft.id });
  } catch (error) {
    console.error("[API:Review:Record]", error);
    return NextResponse.json({ error: "Could not record this draft." }, { status: 503 });
  }
}
