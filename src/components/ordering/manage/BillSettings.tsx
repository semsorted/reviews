"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminRequest } from "@/app/admin/_components/request";
import { Panel } from "@/app/admin/_components/TrackingBlocks";
import { NoteLine, Switch, type Note } from "./CopyButton";

type Bill = { gstin: string; gstRateBp: number; fssai: string; upiUrl: string };

const RATES = [
  { value: 0, label: "No GST" },
  { value: 500, label: "5% restaurant" },
  { value: 1800, label: "18% hotel restaurant" },
];

// Semsorted only: these two switch ordering on and off, which a restaurant cannot do itself.
const saveSettings = (shopId: string, body: { isEnabled: boolean }) => adminRequest(`/api/admin/ordering/${shopId}`, "PUT", body);

/** Makes an existing business a restaurant. The first save creates its settings; ordering stays off until turned on. */
export function SetUpOrdering({ shopId, name }: { shopId: string; name?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUp = async () => {
    setBusy(true);
    const result = await saveSettings(shopId, { isEnabled: false });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    router.push(`/admin/restaurants/${shopId}`);
    router.refresh();
  };
  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={setUp} isLoading={busy} aria-label={name ? `Set up ${name} as a restaurant` : undefined}>Set up as restaurant</Button>
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

export function OrderingSwitch({ shopId, isEnabled }: { shopId: string; isEnabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const change = async (next: boolean) => {
    setBusy(true);
    setError(null);
    const result = await saveSettings(shopId, { isEnabled: next });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    router.refresh();
  };
  return (
    <div>
      <Switch checked={isEnabled} onChange={change} busy={busy} label={isEnabled ? "Ordering on" : "Ordering off"} />
      {error && <p role="alert" className="mt-1 text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

/** saveUrl is "/api/admin/ordering/<shopId>" for Semsorted or "/api/restaurant/settings" for the restaurant owner. */
export function BillSettings({ saveUrl, bill }: { saveUrl: string; bill: Bill }) {
  const router = useRouter();
  const [form, setForm] = useState(bill);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const set = (key: keyof Bill) => (event: { target: { value: string } }) => setForm({ ...form, [key]: key === "gstRateBp" ? Number(event.target.value) : event.target.value });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNote(null);
    const result = await adminRequest(saveUrl, "PUT", form);
    setBusy(false);
    setNote(result.ok ? { ok: true, text: "Bill details saved." } : { ok: false, text: result.error });
    if (result.ok) router.refresh();
  };

  return (
    <Panel title="Bill details" className="max-w-2xl">
      <form onSubmit={save} className="space-y-5">
        <div>
          <Label htmlFor="gstin">GSTIN</Label>
          <Input id="gstin" maxLength={15} autoCapitalize="characters" autoComplete="off" spellCheck={false} placeholder="08ABCDE1234F1Z5" value={form.gstin} onChange={set("gstin")} aria-describedby="gstin-help" />
          <p id="gstin-help" className="mt-1 text-sm text-moss">Leave empty if the restaurant is not registered for GST.</p>
        </div>
        <div>
          <Label htmlFor="gst-rate">GST rate</Label>
          <select id="gst-rate" value={form.gstRateBp} onChange={set("gstRateBp")} aria-describedby="gst-help" className="block min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-base">
            {RATES.map((rate) => <option key={rate.value} value={rate.value}>{rate.label}</option>)}
          </select>
          <p id="gst-help" className="mt-1 text-sm text-moss">5% for most restaurants. 18% only inside hotels with a room tariff above ₹7,500.</p>
        </div>
        <div>
          <Label htmlFor="fssai">FSSAI number</Label>
          <Input id="fssai" inputMode="numeric" maxLength={14} autoComplete="off" placeholder="14 digits" value={form.fssai} onChange={set("fssai")} />
        </div>
        <div>
          <Label htmlFor="upi">Restaurant UPI link</Label>
          <Input id="upi" inputMode="url" autoComplete="off" spellCheck={false} placeholder="upi://pay?pa=name@bank&pn=Restaurant" value={form.upiUrl} onChange={set("upiUrl")} aria-describedby="upi-help" />
          <p id="upi-help" className="mt-1 text-sm text-moss">Guests pay this link. The bill amount and number are added for them.</p>
        </div>
        <p className="rounded-xl bg-mist p-3 text-sm text-moss">Service charge is never added to the bill, as the CCPA 2022 guidelines require.</p>
        <Button type="submit" isLoading={busy}>Save bill details</Button>
        <NoteLine note={note} />
      </form>
    </Panel>
  );
}
