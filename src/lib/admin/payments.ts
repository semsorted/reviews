import { prisma } from "@/lib/prisma";
import { buildSection, type Sale } from "./payments-core";
import { monthKeys, monthLabel } from "./report-core";
import { chartDays, dayKeys, type TrackingRange } from "./tracking-core";

/**
 * Restaurants: the plan payments confirmed on the Plan tab.
 * QR businesses: no payment is recorded for them, so each one counts once at the price saved with it, on the day it was added.
 * A business without a saved price (should not happen once the migration ran) falls back to the Normal poster price.
 * ponytail: loads every sale and adds up in memory. Move to SQL sums past a few thousand businesses.
 */
export async function getPayments(range: TrackingRange) {
  const months = monthKeys(6);
  const days = dayKeys(chartDays(range));
  const [payments, enabled, pricing] = await Promise.all([
    prisma.shopPayment.findMany({ select: { id: true, shopId: true, planName: true, months: true, method: true, amount: true, createdAt: true, shop: { select: { name: true } } } }),
    prisma.orderingSettings.findMany({ where: { isEnabled: true }, select: { shopId: true } }),
    prisma.posterPricing.findUniqueOrThrow({ where: { id: 1 }, select: { normalPrice: true } }),
  ]);
  const qrShops = await prisma.shop.findMany({ where: { id: { notIn: enabled.map((row) => row.shopId) } }, select: { id: true, name: true, businessCategory: true, createdAt: true, qrPrice: true } });

  const restaurantSales: Sale[] = payments.map((payment) => ({
    id: payment.id,
    shopId: payment.shopId,
    name: payment.shop.name,
    detail: `${payment.planName} · ${payment.months} ${payment.months === 1 ? "month" : "months"} · ${payment.method}`,
    amount: payment.amount,
    at: payment.createdAt,
  }));
  const qrSales: Sale[] = qrShops.map((shop) => ({ id: shop.id, shopId: shop.id, name: shop.name, detail: `QR business · ${shop.businessCategory}`, amount: shop.qrPrice ?? pricing.normalPrice, at: shop.createdAt }));

  const restaurants = buildSection(restaurantSales, months, days);
  const qr = buildSection(qrSales, months, days);
  return {
    restaurants,
    qr,
    qrPrice: pricing.normalPrice,
    labels: { thisMonth: monthLabel(months.at(-1)!), lastMonth: monthLabel(months.at(-2)!) },
    combined: {
      thisMonth: restaurants.thisMonth + qr.thisMonth,
      lastMonth: restaurants.lastMonth + qr.lastMonth,
      allTime: restaurants.allTime.amount + qr.allTime.amount,
      businesses: restaurants.allTime.businesses + qr.allTime.businesses,
    },
  };
}
