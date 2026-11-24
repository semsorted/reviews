import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { publicAppUrl } from "@/lib/admin/api";
import { requireAdminPage } from "@/lib/auth/guard";
import { NewRestaurantForm } from "./NewRestaurantForm";

export const metadata = { title: "Add restaurant" };

export default async function NewRestaurantPage() {
  await requireAdminPage();
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/admin/restaurants" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-moss hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> Restaurants
      </Link>
      <h1 className="mb-2 mt-2 text-[2.35rem] font-bold">Add a restaurant</h1>
      <p className="mb-6 text-moss">This makes the business, its Google review QR, turns table ordering on and creates the owner&rsquo;s login in one step.</p>
      <NewRestaurantForm loginUrl={publicAppUrl("/restaurant/login")} />
    </div>
  );
}
