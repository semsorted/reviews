import { indiaDayKey } from "@/lib/subscription";
import { changePercent, dayLabel, monthLabel } from "./report-core";

/** One payment received: a restaurant plan payment, or one QR business sold at the QR price. */
export type Sale = { id: string; shopId: string; name: string; detail: string; amount: number; at: Date };
export type Point = { day: string; label: string; amount: number };
export type PaidBusiness = { shopId: string; name: string; payments: number; total: number; lastPaid: Date };

const monthOf = (date: Date) => indiaDayKey(date).slice(0, 7);

/** Adds the sales up by month, by day and by business. `months` and `days` are the keys to chart, oldest first. */
export function buildSection(sales: Sale[], months: string[], days: string[]) {
  const sum = (keyOf: (sale: Sale) => string) => {
    const totals = new Map<string, number>();
    for (const sale of sales) totals.set(keyOf(sale), (totals.get(keyOf(sale)) ?? 0) + sale.amount);
    return totals;
  };
  const byMonth = sum((sale) => monthOf(sale.at));
  const byDay = sum((sale) => indiaDayKey(sale.at));
  const [thisMonth, lastMonth] = [byMonth.get(months.at(-1) ?? "") ?? 0, byMonth.get(months.at(-2) ?? "") ?? 0];

  const perBusiness = new Map<string, PaidBusiness>();
  for (const sale of sales) {
    const row = perBusiness.get(sale.shopId) ?? { shopId: sale.shopId, name: sale.name, payments: 0, total: 0, lastPaid: sale.at };
    row.payments += 1;
    row.total += sale.amount;
    if (sale.at > row.lastPaid) row.lastPaid = sale.at;
    perBusiness.set(sale.shopId, row);
  }

  return {
    thisMonth,
    lastMonth,
    change: changePercent(thisMonth, lastMonth),
    allTime: { amount: sales.reduce((total, sale) => total + sale.amount, 0), payments: sales.length, businesses: perBusiness.size },
    monthPoints: months.map((key): Point => ({ day: key, label: monthLabel(key), amount: byMonth.get(key) ?? 0 })),
    dayPoints: days.map((day): Point => ({ day, label: dayLabel(day), amount: byDay.get(day) ?? 0 })),
    businesses: [...perBusiness.values()].sort((a, b) => b.total - a.total),
    recent: [...sales].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 12),
  };
}

export type Section = ReturnType<typeof buildSection>;
