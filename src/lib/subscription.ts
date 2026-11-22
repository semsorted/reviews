export const RENEWAL_WARNING_DAYS = 30;

const DAY_MS = 86_400_000;
const INDIA_OFFSET_MS = 330 * 60_000;

export type SubscriptionState = "active" | "ending" | "expired";
export interface SubscriptionInfo {
  state: SubscriptionState;
  daysLeft: number;
  label: string;
  endsOn: string;
  endsAt: string;
}

const india = (date: Date) => new Date(date.getTime() + INDIA_OFFSET_MS);
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

export const indiaDayKey = (date = new Date()) => india(date).toISOString().slice(0, 10);
export const formatEndDate = (date: Date) =>
  date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

export const isSubscribed = (endsAt: Date, now = new Date()) => endsAt.getTime() > now.getTime();

function timeLeft(endsAt: Date, now: Date): string {
  const [from, to] = [india(now), india(endsAt)];
  const [fromYear, fromMonth, fromDay] = [from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()];
  const [toYear, toMonth, toDay] = [to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()];
  let months = (toYear - fromYear) * 12 + toMonth - fromMonth;
  if (toDay < fromDay) months--;
  const anchor = Date.UTC(fromYear, fromMonth + months, Math.min(fromDay, daysInMonth(fromYear, fromMonth + months)));
  const days = (Date.UTC(toYear, toMonth, toDay) - anchor) / DAY_MS;
  const parts = [
    [Math.floor(months / 12), "year"],
    [months % 12, "month"],
    [days, "day"],
  ] as const;
  const text = parts.filter(([count]) => count > 0).map(([count, word]) => plural(count, word)).join(" ");
  return text ? `${text} left` : "Ends today";
}

export function subscriptionInfo(endsAt: Date, now = new Date()): SubscriptionInfo {
  const daysLeft = Math.floor(india(endsAt).getTime() / DAY_MS) - Math.floor(india(now).getTime() / DAY_MS);
  const expired = !isSubscribed(endsAt, now);
  return {
    state: expired ? "expired" : daysLeft <= RENEWAL_WARNING_DAYS ? "ending" : "active",
    daysLeft: Math.max(daysLeft, 0),
    label: expired ? "Expired" : timeLeft(endsAt, now),
    endsOn: formatEndDate(endsAt),
    endsAt: endsAt.toISOString(),
  };
}

/** An early renewal keeps the unused time. An expired business restarts from today. */
export function renewedEnd(endsAt: Date, now = new Date()): Date {
  const next = india(isSubscribed(endsAt, now) ? endsAt : now);
  const month = next.getUTCMonth();
  next.setUTCFullYear(next.getUTCFullYear() + 1);
  if (next.getUTCMonth() !== month) next.setUTCDate(0);
  return new Date(next.getTime() - INDIA_OFFSET_MS);
}
