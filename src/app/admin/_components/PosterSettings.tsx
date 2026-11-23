"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TicketPercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyCoupon, couponCode, formatInr } from "@/lib/poster-pricing";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "./ConfirmButton";
import { adminRequest } from "./request";
import { Panel } from "./TrackingBlocks";

type Coupon = { id: string; code: string; amountOff: number; isActive: boolean };

const wholeRupees = (value: string) => (/^\d+$/.test(value) ? Number(value) : 0);

function RupeeInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-moss">₹</span>
        <Input id={id} required inputMode="numeric" pattern="[0-9]*" maxLength={7} value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))} className="pl-8 tabular-nums" />
      </div>
    </div>
  );
}

export function PosterSettings({ pricing, coupons }: { pricing: { normalPrice: number; customPrice: number }; coupons: Coupon[] }) {
  const router = useRouter();
  const [normal, setNormal] = useState(String(pricing.normalPrice));
  const [custom, setCustom] = useState(String(pricing.customPrice));
  const [priceNote, setPriceNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const savePrices = async (event: FormEvent) => {
    event.preventDefault();
    setIsSavingPrice(true);
    setPriceNote(null);
    const result = await adminRequest("/api/admin/poster-settings", "PUT", { normalPrice: wholeRupees(normal), customPrice: wholeRupees(custom) });
    setIsSavingPrice(false);
    setPriceNote(result.ok ? { ok: true, text: "Prices saved." } : { ok: false, text: result.error });
    if (result.ok) router.refresh();
  };

  const createCoupon = async (event: FormEvent) => {
    event.preventDefault();
    setIsCreating(true);
    setCouponError(null);
    const result = await adminRequest("/api/admin/poster-coupons", "POST", { code, amountOff: wholeRupees(amount) });
    setIsCreating(false);
    if (!result.ok) return setCouponError(result.error);
    setCode("");
    setAmount("");
    router.refresh();
  };

  const changeCoupon = async (id: string, method: "PATCH" | "DELETE", body?: { isActive: boolean }) => {
    setCouponError(null);
    const result = await adminRequest(`/api/admin/poster-coupons/${id}`, method, body);
    if (!result.ok) setCouponError(result.error);
    router.refresh();
  };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <Panel title="Poster prices">
        <form onSubmit={savePrices} className="space-y-4">
          <RupeeInput id="normal-price" label="Normal poster" value={normal} onChange={setNormal} />
          <RupeeInput id="custom-price" label="Custom poster" value={custom} onChange={setCustom} />
          <Button type="submit" isLoading={isSavingPrice} className="w-full">Save prices</Button>
          {priceNote && <p role="status" className={cn("text-sm font-medium", priceNote.ok ? "text-g-green" : "text-danger")}>{priceNote.text}</p>}
        </form>
      </Panel>

      <Panel title="Coupon codes">
        <p className="-mt-2 mb-4 text-sm text-moss">Coupons work on the Custom poster only.</p>
        <form onSubmit={createCoupon} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
          <div>
            <Label htmlFor="coupon-code">Coupon code</Label>
            <Input id="coupon-code" required minLength={3} maxLength={20} pattern="[A-Za-z0-9]+" title="Use 3 to 20 letters or numbers" autoCapitalize="characters" value={code} onChange={(event) => setCode(couponCode(event.target.value))} placeholder="SEM251" />
          </div>
          <RupeeInput id="coupon-amount" label="Discount" value={amount} onChange={setAmount} />
          <Button type="submit" isLoading={isCreating}>Create coupon</Button>
        </form>
        {couponError && <p role="alert" className="mt-3 text-sm font-medium text-danger">{couponError}</p>}

        {coupons.length ? (
          <ul className="mt-5 divide-y divide-line">
            {coupons.map((coupon) => (
              <li key={coupon.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", coupon.isActive ? "bg-g-green-tint text-g-green" : "bg-mist text-moss")}>
                  <TicketPercent aria-hidden className="size-5" />
                </span>
                <span className="min-w-40 flex-1">
                  <span className="block font-semibold tracking-wide">{coupon.code}</span>
                  <span className="block text-sm text-moss">
                    {formatInr(coupon.amountOff)} off, Custom becomes {formatInr(applyCoupon(pricing.customPrice, coupon.code, [coupon])!.total)}
                  </span>
                </span>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", coupon.isActive ? "bg-g-green-tint text-g-green" : "bg-mist text-moss")}>{coupon.isActive ? "Active" : "Off"}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => changeCoupon(coupon.id, "PATCH", { isActive: !coupon.isActive })}>
                  {coupon.isActive ? "Turn off" : "Turn on"}
                </Button>
                <ConfirmButton variant="ghost" size="sm" title={`Delete ${coupon.code}?`} message="This code will stop working right away." confirmLabel="Delete coupon" onConfirm={() => changeCoupon(coupon.id, "DELETE")}>
                  Delete
                </ConfirmButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-xl bg-mist p-4 text-sm text-moss">No coupons yet. Create one above.</p>
        )}
      </Panel>
    </div>
  );
}
