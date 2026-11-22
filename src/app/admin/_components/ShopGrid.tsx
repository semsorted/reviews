"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BellRing, CalendarClock, QrCode, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { shopTone, TONE_CLASS } from "@/lib/admin/tones";
import { cn } from "@/lib/utils";
import type { ShopRow } from "./ShopList";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "ending", label: "Ending soon" },
  { id: "expired", label: "Expired" },
] as const;
const TIME_PILL = { active: "bg-black/15", ending: "bg-white text-ink", expired: "bg-white text-g-red" };

export function ShopGrid({ shops }: { shops: ShopRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shops
      .filter((shop) => (filter === "all" || shop.subscription.state === filter) && `${shop.name} ${shop.businessCategory}`.toLowerCase().includes(needle))
      .sort((a, b) => a.subscription.endsAt.localeCompare(b.subscription.endsAt));
  }, [filter, query, shops]);

  return (
    <div>
      <div className="relative max-w-sm">
        <Search aria-hidden className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-moss" />
        <Input aria-label="Search businesses" placeholder="Search businesses" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" />
      </div>
      <div role="group" aria-label="Filter by subscription" className="mt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={cn("inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold", filter === item.id ? "bg-night text-white" : "bg-paper text-moss hover:text-ink")}
          >
            {item.label}
            <span className="tabular-nums opacity-80">{item.id === "all" ? shops.length : shops.filter((shop) => shop.subscription.state === item.id).length}</span>
          </button>
        ))}
      </div>
      {visible.length ? (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((shop) => (
            <li key={shop.id} className={cn("group relative flex min-h-64 flex-col justify-between overflow-hidden rounded-l-md rounded-r-2xl p-5 pl-6 shadow-[inset_10px_0_14px_-8px_rgb(0_0_0/0.4),0_16px_28px_-20px_rgb(6_24_56/0.7)] transition-transform focus-within:ring-4 focus-within:ring-g-blue/40 hover:-translate-y-0.5", TONE_CLASS[shopTone(shop.id)])}>
              <svg aria-hidden viewBox="-2 -2 52 52" className="absolute -right-8 -top-8 size-48 opacity-[0.13]">
                <path fill="none" stroke="currentColor" strokeWidth="8.5" d="M34 14A10 10 0 1 0 24 24A10 10 0 1 1 14 34" />
              </svg>
              <div>
                <div className="relative flex items-center justify-between gap-2 text-sm font-medium">
                  <span className="truncate opacity-95">{shop.businessCategory}</span>
                  <span className="shrink-0 rounded-full bg-black/15 px-2 py-0.5 text-xs font-semibold">{shop.subscription.state === "expired" ? "Expired" : shop.isActive ? "Live" : "Paused"}</span>
                </div>
                <h2 className="relative mt-3 break-words font-display text-[1.9rem] font-semibold leading-[1.05]">
                  <Link href={`/admin/shops/${shop.id}`} className="outline-none after:absolute after:-inset-[100vmax] after:z-[5]">{shop.name}</Link>
                </h2>
                <p className={cn("relative mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold", TIME_PILL[shop.subscription.state])}>
                  <CalendarClock aria-hidden className="size-3.5" /> {shop.subscription.label}
                </p>
              </div>
              <div className="relative mt-5">
                <dl className="grid grid-cols-3 gap-2 text-sm">
                  <div><dt className="opacity-90">Scans</dt><dd className="text-xl font-semibold tabular-nums">{shop.scans}</dd></div>
                  <div><dt className="opacity-90">Google</dt><dd className="text-xl font-semibold tabular-nums">{shop.google}</dd></div>
                  <div><dt className="inline-flex items-center gap-1 opacity-90"><BellRing aria-hidden className="size-3" />Issues</dt><dd className="text-xl font-semibold tabular-nums">{shop.open}</dd></div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span aria-hidden className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-ink">
                    Open <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                  <Link href={`/admin/shops/${shop.id}?tab=manage`} className="relative z-10 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-current px-4 text-sm font-semibold hover:bg-black/10">
                    <QrCode aria-hidden className="size-4" /> QR and print
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-2xl bg-paper px-5 py-8 text-moss">No businesses match this search.</p>
      )}
    </div>
  );
}
