import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { writeGeminiDraft } from "@/lib/reviews/ai-draft";
import { toReviewLanguage } from "@/lib/reviews/instant-draft";
import { MAX_CHIPS, MAX_DRAFTS_PER_SESSION, MIN_CHIPS } from "@/lib/reviews/rules";
import { uuidSchema } from "@/lib/reviews/schema";
import { firstUnused, localCandidates } from "@/lib/reviews/unique-draft";

const RecordDraftSchema = z.object({
  token: z.string().min(8).max(64),
  sessionId: uuidSchema,
  rating: z.number().int().min(1).max(5),
  variant: z.number().int().min(0).max(999).default(0),
  chipIds: z
    .array(uuidSchema)
    .min(MIN_CHIPS)
    .max(MAX_CHIPS)
    .refine((ids) => new Set(ids).size === ids.length),
});

type DraftOwner = { shopId: string; sessionId: string; customerNotes: string; language: string };

/** Saves the first review this shop has not used. Returns "used" when none is left, or null at the session limit. */
function claimDraft(owner: DraftOwner, texts: string[], provider: string, model: string, allowRepeat = false) {
  const { shopId, sessionId, customerNotes, language } = owner;
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${shopId}::text, 0))`;
    const taken = await tx.reviewDraft.findMany({
      where: { shopId, sessionId: { not: sessionId }, generatedText: { in: texts } },
      select: { generatedText: true },
    });
    const text = firstUnused(texts, taken.map((row) => row.generatedText)) ?? (allowRepeat ? texts[0] : undefined);
    if (!text) return "used" as const;

    const data = { customerNotes, generatedText: text, provider, model, language, style: "natural" };
    const open = await tx.reviewDraft.findFirst({ where: { sessionId, isCopied: false }, orderBy: { createdAt: "desc" }, select: { id: true } });
    if (open) {
      await tx.reviewDraft.update({ where: { id: open.id }, data });
      return { id: open.id, text, created: false };
    }
    if ((await tx.reviewDraft.count({ where: { sessionId } })) >= MAX_DRAFTS_PER_SESSION) return null;
    const draft = await tx.reviewDraft.create({ data: { ...data, sessionId, shopId }, select: { id: true } });
    return { id: draft.id, text, created: true };
  });
}

/** Confirms the draft on screen is unique for this shop. The customer never waits for this response. */
export async function POST(request: NextRequest) {
  const parsed = RecordDraftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please choose a rating and 2 to 4 options." }, { status: 400 });
  }
  const { token, sessionId, rating, variant, chipIds } = parsed.data;

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
              businessCategory: true,
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
    const owner = { shopId: shop.id, sessionId, customerNotes: `Rating ${rating}: ${labels.join(", ")}`, language };
    const candidates = localCandidates({ shopName: shop.name, rating, chips: labels, language }, sessionId, variant);

    let source: "instant" | "gemini" | "repeat" = "instant";
    let draft = await claimDraft(owner, candidates, "instant", "instant-writer");
    if (draft === "used") {
      const ai = await writeGeminiDraft({ shopId: shop.id, sessionId, shopName: shop.name, businessCategory: shop.businessCategory, rating, chips: labels, language });
      if (ai) {
        draft = await claimDraft(owner, [ai.text], "gemini", ai.model);
        source = "gemini";
      }
      if (draft === "used") {
        draft = await claimDraft(owner, candidates, "instant", "instant-writer", true);
        source = "repeat";
      }
    }
    if (!draft || draft === "used") return NextResponse.json({ error: "Draft limit reached." }, { status: 429 });

    if (draft.created) {
      const draftId = draft.id;
      after(() =>
        prisma.analyticsEvent
          .create({
            data: {
              shopId: shop.id,
              qrCodeId: qr.id,
              sessionId,
              eventType: "draft_generated",
              metadata: { draftId, rating, chipIds },
            },
          })
          .catch((error: unknown) => console.error("[API:Review:Record] Analytics failed", error))
      );
    }

    return NextResponse.json({ draftId: draft.id, text: draft.text, source });
  } catch (error) {
    console.error("[API:Review:Record]", error);
    return NextResponse.json({ error: "Could not record this draft." }, { status: 503 });
  }
}
