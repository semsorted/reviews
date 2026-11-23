import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { PosterSettings } from "../_components/PosterSettings";
import { PageHead } from "../_components/TrackingBlocks";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdminPage();
  const [pricing, coupons] = await Promise.all([
    prisma.posterPricing.findUniqueOrThrow({ where: { id: 1 }, select: { normalPrice: true, customPrice: true } }),
    prisma.posterCoupon.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, code: true, amountOff: true, isActive: true } }),
  ]);

  return (
    <div className="space-y-5">
      <PageHead title="Settings" text="Set poster prices and coupon codes. Only you can see this page." />
      <PosterSettings pricing={pricing} coupons={coupons} />
    </div>
  );
}
