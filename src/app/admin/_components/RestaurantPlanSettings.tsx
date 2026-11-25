"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminRequest } from "./request";
import { Panel } from "./TrackingBlocks";

type Plan = { id: string; name: string; summary: string; monthlyPrice: number; yearlyPrice: number };
const whole = (value: string) => (/^\d+$/.test(value) ? Number(value) : 0);

function PlanRow({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [monthly, setMonthly] = useState(String(plan.monthlyPrice));
  const [yearly, setYearly] = useState(String(plan.yearlyPrice));
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNote(null);
    const result = await adminRequest(`/api/admin/restaurant-plans/${plan.id}`, "PUT", { monthlyPrice: whole(monthly), yearlyPrice: whole(yearly) });
    setBusy(false);
    setNote(result.ok ? { ok: true, text: "Saved." } : { ok: false, text: result.error });
    if (result.ok) router.refresh();
  };

  return (
    <form onSubmit={save} className="space-y-3 border-t border-line pt-4 first:border-0 first:pt-0">
      <div>
        <p className="font-semibold">{plan.name}</p>
        <p className="text-sm text-moss">{plan.summary}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${plan.id}-m`}>Per month (₹)</Label>
          <Input id={`${plan.id}-m`} required inputMode="numeric" maxLength={7} value={monthly} onChange={(event) => setMonthly(event.target.value.replace(/\D/g, ""))} className="tabular-nums" />
        </div>
        <div>
          <Label htmlFor={`${plan.id}-y`}>Per year (₹)</Label>
          <Input id={`${plan.id}-y`} required inputMode="numeric" maxLength={8} value={yearly} onChange={(event) => setYearly(event.target.value.replace(/\D/g, ""))} className="tabular-nums" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>{busy ? "Saving" : "Save prices"}</Button>
        {note && <p role={note.ok ? "status" : "alert"} className={note.ok ? "text-sm font-semibold text-g-green" : "text-sm font-medium text-danger"}>{note.text}</p>}
      </div>
    </form>
  );
}

export function RestaurantPlanSettings({ plans }: { plans: Plan[] }) {
  return (
    <Panel title="Restaurant plans">
      <p className="mb-4 text-sm text-moss">These prices show on each restaurant&apos;s Plan and payment tab. New restaurants start with a free trial.</p>
      <div className="space-y-4">{plans.map((plan) => <PlanRow key={plan.id} plan={plan} />)}</div>
    </Panel>
  );
}
