import Link from "next/link";
import { Printer, Receipt } from "lucide-react";
import { PlanPayment } from "@/components/ordering/manage/PlanPayment";
import { prisma } from "@/lib/prisma";
import { generateQrSvg } from "@/lib/qr/generator";
import { formatInr } from "@/lib/poster-pricing";
import { parsePeriod, PERIOD_LABEL, PERIOD_MONTHS, planUpiUrl, priceFor, yearlySaving } from "@/lib/restaurant-plans";
import { extendedEnd, formatEndDate, subscriptionInfo } from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { Panel } from "../../_components/TrackingBlocks";

const TONE = { active: "bg-g-green-tint text-g-green", ending: "bg-g-yellow-tint text-ink", expired: "bg-g-red-tint text-g-red" };
const svgSrc = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const pill = (active: boolean) => cn("inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold", active ? "bg-night text-white" : "text-moss hover:text-ink");

export async function PlanTab({ shopId, shopName, query }: { shopId: string; shopName: string; query: { plan?: string | string[]; period?: string | string[] } }) {
  const [shop, plans, payments] = await Promise.all([
    prisma.shop.findUniqueOrThrow({ where: { id: shopId }, select: { subscriptionEndsAt: true } }),
    prisma.restaurantPlan.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.shopPayment.findMany({ where: { shopId }, orderBy: { createdAt: "desc" }, take: 24 }),
  ]);
  const info = subscriptionInfo(shop.subscriptionEndsAt);
  const plan = plans.find((item) => item.id === query.plan) ?? plans[0];
  const period = parsePeriod(query.period);
  const base = `/admin/restaurants/${shopId}`;
  const link = (planId: string, per: string) => `${base}?tab=plan&plan=${planId}&period=${per}`;
  const upi = plan ? planUpiUrl(process.env.PAYMENT_UPI_URL, priceFor(plan, period), shopName) : null;
  const qr = upi ? svgSrc(await generateQrSvg({ url: upi, margin: 4 })) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="min-w-0 space-y-5">
        <section aria-label="Plan status" className={cn("rounded-2xl p-5", TONE[info.state])}>
          <p className="text-2xl font-semibold leading-tight text-ink">{info.state === "expired" ? "Plan ended" : info.label}</p>
          <p className="mt-1 text-sm text-ink/75">
            {info.state === "expired" ? `Ended ${info.endsOn}. Ordering and the review QR are stopped until the next payment.` : `Active until ${info.endsOn}.`}
          </p>
        </section>

        <Panel title="Payment history">
          {payments.length ? (
            <ul className="divide-y divide-line">
              {payments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{formatInr(payment.amount)} <span className="font-normal text-moss">{payment.planName}, {payment.months === 12 ? "1 year" : "1 month"}</span></span>
                    <span className="block text-sm text-moss">
                      {formatEndDate(payment.createdAt)} by {payment.method === "UPI" ? "UPI" : payment.method === "CASH" ? "cash" : "bank transfer"}. Valid till {formatEndDate(payment.periodTo)}.
                    </span>
                  </span>
                  <a href={`${base}/print?receipt=${payment.id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-pine hover:underline">
                    <Receipt aria-hidden className="size-4" /> Receipt
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-moss">No payment yet. This restaurant is on its free trial.</p>
          )}
        </Panel>
      </div>

      <Panel title="Collect payment" className="h-fit">
        {plan ? (
          <div className="space-y-4">
            <nav aria-label="Plan" className="grid gap-2">
              {plans.map((item) => (
                <Link key={item.id} href={link(item.id, period)} replace scroll={false} aria-current={item.id === plan.id ? "page" : undefined}
                  className={cn("rounded-xl border-2 p-3", item.id === plan.id ? "border-night bg-mist" : "border-line hover:border-moss")}>
                  <span className="block font-semibold">{item.name}</span>
                  <span className="block text-sm text-moss">{item.summary}</span>
                </Link>
              ))}
            </nav>
            <nav aria-label="Period" className="inline-flex rounded-full bg-paper p-1 ring-1 ring-line">
              <Link href={link(plan.id, "month")} replace scroll={false} className={pill(period === "month")}>Monthly {formatInr(plan.monthlyPrice)}</Link>
              <Link href={link(plan.id, "year")} replace scroll={false} className={pill(period === "year")}>Yearly {formatInr(plan.yearlyPrice)}</Link>
            </nav>
            {period === "year" && yearlySaving(plan) > 0 && <p className="text-sm font-semibold text-g-green">Yearly saves {formatInr(yearlySaving(plan))} against 12 months.</p>}

            <div className="rounded-2xl bg-mist p-4 text-center">
              <p className="text-4xl font-bold tabular-nums">{formatInr(priceFor(plan, period))}</p>
              <p className="text-sm text-moss">{plan.name}, {PERIOD_LABEL[period]}</p>
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt={`UPI QR to pay ${formatInr(priceFor(plan, period))}`} className="mx-auto mt-3 aspect-square w-full max-w-64 rounded-xl bg-white p-1" />
              ) : (
                <p className="mt-3 rounded-xl bg-g-yellow-tint p-3 text-sm font-semibold text-ink">Payment UPI is not set up on the server, so no QR can be shown. Take cash or bank transfer and confirm below.</p>
              )}
              <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-moss"><Printer aria-hidden className="size-3.5" /> The amount is already filled in.</p>
            </div>

            <PlanPayment
              apiBase={`/api/admin/ordering/${shopId}`}
              printHref={`${base}/print?plan=${plan.id}&period=${period}`}
              planId={plan.id}
              period={period}
              amountLabel={`${PERIOD_LABEL[period]} of ${plan.name}`}
              amountText={formatInr(priceFor(plan, period))}
              endsAt={shop.subscriptionEndsAt.toISOString()}
              newEnd={formatEndDate(extendedEnd(shop.subscriptionEndsAt, PERIOD_MONTHS[period]))}
            />
          </div>
        ) : (
          <p className="text-moss">No plans found. Add them in Settings.</p>
        )}
      </Panel>
    </div>
  );
}
