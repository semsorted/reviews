import { publicAppUrl } from "@/lib/admin/api";
import { CAN } from "@/lib/ordering/staff-auth";
import { canFor, menuFor, requireStaffPage } from "@/lib/ordering/staff-page";
import { staffBoard } from "@/lib/ordering/staff-view";
import { prisma } from "@/lib/prisma";
import { TablesClient } from "./TablesClient";

export const metadata = { title: "Tables" };

export default async function TablesPage() {
  const staff = await requireStaffPage(CAN.takeOrder);
  const [tables, menu, board] = await Promise.all([
    prisma.diningTable.findMany({ where: { shopId: staff.shopId, isActive: true }, orderBy: { createdAt: "asc" }, select: { id: true, label: true, publicToken: true } }),
    menuFor(staff.shopId),
    staffBoard(staff),
  ]);
  return (
    <>
      <h1 className="sr-only">Tables</h1>
      <TablesClient
        tables={tables.map((table) => ({ id: table.id, label: table.label, guestUrl: publicAppUrl(`/t/${table.publicToken}`) }))}
        menu={menu.filter((section) => section.items.length > 0)}
        initial={board}
        can={canFor(staff.role)}
      />
    </>
  );
}
