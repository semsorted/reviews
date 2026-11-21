import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MIN_CHIPS } from "@/lib/reviews/rules";
import { generateToken } from "@/lib/utils";
import CustomerReviewClient from "./CustomerReviewClient";

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
    title: qr ? `Review ${qr.shop.name}` : "Review link unavailable",
    robots: { index: false, follow: false },
  };
}

export default async function CustomerReviewPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const qr = await getReviewQr(token);
  if (!qr) notFound();

  const session = await prisma.$transaction(async (tx) => {
    await tx.qrCode.update({ where: { id: qr.id }, data: { scanCount: { increment: 1 } } });
    const created = await tx.reviewSession.create({
      data: { shopId: qr.shop.id, qrCodeId: qr.id, anonymousSessionId: `anon_${generateToken(18)}` },
      select: { id: true },
    });
    await tx.analyticsEvent.createMany({
      data: ["qr_scan", "page_view"].map((eventType) => ({
        shopId: qr.shop.id,
        qrCodeId: qr.id,
        sessionId: created.id,
        eventType,
      })),
    });
    return created;
  });

  const { chips, ...shop } = qr.shop;

  return (
    <CustomerReviewClient
      token={token}
      sessionId={session.id}
      shop={{
        name: shop.name,
        businessCategory: shop.businessCategory,
        logoUrl: shop.logoUrl,
        primaryColor: shop.primaryColor,
        googleReviewUrl: shop.googleReviewUrl,
      }}
      chips={chips}
    />
  );
}
