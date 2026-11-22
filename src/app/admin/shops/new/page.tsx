import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/auth/guard";
import { ShopForm } from "../../_components/ShopForm";

export default async function NewShopPage() {
  await requireAdminPage();

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/admin/shops" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-moss hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> Businesses
      </Link>
      <h1 className="mb-6 mt-2 text-[2.35rem] font-bold">Add a business</h1>
      <ShopForm />
    </div>
  );
}
