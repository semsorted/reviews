"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Printer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { adminRequest } from "@/app/admin/_components/request";
import { ConfirmButton } from "@/app/admin/_components/ConfirmButton";
import { PAY_METHODS, type PayMethod, type PlanPeriod } from "@/lib/restaurant-plans";

const METHOD_LABEL: Record<PayMethod, string> = { UPI: "UPI (scanned our QR)", CASH: "Cash", BANK: "Bank transfer" };

/** The admin has seen the money arrive. One big button records it and extends the plan. */
export function PlanPayment({ apiBase, printHref, planId, period, amountLabel, amountText, endsAt, newEnd }: {
  apiBase: string; printHref: string; planId: string; period: PlanPeriod; amountLabel: string; amountText: string; endsAt: string; newEnd: string;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<PayMethod>("UPI");
  const [reference, setReference] = useState("");
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const confirm = async () => {
    setError(null);
    const result = await adminRequest<{ id: string }>(`${apiBase}/payments`, "POST", { key, planId, period, method, reference: reference.trim() || undefined, expectedEndsAt: endsAt });
    if (!result.ok) return setError(result.error);
    setDone(result.data.id);
    setKey(crypto.randomUUID());
    setReference("");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          How did they pay?
          <select value={method} onChange={(event) => setMethod(event.target.value as PayMethod)} className="mt-1 block min-h-12 w-full rounded-lg border border-line bg-paper px-3 text-base font-normal">
            {PAY_METHODS.map((item) => <option key={item} value={item}>{METHOD_LABEL[item]}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          UPI reference number (optional)
          <input value={reference} maxLength={40} onChange={(event) => setReference(event.target.value)} placeholder="12 digit UTR" className="mt-1 block min-h-12 w-full rounded-lg border border-line bg-paper px-3 text-base font-normal" />
        </label>
      </div>
      <ConfirmButton
        size="lg"
        confirmVariant="default"
        title={`Payment of ${amountText} received?`}
        message={`Only confirm after the money is in your account. This adds ${amountLabel} and moves the end date to ${newEnd}.`}
        confirmLabel="Yes, payment received"
        onConfirm={confirm}
        className="min-h-16 w-full bg-g-green text-lg hover:bg-g-green/90"
      >
        <CheckCircle2 aria-hidden className="size-6" /> Payment received, add {amountText}
      </ConfirmButton>
      <a href={printHref} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}>
        <Printer aria-hidden className="size-5" /> Print payment QR
      </a>
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      {done && <p role="status" className="rounded-xl bg-g-green-tint p-3 text-sm font-semibold text-g-green">Payment added. The plan is extended.</p>}
    </div>
  );
}
