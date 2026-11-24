"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, ChefHat, ReceiptText, Users, Volume2 } from "lucide-react";
import { formatPaise } from "@/lib/ordering/bill";
import type { Can } from "@/lib/ordering/staff-page";
import type { BoardOrder, OpenTab, StaffBoard as Board } from "@/lib/ordering/staff-view";
import { cn } from "@/lib/utils";
import { useOrderAlerts } from "./useOrderAlerts";

const POLL_MS = 4000;
const COLUMNS = [
  { id: "RECEIVED", title: "New", tone: "border-red-500" },
  { id: "PREPARING", title: "Cooking", tone: "border-amber-500" },
  { id: "DONE", title: "Served in the last 2 hours", tone: "border-green-600" },
] as const;
const button = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 font-semibold disabled:opacity-50";
type BoardCan = Pick<Can, "cook" | "serve" | "cancel" | "markPaid" | "billTable">;
const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });

function OrderCard({ order, now, busy, can, onMove }: { order: BoardOrder; now: number | null; busy: boolean; can: BoardCan; onMove: (status: string) => void }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const waited = now ? Math.max(0, Math.floor((now - new Date(order.createdAt).getTime()) / 60000)) : null;
  const open = order.status === "RECEIVED" || order.status === "PREPARING";
  return (
    <li className={cn("rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5", order.status === "CANCELLED" && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-bold leading-none">Table {order.tableLabel}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
            <Users aria-hidden className="size-4" /> {order.partySize} {order.partySize === 1 ? "person" : "people"}{order.guestName ? `, ${order.guestName}` : ""}
          </p>
        </div>
        <p className="text-right text-sm text-gray-600">
          {clock(order.createdAt)}
          {open && waited !== null && <span className={cn("block font-semibold", waited >= 15 ? "text-red-700" : "text-gray-900")}>{waited} min</span>}
          {order.status === "CANCELLED" && <span className="block font-semibold">Cancelled</span>}
        </p>
      </div>
      <ul className="mt-3 space-y-1 text-lg">
        {order.items.map((item) => (
          <li key={item.name} className="flex items-center gap-2">
            <span aria-label={item.isVeg ? "Veg" : "Non-veg"} role="img" className={cn("size-3 shrink-0 rounded-full", item.isVeg ? "bg-green-700" : "bg-red-700")} />
            <span className="font-bold tabular-nums">{item.qty}×</span> {item.name}
          </li>
        ))}
      </ul>
      {order.note && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm font-medium text-amber-900">Note: {order.note}</p>}
      {open && (can.cook || can.serve || can.cancel) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {order.status === "RECEIVED" && can.cook && (
            <button type="button" disabled={busy} onClick={() => onMove("PREPARING")} className={cn(button, "flex-1 bg-amber-500 text-black")}>
              <ChefHat aria-hidden className="size-5" /> Start cooking
            </button>
          )}
          {can.serve && <button type="button" disabled={busy} onClick={() => onMove("SERVED")} className={cn(button, "flex-1 bg-green-700 text-white")}>Served</button>}
          {!can.cancel ? null : confirmCancel ? (
            <span className="flex w-full items-center gap-2 text-sm">
              Cancel this order?
              <button type="button" disabled={busy} onClick={() => onMove("CANCELLED")} className={cn(button, "min-h-11 bg-red-700 px-3 text-white")}>Yes, cancel</button>
              <button type="button" onClick={() => setConfirmCancel(false)} className={cn(button, "min-h-11 px-3 ring-1 ring-gray-300")}>No</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmCancel(true)} className="min-h-11 px-2 text-sm font-semibold text-gray-600 underline">Cancel</button>
          )}
        </div>
      )}
    </li>
  );
}

function TabRow({ tab, busy, can, onPaid, onBill, onVoid }: { tab: OpenTab; busy: boolean; can: BoardCan; onPaid: (method: "UPI" | "CASH") => void; onBill: () => void; onVoid: () => void }) {
  const [method, setMethod] = useState<"UPI" | "CASH" | null>(null);
  // A tab with only cancelled orders has nothing to pay, so it closes without a bill number.
  if (tab.orders === 0) {
    return (
      <li className="flex flex-wrap items-center gap-3 py-3">
        <div className="min-w-32 flex-1">
          <p className="font-bold">Table {tab.tableLabel}</p>
          <p className="text-sm text-gray-600">No orders to pay for.</p>
        </div>
        {can.markPaid && <button type="button" disabled={busy} onClick={onVoid} className={cn(button, "min-h-11 ring-1 ring-gray-300")}>Close table</button>}
      </li>
    );
  }
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-32 flex-1">
        <p className="font-bold">Table {tab.tableLabel}</p>
        <p className="text-sm text-gray-600">
          {tab.orders} {tab.orders === 1 ? "order" : "orders"}, {tab.partySize} {tab.partySize === 1 ? "person" : "people"}
          {tab.status === "BILL_REQUESTED" ? `. Bill ${tab.billNo ?? ""} asked: ${formatPaise(tab.totalPaise)}` : ". Still ordering"}
        </p>
      </div>
      {tab.status === "OPEN" && can.billTable && !method && (
        <button type="button" disabled={busy} onClick={onBill} className={cn(button, "min-h-11 bg-gray-950 text-white")}>Prepare bill</button>
      )}
      {!can.markPaid ? null : method ? (
        <span className="flex flex-wrap items-center gap-2 text-sm">
          Paid by {method === "UPI" ? "UPI" : "cash"}?
          <button type="button" disabled={busy} onClick={() => onPaid(method)} className={cn(button, "min-h-11 bg-green-700 text-white")}>Yes, close table</button>
          <button type="button" onClick={() => setMethod(null)} className={cn(button, "min-h-11 ring-1 ring-gray-300")}>No</button>
        </span>
      ) : (
        <span className="flex gap-2">
          <button type="button" onClick={() => setMethod("UPI")} className={cn(button, "min-h-11 ring-1 ring-gray-300")}>Paid UPI</button>
          <button type="button" onClick={() => setMethod("CASH")} className={cn(button, "min-h-11 ring-1 ring-gray-300")}>Paid cash</button>
        </span>
      )}
    </li>
  );
}

/**
 * Live order board for the restaurant panel. The page passes `can` from the server so each role
 * only sees the buttons it may press; `showTables` adds open tables with bill and payment actions.
 */
export function StaffBoard({ initial, shopName, can, showTables = false }: { initial: Board; shopName: string; can: BoardCan; showTables?: boolean }) {
  const [board, setBoard] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const seen = useRef(new Set(initial.orders.map((order) => order.id)));
  const version = useRef(initial.version);
  const { armed, arm, ringing, ring, acknowledge } = useOrderAlerts(shopName);

  const apply = useCallback(
    (next: Board) => {
      const fresh = next.orders.filter((order) => order.status === "RECEIVED" && !seen.current.has(order.id));
      next.orders.forEach((order) => seen.current.add(order.id));
      if (fresh.length) ring(fresh.length, fresh.map((order) => `Table ${order.tableLabel}: ${order.items.map((item) => `${item.qty} ${item.name}`).join(", ")}`).join("\n"));
      version.current = next.version;
      setBoard(next);
    },
    [ring]
  );

  const poll = useCallback(
    async (force = false) => {
      try {
        const res = await fetch(`/api/staff/orders${force ? "" : `?v=${version.current}`}`, { cache: "no-store" });
        if (res.status === 401) return window.location.reload();
        if (res.status === 200) apply(await res.json());
      } catch {}
    },
    [apply]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      if (document.visibilityState === "visible") void poll();
    }, POLL_MS);
    const first = setTimeout(() => setNow(Date.now()), 0);
    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, [poll]);

  const send = async (url: string, body?: unknown, method = "PATCH") => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      if (res.status === 401) return window.location.reload();
      if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? "That did not save. Try again.");
      await poll(true);
    } catch {
      setError("No connection. Check the internet and try again.");
    } finally {
      setBusy(false);
    }
  };

  const columns = {
    RECEIVED: board.orders.filter((order) => order.status === "RECEIVED"),
    PREPARING: board.orders.filter((order) => order.status === "PREPARING"),
    DONE: board.orders.filter((order) => order.status === "SERVED" || order.status === "CANCELLED").reverse(),
  };

  return (
    <div className="space-y-3 text-gray-950">
      {!armed && (
        <button type="button" onClick={arm} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-lg font-bold text-black">
          <Volume2 aria-hidden className="size-6" /> Tap to start the shift and turn on order sound
        </button>
      )}
      {ringing > 0 && (
        <div role="alert" className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-red-600 px-4 py-4 text-white motion-safe:animate-pulse">
          <BellRing aria-hidden className="size-6" />
          <span className="text-lg font-bold">{ringing} new {ringing === 1 ? "order" : "orders"}</span>
          <button type="button" onClick={acknowledge} className="min-h-12 rounded-xl bg-white px-5 font-bold text-red-700">Got it</button>
        </div>
      )}
      {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 font-semibold text-red-800">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((column) => (
          <section key={column.id} aria-labelledby={`col-${column.id}`} className={cn("rounded-2xl border-t-4 bg-gray-50 p-3", column.tone)}>
            <h2 id={`col-${column.id}`} className="px-1 pb-3 text-lg font-bold">
              {column.title} <span className="tabular-nums text-gray-500">{columns[column.id].length}</span>
            </h2>
            {columns[column.id].length ? (
              <ul className="space-y-3">
                {columns[column.id].map((order) => (
                  <OrderCard key={order.id} order={order} now={now} busy={busy} can={can} onMove={(status) => send(`/api/staff/orders/${order.id}`, { status })} />
                ))}
              </ul>
            ) : (
              <p className="px-1 pb-2 text-gray-500">Nothing here.</p>
            )}
          </section>
        ))}

        {showTables && (
          <section aria-labelledby="tabs-title" className="rounded-2xl bg-white p-4 lg:col-span-3">
            <h2 id="tabs-title" className="flex items-center gap-2 text-lg font-bold"><ReceiptText aria-hidden className="size-5" /> Open tables</h2>
            {board.tabs.length ? (
              <ul className="divide-y divide-gray-200">
                {board.tabs.map((tab) => (
                  <TabRow
                    key={tab.id}
                    tab={tab}
                    busy={busy}
                    can={can}
                    onPaid={(method) => send(`/api/staff/sessions/${tab.id}`, { action: "paid", method })}
                    onBill={() => send(`/api/restaurant/tables/${tab.tableId}/bill`, undefined, "POST")}
                    onVoid={() => send(`/api/staff/sessions/${tab.id}`, { action: "void" })}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-gray-500">No open tables.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
