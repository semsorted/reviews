import { StaffAccounts } from "@/components/ordering/manage/StaffAccounts";
import { CAN } from "@/lib/ordering/staff-auth";
import { requireStaffPage, staffFor } from "@/lib/ordering/staff-page";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const staff = await requireStaffPage(CAN.manageStaff);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Staff</h1>
      <StaffAccounts apiBase="/api/restaurant" accounts={await staffFor(staff.shopId)} selfId={staff.staffId} />
    </div>
  );
}
