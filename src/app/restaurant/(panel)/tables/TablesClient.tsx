"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Minus, Plus, ReceiptText, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NoteLine, type Note } from "@/components/ordering/manage/CopyButton";
import { VegDot } from "@/components/ordering/manage/MenuEditor";
import { formatPaise } from "@/lib/ordering/bill";
import type { Can } from "@/lib/ordering/staff-page";
import type { StaffBoard as Board } from "@/lib/ordering/staff-view";
import { cn } from "@/lib/utils";

type Table = { id: string; label: string; guestUrl: string };
type Dish = { id: string; name: string; nameHi: string | null; pricePaise: number; isVeg: boolean; isAvailable: boolean };
type Section = { id: string; name: string; nameHi: string | null; items: Dish[] };

const POLL_MS = 4000;
const MAX_QTY = 20;
const STATUS: Record<string, { text: string; tone: string }> = {
  RECEIVED: { text: "New", tone: "bg-g-red-tint text-g-red" },
  PREPARING: { text: "Cooking", tone: "bg-g-yellow-tint text-ink" },
  SERVED: { text: "Served", tone: "bg-g-green-tint text-g-green" },
  CANCELLED: { text: "Cancelled", tone: "bg-mist text-moss" },
};
const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const people = (count: number) => `${count} ${count === 1 ? "person" : "people"}`;

async function call(url: string, method: string, body?: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> | null }> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (res.status === 401) window.location.reload();
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => null) };
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <span className="inline-flex items-center gap-1" role="group" aria-label={label}>
      <button type="button" aria-label={`Less ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="flex size-11 items-center justify-center rounded-full ring-1 ring-line disabled:opacity-40">
        <Minus aria-hidden className="size-4" />
      </button>
      <span className="min-w-8 text-center text-lg font-bold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="flex size-11 items-center justify-center rounded-full ring-1 ring-line disabled:opacity-40">
        <Plus aria-hidden className="size-4" />
      </button>
    </span>
  );
}

/** Takes an order at the table for a guest who does not want to use their phone. */
function OrderPicker({ table, menu, partyStart, onDone, onCancel }: { table: Table; menu: Section[]; partyStart: number; onDone: () => void; onCancel: () => void }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [partySize, setPartySize] = useState(partyStart);
  const [note, setNote] = useState("");
  const [soldOut, setSoldOut] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Note>(null);
  // The same key is sent again when retrying the same order, so a lost reply never doubles it.
  const key = useRef<string | null>(null);
  const changed = () => (key.current = null);

  const dishes = menu.flatMap((section) => section.items);
  const lines = Object.entries(cart).filter(([, qty]) => qty > 0);
  const count = lines.reduce((total, [, qty]) => total + qty, 0);
  const subtotal = lines.reduce((total, [id, qty]) => total + (dishes.find((dish) => dish.id === id)?.pricePaise ?? 0) * qty, 0);

  const setQty = (id: string, qty: number) => {
    changed();
    setCart((current) => ({ ...current, [id]: qty }));
  };

  const place = async () => {
    if (!lines.length) return;
    key.current ??= crypto.randomUUID();
    setBusy(true);
    setMessage(null);
    try {
      const result = await call("/api/restaurant/orders", "POST", {
        tableId: table.id,
        key: key.current,
        partySize,
        ...(note.trim() && { note: note.trim() }),
        items: lines.map(([itemId, qty]) => ({ itemId, qty })),
      });
      if (result.ok) {
        key.current = null;
        return onDone();
      }
      const gone = Array.isArray(result.data?.unavailable) ? (result.data.unavailable as string[]) : [];
      if (gone.length) {
        changed();
        setSoldOut((current) => [...current, ...gone]);
        setCart((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !gone.includes(id))));
        const names = dishes.filter((dish) => gone.includes(dish.id)).map((dish) => dish.name).join(", ");
        setMessage({ ok: false, text: `${names || "Some dishes"} ran out and ${gone.length === 1 ? "was" : "were"} removed. Check the order and place it again.` });
      } else {
        setMessage({ ok: false, text: typeof result.data?.error === "string" ? result.data.error : "The order did not go through. Try again." });
      }
    } catch {
      setMessage({ ok: false, text: "No connection. Check the internet and tap Place order again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-paper p-4">
        <h2 className="text-xl font-bold">New order for table {table.label}</h2>
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Users aria-hidden className="size-4" /> People
          <Stepper label="people" value={partySize} min={1} max={20} onChange={(value) => { changed(); setPartySize(value); }} />
        </span>
      </div>

      {menu.length ? (
        menu.map((section) => (
          <section key={section.id} aria-label={section.name} className="rounded-2xl bg-paper p-4">
            <h3 className="text-lg font-bold">
              {section.name}
              {section.nameHi && <span lang="hi" className="ml-2 text-base font-normal text-moss">{section.nameHi}</span>}
            </h3>
            <ul className="mt-1 divide-y divide-line">
              {section.items.map((dish) => {
                const isOut = !dish.isAvailable || soldOut.includes(dish.id);
                const qty = cart[dish.id] ?? 0;
                return (
                  <li key={dish.id} className="flex items-center gap-3 py-2">
                    <VegDot isVeg={dish.isVeg} />
                    <span className={cn("min-w-0 flex-1", isOut && "text-moss")}>
                      <span className="block break-words font-semibold">{dish.name}</span>
                      {dish.nameHi && <span lang="hi" className="block text-sm text-moss">{dish.nameHi}</span>}
                      <span className="block text-sm tabular-nums text-moss">{formatPaise(dish.pricePaise)}</span>
                    </span>
                    {isOut ? (
                      <span className="text-sm font-semibold text-moss">Sold out</span>
                    ) : qty ? (
                      <Stepper label={dish.name} value={qty} min={0} max={MAX_QTY} onChange={(value) => setQty(dish.id, value)} />
                    ) : (
                      <Button type="button" variant="outline" size="sm" aria-label={`Add ${dish.name}`} onClick={() => setQty(dish.id, 1)}>
                        <Plus aria-hidden className="size-4" /> Add
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      ) : (
        <p className="rounded-2xl bg-paper p-4 text-moss">The menu is empty. Ask the owner to add dishes.</p>
      )}

      <div className="rounded-2xl bg-paper p-4">
        <Label htmlFor="order-note">Note for the kitchen (optional)</Label>
        <textarea
          id="order-note"
          maxLength={140}
          rows={2}
          value={note}
          onChange={(event) => { changed(); setNote(event.target.value); }}
          placeholder="Less spicy, no onion"
          className="block w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-base"
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-3xl space-y-2">
          <NoteLine note={message} />
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-32 flex-1 text-sm">
              <span className="block font-bold">{plural(count, "item")}</span>
              <span className="text-moss">{formatPaise(subtotal)} before GST</span>
            </p>
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="button" onClick={place} isLoading={busy} disabled={!count}>Place order</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TablesClient({ tables, menu, initial, can }: { tables: Table[]; menu: Section[]; initial: Board; can: Can }) {
  const [board, setBoard] = useState(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const version = useRef(initial.version);

  const poll = useCallback(async (force = false) => {
    try {
      const res = await fetch(`/api/staff/orders${force ? "" : `?v=${version.current}`}`, { cache: "no-store" });
      if (res.status === 401) return window.location.reload();
      if (res.status !== 200) return;
      const next: Board = await res.json();
      version.current = next.version;
      setBoard(next);
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setInterval(() => document.visibilityState === "visible" && void poll(), POLL_MS);
    return () => clearInterval(timer);
  }, [poll]);

  const act = async (url: string, method: string, body: unknown, done: string) => {
    setBusy(true);
    setNote(null);
    try {
      const result = await call(url, method, body);
      setNote(result.ok ? { ok: true, text: done } : { ok: false, text: typeof result.data?.error === "string" ? result.data.error : "That did not save. Try again." });
      await poll(true);
    } catch {
      setNote({ ok: false, text: "No connection. Check the internet and try again." });
    } finally {
      setBusy(false);
    }
  };

  const tabFor = (table: Table) => board.tabs.find((tab) => tab.tableId === table.id);
  const table = tables.find((item) => item.id === selected);

  if (table) {
    const tab = tabFor(table);
    const orders = tab ? board.orders.filter((order) => order.tableLabel === table.label && order.createdAt >= tab.createdAt) : [];
    const back = () => {
      setSelected(null);
      setOrdering(false);
      setNote(null);
    };

    if (ordering && can.takeOrder) {
      return (
        <OrderPicker
          table={table}
          menu={menu}
          partyStart={tab?.partySize ?? 2}
          onCancel={() => setOrdering(false)}
          onDone={() => {
            setOrdering(false);
            setNote({ ok: true, text: "Order sent to the kitchen." });
            void poll(true);
          }}
        />
      );
    }

    return (
      <div className="space-y-4">
        <button type="button" onClick={back} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-moss hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> All tables
        </button>
        <div className="rounded-2xl bg-paper p-4">
          <h2 className="text-2xl font-bold">Table {table.label}</h2>
          <p className="mt-1 text-moss">
            {!tab
              ? "Free. No open orders."
              : tab.status === "BILL_REQUESTED"
                ? `Bill ${tab.billNo ?? ""} is ready: ${formatPaise(tab.totalPaise)}. ${people(tab.partySize)}.`
                : `Ordering. ${plural(tab.orders, "order")}, ${people(tab.partySize)}.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {can.takeOrder && (
              <Button type="button" onClick={() => { setNote(null); setOrdering(true); }}>
                <Plus aria-hidden className="size-4" /> Take order
              </Button>
            )}
            {can.billTable && tab?.status === "OPEN" && tab.orders > 0 && (
              <Button type="button" variant="outline" isLoading={busy} onClick={() => act(`/api/restaurant/tables/${table.id}/bill`, "POST", undefined, "Bill prepared. Show it to the guest.")}>
                <ReceiptText aria-hidden className="size-4" /> Prepare bill
              </Button>
            )}
            {tab && (
              <a href={table.guestUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
                <ExternalLink aria-hidden className="size-4" /> Show bill to guest
              </a>
            )}
          </div>
          <div className="mt-3"><NoteLine note={note} /></div>
        </div>

        {orders.length ? (
          <ul className="space-y-3">
            {orders.map((order) => {
              const status = STATUS[order.status] ?? { text: order.status, tone: "bg-mist" };
              const open = order.status === "RECEIVED" || order.status === "PREPARING";
              return (
                <li key={order.id} className={cn("rounded-2xl bg-paper p-4", order.status === "CANCELLED" && "opacity-60")}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-semibold", status.tone)}>{status.text}</span>
                    <span className="text-sm text-moss">{clock(order.createdAt)}</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {order.items.map((item) => (
                      <li key={item.name} className="flex items-center gap-2">
                        <VegDot isVeg={item.isVeg} />
                        <span className="font-bold tabular-nums">{item.qty}×</span> {item.name}
                      </li>
                    ))}
                  </ul>
                  {order.note && <p className="mt-2 rounded-lg bg-g-yellow-tint p-2 text-sm">Note: {order.note}</p>}
                  {open && can.serve && (
                    <Button type="button" size="sm" className="mt-3 bg-g-green hover:bg-g-green/90" disabled={busy} onClick={() => act(`/api/staff/orders/${order.id}`, "PATCH", { status: "SERVED" }, "Marked served.")}>
                      Mark served
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          tab && <p className="rounded-2xl bg-paper p-4 text-moss">No orders on this table yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-moss">Tap a table to see its orders, take an order or prepare the bill. Updates every few seconds.</p>
      {tables.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tables.map((item) => {
            const tab = tabFor(item);
            const cooking = tab ? board.orders.filter((order) => order.tableLabel === item.label && order.createdAt >= tab.createdAt && (order.status === "RECEIVED" || order.status === "PREPARING")).length : 0;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => { setNote(null); setSelected(item.id); }}
                  className={cn(
                    "flex min-h-28 w-full flex-col items-start justify-between rounded-2xl p-4 text-left ring-1",
                    !tab ? "bg-paper ring-line" : tab.status === "BILL_REQUESTED" ? "bg-g-blue-tint ring-g-blue" : "bg-g-yellow-tint ring-g-yellow"
                  )}
                >
                  <span className="text-2xl font-bold">{item.label}</span>
                  <span className="text-sm font-semibold">
                    {!tab ? "Free" : tab.status === "BILL_REQUESTED" ? `Bill asked ${formatPaise(tab.totalPaise)}` : `Ordering (${plural(tab.orders, "order")})`}
                  </span>
                  {cooking > 0 && <span className="text-sm text-moss">{cooking} not served yet</span>}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-2xl bg-paper p-6 text-moss">No tables yet. The owner adds them from the Table QR tab.</p>
      )}
    </div>
  );
}
