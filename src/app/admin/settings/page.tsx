import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { PosterSettings } from "../_components/PosterSettings";
import { RestaurantPlanSettings } from "../_components/RestaurantPlanSettings";
import { PageHead } from "../_components/TrackingBlocks";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdminPage();
  const [pricing, coupons, plans] = await Promise.all([
    prisma.posterPricing.findUniqueOrThrow({ where: { id: 1 }, select: { normalPrice: true, customPrice: true } }),
    prisma.posterCoupon.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, code: true, amountOff: true, isActive: true } }),
    prisma.restaurantPlan.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, summary: true, monthlyPrice: true, yearlyPrice: true } }),
  ]);

  return (
    <div className="space-y-5">
      <PageHead title="Settings" text="Set poster prices, coupon codes and restaurant plan prices. Only you can see this page." />
      <PosterSettings pricing={pricing} coupons={coupons} />
      <RestaurantPlanSettings plans={plans} />
    </div>
  );
}
