import { SalesReport } from "@/components/ordering/SalesReport";
import { CAN } from "@/lib/ordering/staff-auth";
import { requireStaffPage } from "@/lib/ordering/staff-page";

export const metadata = { title: "Sales" };

export default async function SalesPage() {
  const staff = await requireStaffPage(CAN.seeSales);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sales</h1>
      <SalesReport shopId={staff.shopId} />
    </div>
  );
}
