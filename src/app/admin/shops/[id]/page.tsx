import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isUuid, publicQrUrl } from "@/lib/admin/api";
import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { ChipManager } from "../../_components/ChipManager";
import { QrManager } from "../../_components/QrManager";
import { ShopForm } from "../../_components/ShopForm";

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      chips: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      qrCodes: { orderBy: { createdAt: "desc" } },
      _count: { select: { reviewDrafts: true } },
    },
  });
  if (!shop) notFound();

  const [copies, googleClicks] = await Promise.all([
    prisma.reviewDraft.count({ where: { shopId: id, isCopied: true } }),
    prisma.analyticsEvent.count({ where: { shopId: id, eventType: "google_review_click" } }),
  ]);
  const scans = shop.qrCodes.reduce((total, qr) => total + qr.scanCount, 0);
  const stats = [
    ["Scans", scans],
    ["Drafts", shop._count.reviewDrafts],
    ["Copied", copies],
    ["Sent to Google", googleClicks],
  ] as const;

  return (
    <>
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-moss hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> Shops
      </Link>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-[2.35rem] font-bold">{shop.name}</h1>
        <span className={`font-semibold ${shop.isActive ? "text-pine" : "text-moss"}`}>
          {shop.isActive ? "Live" : "Paused"}
        </span>
      </div>
      <p className="mt-1 text-moss">{shop.businessCategory}</p>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-line py-4 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-moss">{label}</dt>
            <dd className="font-display text-2xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-10">
          <QrManager
            shopId={shop.id}
            qrCodes={shop.qrCodes.map((qr) => ({
              id: qr.id,
              name: qr.name,
              url: publicQrUrl(qr.publicToken),
              scanCount: qr.scanCount,
              isActive: qr.isActive,
            }))}
          />
          <ChipManager
            shopId={shop.id}
            shopType={shop.businessCategory}
            chips={shop.chips.map((chip) => ({ id: chip.id, label: chip.label, isActive: chip.isActive }))}
          />
        </div>
        <aside aria-labelledby="details-title">
          <h2 id="details-title" className="mb-4 text-2xl font-semibold">
            Shop details
          </h2>
          <ShopForm
            key={shop.updatedAt.toISOString()}
            shop={{
              id: shop.id,
              name: shop.name,
              businessCategory: shop.businessCategory,
              googleReviewUrl: shop.googleReviewUrl,
              defaultLanguage: shop.defaultLanguage,
              logoUrl: shop.logoUrl ?? "",
              primaryColor: shop.primaryColor,
              isActive: shop.isActive,
            }}
          />
        </aside>
      </div>
    </>
  );
}
