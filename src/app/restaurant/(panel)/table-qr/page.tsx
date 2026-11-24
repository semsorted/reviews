import { TablesPanel } from "@/components/ordering/manage/TablesPanel";
import { CAN } from "@/lib/ordering/staff-auth";
import { requireStaffPage, tablesFor } from "@/lib/ordering/staff-page";

export const metadata = { title: "Table QR" };

export default async function TableQrPage() {
  const staff = await requireStaffPage(CAN.manageTables);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tables and QR</h1>
      <TablesPanel apiBase="/api/restaurant" printHref="/restaurant/table-qr/print" tables={await tablesFor(staff.shopId)} />
    </div>
  );
}
