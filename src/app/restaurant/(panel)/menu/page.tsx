import { MenuEditor } from "@/components/ordering/manage/MenuEditor";
import { CAN } from "@/lib/ordering/staff-auth";
import { menuFor, requireStaffPage } from "@/lib/ordering/staff-page";

export const metadata = { title: "Menu" };

export default async function MenuPage() {
  const staff = await requireStaffPage(CAN.manageMenu);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Menu</h1>
      <MenuEditor apiBase="/api/restaurant" sections={await menuFor(staff.shopId)} />
    </div>
  );
}
