import { billUpiUrl } from "@/lib/ordering/bill";

export type PlanPeriod = "month" | "year";
export const PERIOD_MONTHS: Record<PlanPeriod, number> = { month: 1, year: 12 };
export const PERIOD_LABEL: Record<PlanPeriod, string> = { month: "1 month", year: "1 year" };
export const PAY_METHODS = ["UPI", "CASH", "BANK"] as const;
export type PayMethod = (typeof PAY_METHODS)[number];
/** A new restaurant can try everything for this many days before the first payment. */
export const TRIAL_DAYS = 14;

export const parsePeriod = (value: unknown): PlanPeriod => (value === "month" ? "month" : "year");

type Prices = { monthlyPrice: number; yearlyPrice: number };
export const priceFor = (plan: Prices, period: PlanPeriod) => (period === "month" ? plan.monthlyPrice : plan.yearlyPrice);
/** What a year costs against paying monthly for 12 months, in whole rupees. */
export const yearlySaving = (plan: Prices) => Math.max(plan.monthlyPrice * 12 - plan.yearlyPrice, 0);

/** The UPI link a restaurant scans to pay Semsorted. Null when no payment UPI is set up. */
export const planUpiUrl = (base: string | undefined, amountRupees: number, shopName: string) =>
  billUpiUrl(base?.trim(), amountRupees * 100, "", `Semsorted ${shopName}`.replace(/[^\w ]+/g, "").slice(0, 40));
