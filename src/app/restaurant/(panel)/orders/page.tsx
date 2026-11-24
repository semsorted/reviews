import { StaffBoard } from "@/components/ordering/StaffBoard";
import { CAN } from "@/lib/ordering/staff-auth";
import { canFor, requireStaffPage } from "@/lib/ordering/staff-page";
import { staffBoard } from "@/lib/ordering/staff-view";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const staff = await requireStaffPage(CAN.seeSales);
  return (
    <>
      <h1 className="sr-only">Orders</h1>
      <StaffBoard initial={await staffBoard(staff)} shopName={staff.shopName} can={canFor(staff.role)} showTables />
    </>
  );
}
