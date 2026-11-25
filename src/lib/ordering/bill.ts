import { upiPayee } from "@/lib/qr/upi";

/** All money is whole paise. Menu prices are before GST. */
export type BillLine = { pricePaise: number; qty: number };
export const GST_RATES = [0, 500, 1800] as const;
export type GstRateBp = (typeof GST_RATES)[number];
export const MAX_PRICE_PAISE = 10_000_000;

export function billTotals(lines: BillLine[], gstRateBp: number) {
  const subtotal = lines.reduce((sum, line) => sum + line.pricePaise * line.qty, 0);
  // CGST and SGST are each half of the rate, so both lines always match.
  const cgst = Math.round((subtotal * gstRateBp) / 20_000);
  const beforeRounding = subtotal + cgst * 2;
  const total = Math.round(beforeRounding / 100) * 100;
  return { subtotal, cgst, sgst: cgst, roundOff: total - beforeRounding, total };
}

/** Indian financial year (April to March, India time), named by its starting year. */
export function financialYear(date = new Date()) {
  const india = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return india.getUTCMonth() >= 3 ? india.getUTCFullYear() : india.getUTCFullYear() - 1;
}

const twoDigits = (year: number) => String(year % 100).padStart(2, "0");
export const billNumber = (fy: number, no: number) => `${twoDigits(fy)}-${twoDigits(fy + 1)}/${String(no).padStart(6, "0")}`;

export function rupeesToPaise(text: string): number | null {
  const match = /^(\d{1,6})(?:\.(\d{1,2}))?$/.exec(text.trim());
  if (!match) return null;
  const paise = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return paise <= MAX_PRICE_PAISE ? paise : null;
}

export function formatPaise(paise: number) {
  const fraction = paise % 100 === 0 ? 0 : 2;
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: fraction, maximumFractionDigits: fraction })}`;
}

/** The restaurant's own UPI link with this bill's amount and number filled in. */
export function billUpiUrl(base: string | null | undefined, totalPaise: number, billNo: string, note = `Bill ${billNo}`): string | null {
  if (!base || upiPayee(base) === null) return null;
  const params = new URLSearchParams(base.slice("upi://pay?".length));
  params.set("am", (totalPaise / 100).toFixed(2));
  params.set("cu", "INR");
  params.set("tn", note);
  // Some UPI apps only read the payee address with a plain "@", so keep it unescaped.
  return `upi://pay?${[...params].map(([key, value]) => `${key}=${encodeURIComponent(value).replaceAll("%40", "@")}`).join("&")}`;
}
