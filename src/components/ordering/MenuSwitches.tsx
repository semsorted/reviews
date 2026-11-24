"use client";

import { useState } from "react";
import { formatPaise } from "@/lib/ordering/bill";
import { cn } from "@/lib/utils";
import { NoteLine, Switch, type Note } from "./manage/CopyButton";
import { VegDot } from "./manage/MenuEditor";

type Dish = { id: string; name: string; nameHi: string | null; pricePaise: number; isVeg: boolean; isAvailable: boolean };
type Section = { id: string; name: string; items: Dish[] };

/** Kitchen turns a dish off when it runs out. Guests see "Sold out" at once. */
export function MenuSwitches({ sections }: { sections: Section[] }) {
  const [available, setAvailable] = useState(() => new Map(sections.flatMap((section) => section.items.map((dish) => [dish.id, dish.isAvailable]))));
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);

  const toggle = async (dish: Dish, isAvailable: boolean) => {
    setBusy(dish.id);
    setNote(null);
    try {
      const res = await fetch(`/api/staff/menu/${dish.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isAvailable }) });
      if (res.status === 401) return window.location.reload();
      if (!res.ok) return setNote({ ok: false, text: (await res.json().catch(() => ({}))).error ?? "That did not save. Try again." });
      setAvailable((current) => new Map(current).set(dish.id, isAvailable));
      setNote({ ok: true, text: `${dish.name} is ${isAvailable ? "back on the menu" : "sold out"}.` });
    } catch {
      setNote({ ok: false, text: "No connection. Check the internet and try again." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="dishes-title" className="rounded-2xl bg-paper p-4 sm:p-5">
      <h2 id="dishes-title" className="text-lg font-bold">Dishes</h2>
      <p className="text-sm text-moss">Turn a dish off when it runs out. Guests see it as sold out.</p>
      <div className="mt-2 min-h-6"><NoteLine note={note} /></div>
      {sections.length ? (
        sections.map((section) => (
          <div key={section.id} className="mt-3">
            <h3 className="font-semibold text-moss">{section.name}</h3>
            <ul className="divide-y divide-line">
              {section.items.map((dish) => {
                const isOn = available.get(dish.id) ?? dish.isAvailable;
                return (
                  <li key={dish.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                    <span className={cn("flex min-w-40 flex-1 items-center gap-2.5", !isOn && "text-moss")}>
                      <VegDot isVeg={dish.isVeg} />
                      <span className="min-w-0 break-words font-semibold">{dish.name}</span>
                      <span className="text-sm tabular-nums text-moss">{formatPaise(dish.pricePaise)}</span>
                    </span>
                    <Switch checked={isOn} name={dish.name} busy={busy === dish.id} label={isOn ? "Available" : "Sold out"} onChange={(next) => toggle(dish, next)} />
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      ) : (
        <p className="mt-3 text-sm text-moss">The menu is empty. The owner adds dishes from the Menu tab.</p>
      )}
    </section>
  );
}
