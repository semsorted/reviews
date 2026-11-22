import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getOverview } from "@/lib/admin/tracking";
import { requireAdminPage } from "@/lib/auth/guard";
import { ShopGrid } from "../_components/ShopGrid";
import { PageHead } from "../_components/TrackingBlocks";

export const metadata = { title: "Shops" };

export default async function ShopsPage() {
  await requireAdminPage();
  const { shops } = await getOverview("all");

  return (
    <div className="space-y-5">
      <PageHead
        title="Shops"
        text={`${shops.length} ${shops.length === 1 ? "shop" : "shops"}. Open tracking, or manage QR codes and chips.`}
        action={<Link href="/admin/shops/new" className={buttonVariants()}><Plus aria-hidden className="size-4" /> Add shop</Link>}
      />
      {shops.length ? <ShopGrid shops={shops} /> : <p className="rounded-2xl bg-paper p-6 text-moss">No shops yet. Add your first shop to create its QR code.</p>}
    </div>
  );
}
