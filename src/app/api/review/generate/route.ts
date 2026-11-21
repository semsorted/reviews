import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiRouter } from "@/lib/ai/ai-router";
import type { AIProviderId, GenerateReviewDraftInput, ReviewLanguage } from "@/lib/ai/provider.interface";
import { prisma } from "@/lib/prisma";
import {
  MAX_CHIPS,
  MAX_DRAFTS_PER_SESSION,
  MAX_DRAFTS_PER_SHOP_PER_HOUR,
  MIN_CHIPS,
} from "@/lib/reviews/rules";

const GenerateReviewSchema = z.object({
  token: z.string().min(8).max(64),
  sessionId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  chipIds: z
    .array(z.uuid())
    .min(MIN_CHIPS)
    .max(MAX_CHIPS)
    .refine((ids) => new Set(ids).size === ids.length),
});

const LANGUAGES: readonly string[] = ["en", "hi", "hinglish"] satisfies ReviewLanguage[];
const PROVIDERS: readonly string[] = ["gemini", "openai"] satisfies AIProviderId[];

export async function POST(request: NextRequest) {
  const parsed = GenerateReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please choose a rating and 2 to 4 options." }, { status: 400 });
  }
  const { token, sessionId, rating, chipIds } = parsed.data;

  try {
    const qr = await prisma.qrCode.findUnique({
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
            defaultAiProvider: true,
            isActive: true,
          },
        },
      },
    });
    if (!qr?.isActive || !qr.shop.isActive) {
      return NextResponse.json({ error: "This review link is no longer active." }, { status: 404 });
    }
    const { shop } = qr;

    const session = await prisma.reviewSession.findUnique({
      where: { id: sessionId },
      select: { qrCodeId: true },
    });
    if (session?.qrCodeId !== qr.id) {
      return NextResponse.json({ error: "Please scan the QR code again." }, { status: 403 });
    }

    const chips = await prisma.reviewChip.findMany({
      where: { id: { in: chipIds }, shopId: shop.id, isActive: true },
      select: { id: true, label: true },
    });
    if (chips.length !== chipIds.length) {
      return NextResponse.json({ error: "Those options changed. Please refresh and try again." }, { status: 400 });
    }
    const labels = chipIds.map((id) => chips.find((chip) => chip.id === id)!.label);

    const language = (LANGUAGES.includes(shop.defaultLanguage) ? shop.defaultLanguage : "en") as ReviewLanguage;
    const input: GenerateReviewDraftInput = {
      shopId: shop.id,
      sessionId,
      shopName: shop.name,
      businessCategory: shop.businessCategory,
      rating,
      chips: labels,
      style: "natural",
      language,
    };
    const template = aiRouter.generateSafeFallbackDraft(input);

    // The lock and reserved row make the AI limits hold under parallel requests.
    const reservation = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${shop.id}::text, 0))`;
      const sessionDrafts = await tx.reviewDraft.count({ where: { sessionId } });
      if (sessionDrafts >= MAX_DRAFTS_PER_SESSION) return null;

      const shopDrafts = await tx.reviewDraft.count({
        where: { shopId: shop.id, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      });
      const reserved = await tx.reviewDraft.create({
        data: {
          sessionId,
          shopId: shop.id,
          customerNotes: `Rating ${rating}: ${labels.join(", ")}`,
          generatedText: template.draftText,
          provider: template.provider,
          model: template.model,
          language,
          style: "natural",
        },
        select: { id: true },
      });
      return { id: reserved.id, useAi: shopDrafts < MAX_DRAFTS_PER_SHOP_PER_HOUR };
    });
    if (!reservation) {
      return NextResponse.json({ error: "You have reached the rewrite limit. Edit this draft or post it." }, { status: 429 });
    }

    let result = template;
    if (reservation.useAi) {
      try {
        const generated = await aiRouter.generateReviewDraft(
          input,
          PROVIDERS.includes(shop.defaultAiProvider)
            ? { preferredProvider: shop.defaultAiProvider as AIProviderId }
            : undefined
        );
        await prisma.reviewDraft.update({
          where: { id: reservation.id },
          data: { generatedText: generated.draftText, provider: generated.provider, model: generated.model },
        });
        result = generated;
      } catch (error) {
        console.error("[API:Review:Generate] Using template draft", error);
      }
    }

    await prisma.analyticsEvent
      .create({
        data: {
          shopId: shop.id,
          qrCodeId: qr.id,
          sessionId,
          eventType: "draft_generated",
          metadata: { draftId: reservation.id, rating, chipIds, provider: result.provider, isFallback: result.isFallback },
        },
      })
      .catch((error: unknown) => console.error("[API:Review:Generate] Analytics failed", error));

    return NextResponse.json({ draftId: reservation.id, draftText: result.draftText });
  } catch (error) {
    console.error("[API:Review:Generate]", error);
    return NextResponse.json({ error: "Could not write your review right now. Please try again." }, { status: 503 });
  }
}
