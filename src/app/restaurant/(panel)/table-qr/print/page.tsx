import { TableQrSheets } from "@/components/ordering/TableQrSheets";
import { CAN } from "@/lib/ordering/staff-auth";
import { requireStaffPage } from "@/lib/ordering/staff-page";

export const metadata = { title: "Print table QR" };

export default async function PrintTableQrPage({ searchParams }: { searchParams: Promise<{ size?: string | string[] }> }) {
  const staff = await requireStaffPage(CAN.manageTables);
  return <TableQrSheets shopId={staff.shopId} size={(await searchParams).size} pagePath="/restaurant/table-qr/print" backHref="/restaurant/table-qr" backLabel="Tables and QR" />;
}
