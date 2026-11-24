import { CAN, ROLE_LABEL } from "@/lib/ordering/staff-auth";
import { requireStaffPage } from "@/lib/ordering/staff-page";
import { LogoutButton, PanelNav } from "./PanelChrome";

const TABS = [
  { href: "/restaurant/orders", label: "Orders", roles: CAN.seeSales },
  { href: "/restaurant/kitchen", label: "Kitchen", roles: CAN.cook },
  { href: "/restaurant/tables", label: "Tables", roles: CAN.takeOrder },
  { href: "/restaurant/menu", label: "Menu", roles: CAN.manageMenu },
  { href: "/restaurant/table-qr", label: "Table QR", roles: CAN.manageTables },
  { href: "/restaurant/staff", label: "Staff", roles: CAN.manageStaff },
  { href: "/restaurant/bill", label: "Bill settings", roles: CAN.billSettings },
  { href: "/restaurant/sales", label: "Sales", roles: CAN.seeSales },
];

/** The restaurant's own panel. Each page also checks the role, since layouts do not re-run on navigation. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaffPage();
  const tabs = TABS.filter((tab) => (tab.roles as readonly string[]).includes(staff.role)).map(({ href, label }) => ({ href, label }));

  // Print styles hide this header and nav: they must stay direct children of this outer div.
  return (
    <div className="min-h-dvh bg-mist">
      <header className="bg-night text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold leading-tight">{staff.shopName}</p>
            <p className="truncate text-sm text-white/75">
              {staff.name}, {ROLE_LABEL[staff.role]}
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>
      {tabs.length > 1 && <PanelNav tabs={tabs} />}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <div>{children}</div>
      </main>
    </div>
  );
}
