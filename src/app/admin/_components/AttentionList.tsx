"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, ExternalLink, MessageSquareText, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AttentionItem } from "@/lib/admin/attention";
import { cn } from "@/lib/utils";
import { adminRequest } from "./request";

function AttentionCard({ item, showShop }: { item: AttentionItem; showShop: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState(item.ownerNote);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOpen = item.status === "OPEN";

  const save = async (status: "OPEN" | "RESOLVED") => {
    setBusy(true);
    setError(null);
    const result = await adminRequest(`/api/admin/attention/${item.id}`, "PATCH", { status, ownerNote: note });
    setBusy(false);
    if (result.ok) router.refresh();
    else setError(result.error);
  };

  return (
    <article className={cn("overflow-hidden rounded-2xl bg-paper", isOpen ? "border-l-[6px] border-g-red" : "border-l-[6px] border-g-green")}>
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            {showShop && (
              <Link href={`/admin/shops/${item.shopId}?tab=attention`} className="block truncate text-lg font-semibold hover:text-g-blue">{item.shopName}</Link>
            )}
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="flex" role="img" aria-label={`${item.rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} aria-hidden className={cn("size-4", star <= item.rating ? "fill-g-yellow text-g-yellow" : "fill-transparent text-line")} />
                ))}
              </span>
              <span className="text-sm text-moss">{item.when}</span>
            </div>
          </div>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", isOpen ? "bg-g-red-tint text-g-red" : "bg-g-green-tint text-g-green")}>
            {isOpen ? <CircleAlert aria-hidden className="size-3.5" /> : <CircleCheck aria-hidden className="size-3.5" />}
            {isOpen ? "Open" : "Resolved"}
          </span>
        </div>

        {item.message ? (
          <blockquote className="mt-4 rounded-xl bg-g-yellow-tint p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-moss"><MessageSquareText aria-hidden className="size-3.5" /> Private message from customer</p>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-[1.05rem] leading-relaxed">{item.message}</p>
          </blockquote>
        ) : (
          <p className="mt-4 rounded-xl bg-mist p-3 text-sm text-moss">Customer gave a low rating but did not send a private message.</p>
        )}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-moss">
          {item.chips && <span>Chose: {item.chips}</span>}
          <span className="inline-flex items-center gap-1">
            <ExternalLink aria-hidden className="size-3.5" />
            {item.wentToGoogle ? "Opened Google review page" : "Has not opened Google"}
          </span>
        </div>

        <label className="mt-4 block text-sm font-medium">
          Owner note
          <textarea
            value={note}
            maxLength={1000}
            rows={2}
            placeholder="What did you do about this?"
            onChange={(event) => setNote(event.target.value)}
            className="slip-text mt-1 block max-h-40 w-full resize-none rounded-lg border border-line bg-white p-3 text-base font-normal outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue"
          />
        </label>
        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {isOpen ? (
            <Button type="button" size="sm" isLoading={busy} onClick={() => save("RESOLVED")} className="bg-g-green hover:bg-g-green/90">
              <CircleCheck aria-hidden className="size-4" /> Mark resolved
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" isLoading={busy} onClick={() => save("OPEN")}>
              <RotateCcw aria-hidden className="size-4" /> Reopen
            </Button>
          )}
          {!isOpen && item.resolvedWhen && <span className="text-sm text-moss">Resolved {item.resolvedWhen}</span>}
        </div>
      </div>
    </article>
  );
}

export function AttentionList({ items, showShop = true }: { items: AttentionItem[]; showShop?: boolean }) {
  return <div className="space-y-4">{items.map((item) => <AttentionCard key={`${item.id}:${item.status}`} item={item} showShop={showShop} />)}</div>;
}

export function ShopFilter({ shops, value, status }: { shops: { id: string; name: string }[]; value: string; status: string }) {
  const router = useRouter();
  return (
    <label className="block">
      <span className="sr-only">Filter by shop</span>
      <select
        value={value}
        onChange={(event) => {
          const query = new URLSearchParams({ status });
          if (event.target.value) query.set("shop", event.target.value);
          router.push(`/admin/attention?${query}`);
        }}
        className="h-11 max-w-full rounded-full border border-line bg-paper px-4 font-medium outline-none focus:border-g-blue"
      >
        <option value="">All shops</option>
        {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
      </select>
    </label>
  );
}
