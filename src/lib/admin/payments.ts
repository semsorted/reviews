import { prisma } from "@/lib/prisma";
import { indiaDayKey } from "@/lib/subscription";
import { changePercent, monthKeys, monthLabel } from "./report-core";
import { chartDays, dayKeys, type TrackingRange } from "./tracking-core";

export type PaymentDay = { day: string; label: string; amount: number };
export type PaidBusiness = { shopId: string; name: string; payments: number; total: number; lastPaid: Date };

const dayLabel = (day: string) => new Date(`${day}T12:00:00+05:30`).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

export async function getPayments(range: TrackingRange) {
  const months = monthKeys(6);
  const [thisMonth, lastMonth] = [months[5], months[4]];
  const days = dayKeys(chartDays(range));
  const monthsFrom = new Date(`${months[0]}-01T00:00:00+05:30`);
  const daysFrom = new Date(`${days[0]}T00:00:00+05:30`);

  const [monthly, daily, totals, perBusiness, recent, added] = await Promise.all([
    prisma.$queryRaw<{ month: string; amount: number; payments: number }[]>`
      SELECT to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') AS month, SUM(amount)::int AS amount, COUNT(*)::int AS payments
      FROM public.shop_payments WHERE created_at >= ${monthsFrom}::timestamptz GROUP BY 1`,
    prisma.$queryRaw<{ day: string; amount: number }[]>`
      SELECT to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day, SUM(amount)::int AS amount
      FROM public.shop_payments WHERE created_at >= ${daysFrom}::timestamptz GROUP BY 1`,
    prisma.shopPayment.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.shopPayment.groupBy({ by: ["shopId"], _sum: { amount: true }, _count: { _all: true }, _max: { createdAt: true }, orderBy: { _sum: { amount: "desc" } } }),
    prisma.shopPayment.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, receiptNo: true, planName: true, months: true, amount: true, method: true, createdAt: true, shop: { select: { name: true } } },
    }),
    prisma.$queryRaw<{ month: string; added: number }[]>`
      SELECT to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') AS month, COUNT(*)::int AS added
      FROM public.shops WHERE created_at >= ${monthsFrom}::timestamptz GROUP BY 1`,
  ]);
  const names = new Map((await prisma.shop.findMany({ where: { id: { in: perBusiness.map((row) => row.shopId) } }, select: { id: true, name: true } })).map((shop) => [shop.id, shop.name]));

  const amountIn = (month: string) => monthly.find((row) => row.month === month)?.amount ?? 0;
  const monthPoints: PaymentDay[] = months.map((key) => ({ day: key, label: monthLabel(key), amount: amountIn(key) }));
  const dayPoints: PaymentDay[] = days.map((day) => ({ day, label: dayLabel(day), amount: daily.find((row) => row.day === day)?.amount ?? 0 }));
  const businesses: PaidBusiness[] = perBusiness.map((row) => ({
    shopId: row.shopId,
    name: names.get(row.shopId) ?? "Deleted business",
    payments: row._count._all,
    total: row._sum.amount ?? 0,
    lastPaid: row._max.createdAt ?? new Date(0),
  }));

  return {
    today: indiaDayKey(),
    thisMonth: { label: monthLabel(thisMonth), amount: amountIn(thisMonth), added: added.find((row) => row.month === thisMonth)?.added ?? 0 },
    lastMonth: { label: monthLabel(lastMonth), amount: amountIn(lastMonth), added: added.find((row) => row.month === lastMonth)?.added ?? 0 },
    change: changePercent(amountIn(thisMonth), amountIn(lastMonth)),
    allTime: { amount: totals._sum.amount ?? 0, payments: totals._count, businesses: perBusiness.length },
    monthPoints,
    dayPoints,
    businesses,
    recent,
  };
}
