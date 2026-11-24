import { notFound } from "next/navigation";
import { TableQrSheets } from "@/components/ordering/TableQrSheets";
import { isUuid } from "@/lib/admin/api";
import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Table QR cards" };

export default async function TableCardsPage({ params, searchParams }: { params: Promise<{ shopId: string }>; searchParams: Promise<{ size?: string | string[] }> }) {
  await requireAdminPage();
  const { shopId } = await params;
  if (!isUuid(shopId)) notFound();
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { name: true } });
  if (!shop) notFound();
  const base = `/admin/restaurants/${shopId}`;
  return <TableQrSheets shopId={shopId} size={(await searchParams).size} pagePath={`${base}/tables/print`} backHref={`${base}?tab=tables`} backLabel={`${shop.name} tables`} />;
}
