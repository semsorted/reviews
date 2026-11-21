import { randomUUID } from "node:crypto";
import { cache } from "react";
import { after } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata, Viewport } from "next";
import { prisma } from "@/lib/prisma";
import { toReviewLanguage } from "@/lib/reviews/instant-draft";
import { recordScan } from "@/lib/reviews/record-scan";
import { MIN_CHIPS } from "@/lib/reviews/rules";
import CustomerReviewClient from "./CustomerReviewClient";

export const viewport: Viewport = { themeColor: "#ffffff" };

const getReviewQr = cache(async (token: string) => {
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
          logoUrl: true,
          primaryColor: true,
          googleReviewUrl: true,
          defaultLanguage: true,
          isActive: true,
          chips: {
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: { id: true, label: true },
          },
        },
      },
    },
  });
  return qr?.isActive && qr.shop.isActive && qr.shop.chips.length >= MIN_CHIPS ? qr : null;
});

export async function generateMetadata(props: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await props.params;
  const qr = await getReviewQr(token);
  return {
    title: { absolute: qr ? `Review ${qr.shop.name}` : "Review link unavailable" },
    robots: { index: false, follow: false },
  };
}

export default async function CustomerReviewPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const qr = await getReviewQr(token);
  if (!qr) notFound();

  const sessionId = randomUUID();
  const { id: qrCodeId, shop } = qr;

  // Stats are saved after the response, so the customer never waits for them.
  after(async () => {
    try {
      await recordScan({ shopId: shop.id, qrCodeId, sessionId });
    } catch (error) {
      console.error("[Review:Scan] Could not record scan", error);
    }
  });

  return (
    <CustomerReviewClient
      token={token}
      sessionId={sessionId}
      language={toReviewLanguage(shop.defaultLanguage)}
      shop={{
        name: shop.name,
        businessCategory: shop.businessCategory,
        logoUrl: shop.logoUrl,
        primaryColor: shop.primaryColor,
        googleReviewUrl: shop.googleReviewUrl,
      }}
      chips={shop.chips}
    />
  );
}
