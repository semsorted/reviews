import { BillSettings } from "@/components/ordering/manage/BillSettings";
import { CAN } from "@/lib/ordering/staff-auth";
import { requireStaffPage } from "@/lib/ordering/staff-page";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Bill settings" };

export default async function BillPage() {
  const staff = await requireStaffPage(CAN.billSettings);
  const settings = await prisma.orderingSettings.findUniqueOrThrow({ where: { shopId: staff.shopId }, select: { gstin: true, gstRateBp: true, fssai: true, upiUrl: true } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bill settings</h1>
      <BillSettings saveUrl="/api/restaurant/settings" bill={{ gstin: settings.gstin ?? "", gstRateBp: settings.gstRateBp, fssai: settings.fssai ?? "", upiUrl: settings.upiUrl ?? "" }} />
    </div>
  );
}
