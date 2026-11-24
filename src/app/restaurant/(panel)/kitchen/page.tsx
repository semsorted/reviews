import { MenuSwitches } from "@/components/ordering/MenuSwitches";
import { StaffBoard } from "@/components/ordering/StaffBoard";
import { CAN } from "@/lib/ordering/staff-auth";
import { canFor, menuFor, requireStaffPage } from "@/lib/ordering/staff-page";
import { staffBoard } from "@/lib/ordering/staff-view";

export const metadata = { title: "Kitchen" };

export default async function KitchenPage() {
  const staff = await requireStaffPage(CAN.cook);
  const can = canFor(staff.role);
  const [board, menu] = await Promise.all([staffBoard(staff), can.toggleDish ? menuFor(staff.shopId) : []]);
  return (
    <div className="space-y-5">
      <h1 className="sr-only">Kitchen</h1>
      <StaffBoard initial={board} shopName={staff.shopName} can={can} />
      {can.toggleDish && <MenuSwitches sections={menu.filter((section) => section.items.length > 0)} />}
    </div>
  );
}
