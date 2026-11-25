import { notFound } from "next/navigation";
import { PrintButton } from "@/components/ordering/manage/PrintButton";
import { isUuid } from "@/lib/admin/api";
import { requireAdminPage } from "@/lib/auth/guard";
import { formatInr } from "@/lib/poster-pricing";
import { prisma } from "@/lib/prisma";
import { generateQrSvg } from "@/lib/qr/generator";
import { parsePeriod, PERIOD_LABEL, planUpiUrl, priceFor } from "@/lib/restaurant-plans";
import { formatEndDate } from "@/lib/subscription";

export const metadata = { title: "Payment" };
const svgSrc = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/** A5 sheet: the payment QR to hand to the owner, or a receipt for a payment already added. */
export default async function PaymentPrintPage({ params, searchParams }: { params: Promise<{ shopId: string }>; searchParams: Promise<{ plan?: string; period?: string; receipt?: string }> }) {
  await requireAdminPage();
  const { shopId } = await params;
  const query = await searchParams;
  if (!isUuid(shopId)) notFound();
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { name: true } });
  if (!shop) notFound();

  const payment = query.receipt && isUuid(query.receipt) ? await prisma.shopPayment.findFirst({ where: { id: query.receipt, shopId } }) : null;
  const plan = !query.receipt ? await prisma.restaurantPlan.findUnique({ where: { id: String(query.plan ?? "") } }) : null;
  if (query.receipt ? !payment : !plan) notFound();
  const period = parsePeriod(query.period);
  const amount = payment ? payment.amount : priceFor(plan!, period);
  const upi = payment ? null : planUpiUrl(process.env.PAYMENT_UPI_URL, amount, shop.name);
  const qr = upi ? svgSrc(await generateQrSvg({ url: upi, margin: 4 })) : null;
  const sheet = { "--w": "148mm", "--h": "210mm", "--ratio": "1.4189", "--max": "26rem" } as React.CSSProperties;

  return (
    <div className="space-y-4 print:space-y-0">
      <style>{`@page{size:148mm 210mm;margin:0}`}</style>
      <div className="print:hidden"><PrintButton /></div>
      <article className="qr-sheet mx-auto flex w-full flex-col items-center justify-between bg-white p-8 text-center text-night print:p-10" style={sheet}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-moss">Semsorted</p>
          <h1 className="mt-1 text-2xl font-bold">{payment ? "Payment receipt" : "Pay for your plan"}</h1>
          <p className="mt-1 break-words text-lg font-semibold">{shop.name}</p>
        </div>
        {payment ? (
          <dl className="w-full space-y-2 text-left text-base">
            {[
              ["Receipt no.", `SEM-${String(payment.receiptNo).padStart(5, "0")}`],
              ["Date", formatEndDate(payment.createdAt)],
              ["Plan", `${payment.planName}, ${payment.months === 12 ? "1 year" : "1 month"}`],
              ["Valid till", formatEndDate(payment.periodTo)],
              ["Paid by", payment.method === "UPI" ? `UPI${payment.reference ? ` ${payment.reference}` : ""}` : payment.method === "CASH" ? "Cash" : "Bank transfer"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-line pb-2"><dt className="text-moss">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>
            ))}
            <div className="flex justify-between gap-4 pt-2 text-xl"><dt className="font-semibold">Amount paid</dt><dd className="font-bold tabular-nums">{formatInr(amount)}</dd></div>
          </dl>
        ) : (
          <div>
            <p className="text-5xl font-bold tabular-nums">{formatInr(amount)}</p>
            <p className="text-moss">{plan!.name}, {PERIOD_LABEL[period]}</p>
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="UPI QR code" className="mx-auto mt-4 aspect-square w-64 max-w-full" />
            ) : (
              <p className="mt-4 text-sm text-moss">Ask Semsorted for the payment details.</p>
            )}
            <p className="mt-2 text-sm text-moss">Scan with any UPI app. The amount is filled in.</p>
          </div>
        )}
        <p className="text-xs text-moss">{payment ? "Thank you for choosing Semsorted. This is a payment receipt." : "Your plan starts as soon as Semsorted confirms the payment."}</p>
      </article>
    </div>
  );
}
