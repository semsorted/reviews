import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { ShopList, type ShopRow } from "./_components/ShopList";

export default async function AdminPage() {
  await requireAdminPage();

  // ponytail: loads every shop for instant search; add server pagination past a few hundred shops.
  const [shops, clicks] = await Promise.all([
    prisma.shop.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        businessCategory: true,
        isActive: true,
        qrCodes: { select: { scanCount: true } },
        _count: { select: { reviewDrafts: true } },
      },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["shopId"],
      where: { eventType: "google_review_click" },
      _count: { _all: true },
    }),
  ]);

  const clicksByShop = new Map(clicks.map((row) => [row.shopId, row._count._all]));
  const rows: ShopRow[] = shops.map((shop) => ({
    id: shop.id,
    name: shop.name,
    businessCategory: shop.businessCategory,
    isActive: shop.isActive,
    qrCount: shop.qrCodes.length,
    scans: shop.qrCodes.reduce((total, qr) => total + qr.scanCount, 0),
    drafts: shop._count.reviewDrafts,
    googleClicks: clicksByShop.get(shop.id) ?? 0,
  }));
  const totalScans = rows.reduce((total, shop) => total + shop.scans, 0);
  const totalClicks = rows.reduce((total, shop) => total + shop.googleClicks, 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2.35rem] font-bold">Shops</h1>
          {rows.length > 0 && (
            <p className="mt-1 text-moss">
              {rows.length} {rows.length === 1 ? "shop" : "shops"}, {totalScans} {totalScans === 1 ? "scan" : "scans"},{" "}
              {totalClicks} sent to Google
            </p>
          )}
        </div>
        <Link href="/admin/shops/new" className={buttonVariants()}>
          <Plus aria-hidden className="size-4" /> Add shop
        </Link>
      </div>

      {rows.length > 0 ? (
        <ShopList shops={rows} />
      ) : (
        <div className="mt-8 rounded-xl bg-paper p-8">
          <h2 className="text-2xl font-semibold">Add your first shop</h2>
          <p className="mt-2 max-w-md text-moss">
            Enter the shop details and its chips. Its first QR code is created automatically.
          </p>
          <Link href="/admin/shops/new" className={`${buttonVariants()} mt-5`}>
            Add shop
          </Link>
        </div>
      )}
    </>
  );
}
