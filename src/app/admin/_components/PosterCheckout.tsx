"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Printer, QrCode, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyCoupon, formatInr, type PosterCoupon, type PosterDesign } from "@/lib/poster-pricing";
import { cn } from "@/lib/utils";

const BRAND_BAR = [["#1a56db", 3], ["#12a150", 4], ["#e5484d", 2], ["#f5b301", 1]] as const;
const OPTIONS = [
  { id: "normal", name: "Normal", text: "Clean white poster" },
  { id: "custom", name: "Custom", text: "Uses the business logo and colors" },
] as const;

interface PosterCheckoutProps {
  base: string;
  sizeQuery: string;
  design: PosterDesign;
  prices: Record<PosterDesign, number>;
  coupons: PosterCoupon[];
  payment: { qr: string; payee: string } | null;
}

export function PosterCheckout({ base, sizeQuery, design, prices, coupons, payment }: PosterCheckoutProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [isSwitching, startSwitch] = useTransition();
  const [step, setStep] = useState<"choose" | "pay">("choose");
  const [picked, setPicked] = useState<PosterDesign>(design);
  const [typedCode, setTypedCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const price = prices[picked];
  const deal = picked === "custom" && appliedCode ? applyCoupon(price, appliedCode, coupons) : null;
  const total = deal?.total ?? price;

  const open = () => {
    setStep("choose");
    setPicked(design);
    setTypedCode("");
    setAppliedCode(null);
    setCouponError(null);
    dialogRef.current?.showModal();
  };

  // The poster behind the popup follows the choice, so print always gets the paid design.
  const pick = (next: PosterDesign) => {
    setPicked(next);
    startSwitch(() => router.replace(`${base}?${sizeQuery}&design=${next}`, { scroll: false }));
  };

  const goTo = (next: "choose" | "pay") => {
    setStep(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const applyCode = (event: FormEvent) => {
    event.preventDefault();
    const result = applyCoupon(prices.custom, typedCode, coupons);
    setAppliedCode(result?.code ?? null);
    setCouponError(result ? null : "This coupon code is not valid.");
  };

  const printPoster = () => {
    dialogRef.current?.close();
    window.print();
  };

  return (
    <>
      <Button type="button" onClick={open}>
        <QrCode aria-hidden className="size-4" /> Get QR poster
      </Button>
      <dialog ref={dialogRef} aria-labelledby="poster-title" className="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-2rem)] max-w-[25rem] overflow-y-auto rounded-[1.75rem] bg-white p-0 text-ink backdrop:bg-night/65 print:hidden">
        <div aria-hidden className="flex h-1.5">
          {BRAND_BAR.map(([color, grow]) => <span key={color} style={{ backgroundColor: color, flexGrow: grow }} />)}
        </div>
        <div className="relative px-6 pb-6 pt-5">
          <button type="button" aria-label="Close" onClick={() => dialogRef.current?.close()} className="absolute right-2 top-2 inline-flex size-11 items-center justify-center rounded-full text-moss hover:bg-mist hover:text-ink">
            <X aria-hidden className="size-5" />
          </button>
          <div className="text-center"><Logo className="text-xl" /></div>

          {step === "choose" ? (
            <>
              <h2 id="poster-title" ref={headingRef} tabIndex={-1} className="mt-5 text-center font-logo text-[1.75rem] font-semibold leading-none tracking-[-0.02em] outline-none">Choose your poster</h2>
              <fieldset className="mt-5 space-y-2.5">
                <legend className="sr-only">Poster type</legend>
                {OPTIONS.map((option) => (
                  <label key={option.id} className={cn("flex min-h-[4.5rem] cursor-pointer items-center gap-3 rounded-2xl border-2 p-3.5 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-g-blue/30", picked === option.id ? "border-[#1a56db] bg-g-blue-tint/50" : "border-line hover:border-[#1a56db]/40")}>
                    <input type="radio" name="poster-type" value={option.id} checked={picked === option.id} onChange={() => pick(option.id)} className="sr-only" />
                    <span aria-hidden className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2", picked === option.id ? "border-[#1a56db] bg-[#1a56db] text-white" : "border-line")}>
                      {picked === option.id && <Check className="size-3" strokeWidth={3.5} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-tight">{option.name}</span>
                      <span className="block text-sm leading-snug text-moss">{option.text}</span>
                    </span>
                    <span className="shrink-0 text-lg font-semibold tabular-nums">{formatInr(prices[option.id])}</span>
                  </label>
                ))}
              </fieldset>

              {picked === "custom" && (
                deal ? (
                  <p role="status" className="mt-3 flex min-h-11 items-center justify-between gap-2 rounded-xl bg-g-green-tint px-3.5 text-sm font-semibold text-g-green">
                    {deal.code} applied, {formatInr(deal.discount)} off
                    <button type="button" onClick={() => { setAppliedCode(null); setTypedCode(""); }} className="min-h-11 px-1 underline">Remove</button>
                  </p>
                ) : (
                  <form onSubmit={applyCode} className="mt-3">
                    <div className="flex gap-2">
                      <Input aria-label="Coupon code" placeholder="Coupon code" maxLength={20} autoCapitalize="characters" value={typedCode} onChange={(event) => { setTypedCode(event.target.value.toUpperCase()); setCouponError(null); }} aria-invalid={Boolean(couponError)} />
                      <Button type="submit" variant="outline" disabled={!typedCode.trim()}>Apply</Button>
                    </div>
                    {couponError && <p role="alert" className="mt-1.5 text-sm font-medium text-danger">{couponError}</p>}
                  </form>
                )
              )}

              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
                <span className="font-medium text-moss">To pay</span>
                <span className="text-2xl font-semibold tabular-nums">{formatInr(total)}</span>
              </div>
              <Button type="button" onClick={() => goTo("pay")} disabled={isSwitching || picked !== design} className="mt-4 w-full">
                Next <ArrowRight aria-hidden className="size-4" />
              </Button>
            </>
          ) : (
            <div className="text-center">
              <h2 id="poster-title" ref={headingRef} tabIndex={-1} className="mt-5 font-logo text-[1.75rem] font-semibold leading-none tracking-[-0.02em] outline-none">Scan to pay</h2>
              <p className="mt-3 text-[2rem] font-semibold leading-none tabular-nums text-[#1a56db]">{formatInr(total)}</p>
              <p className="mt-2 text-sm text-moss">
                {picked === "custom" ? "Custom" : "Normal"} poster{deal ? `, ${deal.code} applied` : ""}. Enter this amount in any UPI app.
              </p>
              {payment ? (
                <>
                  <div className="mx-auto mt-4 w-fit rounded-3xl border-2 border-[#1a56db]/20 bg-white p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={payment.qr} alt={payment.payee ? `UPI payment QR for ${payment.payee}` : "UPI payment QR"} className="block size-52" />
                  </div>
                  {payment.payee && <p className="mt-3 text-sm text-moss">Paying to <strong className="mt-0.5 block text-lg font-semibold text-ink">{payment.payee}</strong></p>}
                </>
              ) : (
                <p role="alert" className="mt-4 rounded-xl bg-g-red-tint p-3 text-sm font-semibold text-g-red">The payment QR is not set up yet.</p>
              )}
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="outline" size="icon" aria-label="Back" onClick={() => goTo("choose")} className="shrink-0">
                  <ArrowLeft aria-hidden className="size-4" />
                </Button>
                <Button type="button" onClick={printPoster} className="flex-1">
                  <Printer aria-hidden className="size-4" /> Payment done, print
                </Button>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
