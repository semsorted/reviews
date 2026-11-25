import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { ShopForm } from "../../_components/ShopForm";

export default async function NewShopPage() {
  await requireAdminPage();
  const { normalPrice } = await prisma.posterPricing.findUniqueOrThrow({ where: { id: 1 }, select: { normalPrice: true } });

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/admin/shops" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-moss hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> Businesses
      </Link>
      <h1 className="mb-6 mt-2 text-[2.35rem] font-bold">Add a business</h1>
      <ShopForm defaultPrice={normalPrice} />
    </div>
  );
}
