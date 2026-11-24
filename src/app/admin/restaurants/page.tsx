import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SetUpOrdering } from "@/components/ordering/manage/BillSettings";
import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { indiaDayKey } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { PageHead } from "../_components/TrackingBlocks";

export const metadata = { title: "Restaurants" };

const count = (rows: { shopId: string; _count: { _all: number } }[]) => new Map(rows.map((row) => [row.shopId, row._count._all]));
const plural = (total: number, word: string) => `${total} ${word}${total === 1 ? "" : "s"}`;

export default async function RestaurantsPage() {
  await requireAdminPage();
  const todayStart = new Date(`${indiaDayKey()}T00:00:00+05:30`);
  const [shops, settings, tables, staff, today] = await Promise.all([
    prisma.shop.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, businessCategory: true } }),
    prisma.orderingSettings.findMany({ select: { shopId: true, isEnabled: true } }),
    prisma.diningTable.groupBy({ by: ["shopId"], where: { isActive: true }, _count: { _all: true } }),
    prisma.restaurantStaff.groupBy({ by: ["shopId"], where: { isActive: true }, _count: { _all: true } }),
    prisma.tableSession.groupBy({ by: ["shopId"], where: { createdAt: { gte: todayStart } }, _count: { _all: true } }),
  ]);
  const enabled = new Map(settings.map((row) => [row.shopId, row.isEnabled]));
  const [tableCount, staffCount, todayCount] = [count(tables), count(staff), count(today)];
  const restaurants = shops.filter((shop) => enabled.has(shop.id));
  const others = shops.filter((shop) => !enabled.has(shop.id));

  return (
    <div className="space-y-5">
      <PageHead
        title="Restaurants"
        text="Guests scan a table QR to order and pay. Each restaurant has its own staff logins for the owner, manager, kitchen and waiters."
        action={
          <Link href="/admin/restaurants/new" className={buttonVariants({ size: "lg", className: "sm:w-auto" })}>
            <Plus aria-hidden className="size-5" /> Add restaurant
          </Link>
        }
      />

      {restaurants.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-paper">
          {restaurants.map((shop) => {
            const isOn = enabled.get(shop.id);
            return (
              <li key={shop.id}>
                <Link href={`/admin/restaurants/${shop.id}`} className="flex min-h-16 items-center gap-3 px-5 py-3 hover:bg-mist">
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-semibold">{shop.name}</span>
                    <span className="block text-sm text-moss">
                      {shop.businessCategory}. {plural(tableCount.get(shop.id) ?? 0, "table")}, {plural(staffCount.get(shop.id) ?? 0, "staff login")}, {todayCount.get(shop.id) ?? 0} opened today
                    </span>
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", isOn ? "bg-g-green-tint text-g-green" : "bg-mist text-moss")}>{isOn ? "Ordering on" : "Off"}</span>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-moss" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-2xl bg-paper p-6 text-moss">No restaurants yet. Add one, or make an existing business a restaurant below.</p>
      )}

      {others.length > 0 && (
        <details className="group rounded-2xl bg-paper">
          <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-2 px-5 font-semibold">
            Make an existing business a restaurant <span className="text-sm font-medium text-moss">{others.length}</span>
          </summary>
          <ul className="divide-y divide-line border-t border-line">
            {others.map((shop) => (
              <li key={shop.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block break-words font-semibold">{shop.name}</span>
                  <span className="block text-sm text-moss">{shop.businessCategory}</span>
                </span>
                <SetUpOrdering shopId={shop.id} name={shop.name} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
