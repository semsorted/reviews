import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getOverview } from "@/lib/admin/tracking";
import { requireAdminPage } from "@/lib/auth/guard";
import { ShopGrid } from "../_components/ShopGrid";
import { PageHead } from "../_components/TrackingBlocks";

export const metadata = { title: "Businesses" };

export default async function ShopsPage() {
  await requireAdminPage();
  const [overview, restaurants] = await Promise.all([getOverview("all"), prisma.orderingSettings.findMany({ select: { shopId: true } })]);
  // Restaurants have their own section, with their review QR and poster inside it.
  const restaurantIds = new Set(restaurants.map((row) => row.shopId));
  const shops = overview.shops.filter((shop) => !restaurantIds.has(shop.id));

  return (
    <div className="space-y-5">
      <PageHead
        title="Businesses"
        text={`${shops.length} ${shops.length === 1 ? "business" : "businesses"}. Tap one to open it.`}
        action={<Link href="/admin/shops/new" className={buttonVariants()}><Plus aria-hidden className="size-4" /> Add business</Link>}
      />
      {shops.length ? <ShopGrid shops={shops} /> : <p className="rounded-2xl bg-paper p-6 text-moss">No businesses yet. Add your first one to create its QR poster.</p>}
    </div>
  );
}
