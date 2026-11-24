"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChefHat, Minus, Plus, ReceiptText, ShoppingBag, Star, X } from "lucide-react";
import { formatPaise } from "@/lib/ordering/bill";
import type { GuestStatus } from "@/lib/ordering/guest-view";
import { cn } from "@/lib/utils";
import { WaitingGames } from "./games/WaitingGames";

type MenuItem = { id: string; name: string; nameHi: string | null; pricePaise: number; isVeg: boolean; isAvailable: boolean };
type MenuCategory = { id: string; name: string; nameHi: string | null; items: MenuItem[] };

interface OrderClientProps {
  token: string;
  tableLabel: string;
  shop: { name: string; logoUrl: string | null; primaryColor: string };
  gstRateBp: number;
  menu: MenuCategory[];
  initial: GuestStatus;
}

const POLL_MS = 6000;
const STATUS_TEXT: Record<string, string> = { RECEIVED: "Sent to kitchen", PREPARING: "Cooking", SERVED: "Served", CANCELLED: "Cancelled" };
const STATUS_TONE: Record<string, string> = {
  RECEIVED: "bg-review-tint text-review-blue",
  PREPARING: "bg-amber-100 text-amber-900",
  SERVED: "bg-green-100 text-green-900",
  CANCELLED: "bg-gray-100 text-review-muted",
};
const button = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-medium disabled:opacity-50";

function VegMark({ isVeg }: { isVeg: boolean }) {
  return (
    <span role="img" aria-label={isVeg ? "Veg" : "Non-veg"} className={cn("inline-flex size-4 shrink-0 items-center justify-center rounded-sm border-2", isVeg ? "border-green-700" : "border-red-700")}>
      <span className={cn("size-1.5 rounded-full", isVeg ? "bg-green-700" : "bg-red-700")} />
    </span>
  );
}

const storageKey = (token: string) => `semsorted-tab:${token}`;
function readStored(token: string) {
  try {
    return window.localStorage.getItem(storageKey(token));
  } catch {
    return null;
  }
}
function storeSession(token: string, id: string) {
  try {
    window.localStorage.setItem(storageKey(token), id);
  } catch {}
}

export default function OrderClient({ token, tableLabel, shop, gstRateBp, menu, initial }: OrderClientProps) {
  const [status, setStatus] = useState(initial);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [vegOnly, setVegOnly] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [soldOut, setSoldOut] = useState<string[]>([]);
  const [partySize, setPartySize] = useState(initial.session?.partySize ?? 2);
  const [note, setNote] = useState("");
  const [view, setView] = useState<"menu" | "tab">(initial.orders.length ? "tab" : "menu");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [foodHere, setFoodHere] = useState(false);
  const cartRef = useRef<HTMLDialogElement>(null);
  const orderKey = useRef<string | null>(null);
  const versionRef = useRef(initial.version);
  const wasCooking = useRef(false);

  const items = useMemo(() => new Map(menu.flatMap((category) => category.items).map((item) => [item.id, item])), [menu]);
  const cartLines = Object.entries(cart).filter(([id, qty]) => qty > 0 && items.has(id)).map(([id, qty]) => ({ item: items.get(id)!, qty }));
  const cartCount = cartLines.reduce((sum, line) => sum + line.qty, 0);
  const cartTotal = cartLines.reduce((sum, line) => sum + line.qty * line.item.pricePaise, 0);
  const label = (thing: { name: string; nameHi: string | null }) => (lang === "hi" && thing.nameHi ? thing.nameHi : thing.name);
  const cooking = status.orders.some((order) => order.status === "RECEIVED" || order.status === "PREPARING");
  const paid = status.session?.status === "PAID";

  const refresh = useCallback(
    async (force = false) => {
      const sessionId = readStored(token);
      const query = new URLSearchParams({ ...(sessionId && { s: sessionId }), ...(!force && { v: versionRef.current }) });
      try {
        const res = await fetch(`/api/table/${token}/status?${query}`, { cache: "no-store" });
        if (res.status !== 200) return;
        const next: GuestStatus = await res.json();
        versionRef.current = next.version;
        setStatus(next);
      } catch {}
    },
    [token]
  );

  // Phones only ask while the page is on screen, so a pocketed phone costs nothing.
  useEffect(() => {
    void refresh(true);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    const onShow = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [refresh]);

  useEffect(() => {
    if (wasCooking.current && !cooking && status.orders.some((order) => order.status === "SERVED")) setFoodHere(true);
    wasCooking.current = cooking;
  }, [cooking, status.orders]);

  // Any change to the order is a new order, so it must not reuse the key of one that may already be in.
  const change = (id: string, delta: number) => {
    orderKey.current = null;
    setCart((current) => ({ ...current, [id]: Math.max(0, Math.min(20, (current[id] ?? 0) + delta)) }));
  };

  const placeOrder = async () => {
    if (!cartLines.length || sending) return;
    setSending(true);
    setMessage(null);
    orderKey.current ??= crypto.randomUUID();
    try {
      const res = await fetch("/api/table/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, key: orderKey.current, partySize, note: note || undefined, items: cartLines.map((line) => ({ itemId: line.item.id, qty: line.qty })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        storeSession(token, data.sessionId);
        orderKey.current = null;
        setCart({});
        setNote("");
        setFoodHere(false);
        cartRef.current?.close();
        setView("tab");
        await refresh(true);
        return;
      }
      if (res.status !== 503) orderKey.current = null;
      if (Array.isArray(data.unavailable)) {
        setSoldOut((current) => [...current, ...data.unavailable]);
        setCart((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !data.unavailable.includes(id))));
      }
      setMessage(data.error ?? "Your order did not go through. Please try again.");
    } catch {
      setMessage("No connection. Check your internet and try again.");
    } finally {
      setSending(false);
    }
  };

  const askBill = async () => {
    const sessionId = status.session?.id;
    if (!sessionId || sending) return;
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/table/bill", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, sessionId }) });
      if (!res.ok) setMessage((await res.json().catch(() => ({}))).error ?? "The bill did not open. Please try again.");
      storeSession(token, sessionId);
      await refresh(true);
    } catch {
      setMessage("No connection. Check your internet and try again.");
    } finally {
      setSending(false);
    }
  };

  const billLines = useMemo(() => {
    const lines = new Map<string, { name: string; qty: number; pricePaise: number }>();
    for (const order of status.orders.filter((order) => order.status !== "CANCELLED")) {
      for (const item of order.items) {
        const key = `${item.name}|${item.pricePaise}`;
        const line = lines.get(key) ?? { name: item.name, qty: 0, pricePaise: item.pricePaise };
        line.qty += item.qty;
        lines.set(key, line);
      }
    }
    return [...lines.values()];
  }, [status.orders]);

  const shownMenu = menu
    .map((category) => ({ ...category, items: category.items.filter((item) => !vegOnly || item.isVeg) }))
    .filter((category) => category.items.length > 0);

  return (
    <div className="review-surface min-h-dvh bg-white text-review-ink">
      <header className="sticky top-0 z-20 border-b border-review-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[32rem] items-center gap-3 px-4 py-3">
          {shop.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logoUrl} alt="" className="size-11 shrink-0 rounded-full border border-review-line bg-white object-contain p-0.5" />
          ) : (
            <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-medium text-white" style={{ backgroundColor: shop.primaryColor }}>
              {shop.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[1.0625rem] font-medium">{shop.name}</h1>
            <p className="text-sm text-review-muted">Table {tableLabel}</p>
          </div>
          <button type="button" onClick={() => setLang(lang === "en" ? "hi" : "en")} aria-label={lang === "en" ? "Show menu in Hindi" : "Show menu in English"} className="min-h-11 rounded-full border border-review-line px-3 text-sm font-medium">
            {lang === "en" ? "हिंदी" : "English"}
          </button>
        </div>
        {status.orders.length > 0 && (
          <nav aria-label="Order view" className="mx-auto grid w-full max-w-[32rem] grid-cols-2 px-4 pb-2">
            {(["menu", "tab"] as const).map((id) => (
              <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)} className={cn("min-h-11 border-b-2 text-sm font-medium", view === id ? "border-review-blue text-review-blue" : "border-transparent text-review-muted")}>
                {id === "menu" ? "Menu" : `Your orders (${status.orders.length})`}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-[32rem] px-4 pb-36 pt-4">
        {message && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{message}</p>}

        {view === "menu" ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={vegOnly} onChange={(event) => setVegOnly(event.target.checked)} className="size-5 accent-green-700" />
                Veg only
              </label>
              {gstRateBp > 0 && <p className="text-sm text-review-muted">Prices before GST</p>}
            </div>
            {shownMenu.length === 0 && <p className="mt-6 rounded-lg bg-review-tint p-4 text-review-muted">The menu is being updated. Please ask the staff.</p>}
            {shownMenu.map((category) => (
              <section key={category.id} aria-labelledby={`cat-${category.id}`} className="mt-5">
                <h2 id={`cat-${category.id}`} className="text-lg font-medium">{label(category)}</h2>
                <ul className="mt-2 divide-y divide-review-line">
                  {category.items.map((item) => {
                    const qty = cart[item.id] ?? 0;
                    const out = !item.isAvailable || soldOut.includes(item.id);
                    return (
                      <li key={item.id} className={cn("flex items-center gap-3 py-3", out && "opacity-50")}>
                        <VegMark isVeg={item.isVeg} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium" lang={lang === "hi" && item.nameHi ? "hi" : "en"}>{label(item)}</p>
                          <p className="text-sm text-review-muted">{out ? "Sold out" : formatPaise(item.pricePaise)}</p>
                        </div>
                        {out ? null : qty === 0 ? (
                          <button type="button" onClick={() => change(item.id, 1)} aria-label={`Add ${item.name}`} className="min-h-11 min-w-20 rounded-lg border border-review-blue px-4 font-medium text-review-blue">
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center rounded-lg bg-review-blue text-white">
                            <button type="button" onClick={() => change(item.id, -1)} aria-label={`Remove one ${item.name}`} className="flex size-11 items-center justify-center"><Minus aria-hidden className="size-4" /></button>
                            <span aria-live="polite" className="min-w-6 text-center font-medium tabular-nums">{qty}</span>
                            <button type="button" onClick={() => change(item.id, 1)} aria-label={`Add one more ${item.name}`} className="flex size-11 items-center justify-center"><Plus aria-hidden className="size-4" /></button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </>
        ) : (
          <>
            {foodHere && (
              <p role="status" className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 font-medium text-green-900">
                <ChefHat aria-hidden className="size-5" /> Your food is here. Enjoy!
              </p>
            )}
            {paid ? (
              <section className="rounded-xl border border-review-line p-5 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100 text-green-800"><Check aria-hidden className="size-6" /></span>
                <h2 className="mt-3 text-xl font-medium">Paid. Thank you!</h2>
                <p className="mt-1 text-review-muted">We hope to see you again at {shop.name}.</p>
                {status.reviewUrl && (
                  <a href={status.reviewUrl} className={cn(button, "mt-4 w-full bg-review-blue text-white")}>
                    <Star aria-hidden className="size-5" /> Review us on Google
                  </a>
                )}
              </section>
            ) : (
              <ul className="space-y-3">
                {status.orders.map((order, index) => (
                  <li key={order.id} className="rounded-xl border border-review-line p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-medium">Order {index + 1}</h2>
                      <span className={cn("rounded-full px-2.5 py-1 text-sm font-medium", STATUS_TONE[order.status])}>{STATUS_TEXT[order.status] ?? order.status}</span>
                    </div>
                    <ul className="mt-2 space-y-1 text-[0.9375rem]">
                      {order.items.map((item) => (
                        <li key={item.name} className="flex items-center gap-2">
                          <VegMark isVeg={item.isVeg} />
                          <span className="flex-1">{item.qty} × {item.name}</span>
                          <span className="tabular-nums text-review-muted">{formatPaise(item.qty * item.pricePaise)}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}

            {cooking && !paid && (
              <section className="mt-6 rounded-xl bg-review-tint/60 p-4">
                <WaitingGames partySize={status.session?.partySize ?? partySize} />
              </section>
            )}

            {status.bill && !paid && (
              <section aria-labelledby="bill-title" className="mt-6 rounded-xl border border-review-line p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 id="bill-title" className="flex items-center gap-2 text-lg font-medium"><ReceiptText aria-hidden className="size-5" /> Your bill</h2>
                  {status.bill.billNo && <span className="text-sm text-review-muted">No. {status.bill.billNo}</span>}
                </div>
                <dl className="mt-3 space-y-1 text-[0.9375rem]">
                  {billLines.map((line) => (
                    <div key={`${line.name}${line.pricePaise}`} className="flex justify-between gap-3">
                      <dt>{line.qty} × {line.name}</dt>
                      <dd className="tabular-nums">{formatPaise(line.qty * line.pricePaise)}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-3 border-t border-review-line pt-2"><dt>Subtotal</dt><dd className="tabular-nums">{formatPaise(status.bill.subtotalPaise)}</dd></div>
                  {status.bill.gstRateBp > 0 && (
                    <>
                      <div className="flex justify-between gap-3 text-review-muted"><dt>CGST {status.bill.gstRateBp / 200}%</dt><dd className="tabular-nums">{formatPaise(status.bill.cgstPaise)}</dd></div>
                      <div className="flex justify-between gap-3 text-review-muted"><dt>SGST {status.bill.gstRateBp / 200}%</dt><dd className="tabular-nums">{formatPaise(status.bill.sgstPaise)}</dd></div>
                    </>
                  )}
                  {status.bill.roundOffPaise !== 0 && (
                    <div className="flex justify-between gap-3 text-review-muted"><dt>Round off</dt><dd className="tabular-nums">{status.bill.roundOffPaise > 0 ? "+" : "−"}{formatPaise(Math.abs(status.bill.roundOffPaise))}</dd></div>
                  )}
                  <div className="flex justify-between gap-3 border-t border-review-line pt-2 text-lg font-medium"><dt>Total</dt><dd className="tabular-nums">{formatPaise(status.bill.totalPaise)}</dd></div>
                </dl>
                {(status.bill.gstin || status.bill.fssai) && (
                  <p className="mt-2 text-xs text-review-muted">
                    {status.bill.gstin && <>GSTIN {status.bill.gstin}<br /></>}
                    {status.bill.fssai && <>FSSAI Lic. No. {status.bill.fssai}</>}
                  </p>
                )}
                {status.bill.upiQr ? (
                  <div className="mt-4 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={status.bill.upiQr} alt={`UPI QR to pay ${formatPaise(status.bill.totalPaise)}`} className="mx-auto block size-52 rounded-xl border border-review-line" />
                    <p className="mt-2 text-sm text-review-muted">Scan with any UPI app, or pay cash to the staff.</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-review-muted">Please pay at the counter or to the staff.</p>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-review-line bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto flex w-full max-w-[32rem] gap-2 px-4">
          {view === "menu" ? (
            <button type="button" disabled={!cartCount} onClick={() => cartRef.current?.showModal()} className={cn(button, "w-full bg-review-blue text-white")}>
              <ShoppingBag aria-hidden className="size-5" />
              {cartCount ? `View order: ${cartCount} ${cartCount === 1 ? "item" : "items"}, ${formatPaise(cartTotal)}` : "Add dishes to order"}
            </button>
          ) : paid ? (
            <button type="button" onClick={() => setView("menu")} className={cn(button, "w-full border border-review-line text-review-blue")}>See the menu</button>
          ) : (
            <>
              <button type="button" onClick={() => setView("menu")} className={cn(button, "flex-1 border border-review-blue text-review-blue")}>
                <Plus aria-hidden className="size-5" /> Order more
              </button>
              <button type="button" onClick={askBill} disabled={sending || status.bill?.status === "BILL_REQUESTED" || status.orders.every((order) => order.status === "CANCELLED")} className={cn(button, "flex-1 bg-review-blue text-white")}>
                <ReceiptText aria-hidden className="size-5" /> {status.bill ? "Bill ready" : "Get bill"}
              </button>
            </>
          )}
        </div>
      </div>

      <dialog ref={cartRef} aria-labelledby="cart-title" className="m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-2xl bg-white p-0 text-review-ink backdrop:bg-black/50 sm:m-auto sm:max-w-[30rem] sm:rounded-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-review-line bg-white px-4 py-3">
          <h2 id="cart-title" className="text-lg font-medium">Your order</h2>
          <button type="button" aria-label="Close" onClick={() => cartRef.current?.close()} className="flex size-11 items-center justify-center rounded-full"><X aria-hidden className="size-5" /></button>
        </div>
        <div className="space-y-4 p-4">
          <ul className="divide-y divide-review-line">
            {cartLines.map(({ item, qty }) => (
              <li key={item.id} className="flex items-center gap-3 py-2">
                <VegMark isVeg={item.isVeg} />
                <span className="min-w-0 flex-1">{label(item)}</span>
                <div className="flex items-center rounded-lg border border-review-line">
                  <button type="button" onClick={() => change(item.id, -1)} aria-label={`Remove one ${item.name}`} className="flex size-11 items-center justify-center"><Minus aria-hidden className="size-4" /></button>
                  <span className="min-w-6 text-center tabular-nums">{qty}</span>
                  <button type="button" onClick={() => change(item.id, 1)} aria-label={`Add one more ${item.name}`} className="flex size-11 items-center justify-center"><Plus aria-hidden className="size-4" /></button>
                </div>
                <span className="w-20 text-right tabular-nums">{formatPaise(qty * item.pricePaise)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3">
            <span id="party-label" className="font-medium">People at the table</span>
            <div role="group" aria-labelledby="party-label" className="flex items-center rounded-lg border border-review-line">
              <button type="button" onClick={() => setPartySize((n) => Math.max(1, n - 1))} aria-label="One person less" className="flex size-11 items-center justify-center"><Minus aria-hidden className="size-4" /></button>
              <span aria-live="polite" className="min-w-8 text-center font-medium tabular-nums">{partySize}</span>
              <button type="button" onClick={() => setPartySize((n) => Math.min(20, n + 1))} aria-label="One person more" className="flex size-11 items-center justify-center"><Plus aria-hidden className="size-4" /></button>
            </div>
          </div>
          <p className="-mt-2 text-sm text-review-muted">We pick games for your group while the food cooks.</p>
          <label className="block">
            <span className="font-medium">Note for the kitchen</span>
            <input value={note} onChange={(event) => { orderKey.current = null; setNote(event.target.value); }} maxLength={140} placeholder="Less spicy, no onion" className="mt-1 block min-h-12 w-full rounded-lg border border-review-line px-3 text-base outline-none focus:border-review-blue focus:ring-1 focus:ring-review-blue" />
          </label>
          {message && <p role="alert" className="text-sm font-medium text-red-800">{message}</p>}
          <button type="button" onClick={placeOrder} disabled={!cartLines.length || sending} className={cn(button, "w-full bg-review-blue text-white")}>
            {sending ? "Sending to kitchen" : `Place order, ${formatPaise(cartTotal)}`}
          </button>
          {gstRateBp > 0 && <p className="text-center text-sm text-review-muted">GST is added on the bill.</p>}
        </div>
      </dialog>
    </div>
  );
}
