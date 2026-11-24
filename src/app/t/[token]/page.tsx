import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { guestStatus } from "@/lib/ordering/guest-view";
import { findOrderingTable } from "@/lib/ordering/service";
import { prisma } from "@/lib/prisma";
import OrderClient from "./OrderClient";

export const viewport: Viewport = { themeColor: "#ffffff" };

export async function generateMetadata(props: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const found = await findOrderingTable((await props.params).token);
  return { title: { absolute: found ? `Order at ${found.shop.name}` : "Table not taking orders" }, robots: { index: false, follow: false } };
}

export default async function TableOrderPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const found = await findOrderingTable(token);
  if (!found) notFound();

  const [categories, status] = await Promise.all([
    prisma.menuCategory.findMany({
      where: { shopId: found.shop.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        nameHi: true,
        items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, name: true, nameHi: true, pricePaise: true, isVeg: true, isAvailable: true } },
      },
    }),
    guestStatus(found),
  ]);

  return (
    <OrderClient
      token={token}
      tableLabel={found.table.label}
      shop={{ name: found.shop.name, logoUrl: found.shop.logoUrl, primaryColor: found.shop.primaryColor }}
      gstRateBp={found.settings.gstRateBp}
      menu={categories.filter((category) => category.items.length > 0)}
      initial={status}
    />
  );
}
