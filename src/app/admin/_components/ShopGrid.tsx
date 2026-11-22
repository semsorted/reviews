"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, ChartNoAxesCombined, QrCode, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { shopTone, TONE_CLASS } from "@/lib/admin/tones";
import { cn } from "@/lib/utils";
import type { ShopRow } from "./ShopList";

export function ShopGrid({ shops }: { shops: ShopRow[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? shops.filter((shop) => `${shop.name} ${shop.businessCategory}`.toLowerCase().includes(needle)) : shops;
  }, [query, shops]);

  return (
    <div>
      <div className="relative max-w-sm">
        <Search aria-hidden className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-moss" />
        <Input aria-label="Search shops" placeholder="Search shops" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" />
      </div>
      {visible.length ? (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((shop) => (
            <li key={shop.id} className={cn("relative flex min-h-64 flex-col justify-between overflow-hidden rounded-l-md rounded-r-2xl p-5 pl-6 shadow-[inset_10px_0_14px_-8px_rgb(0_0_0/0.4),0_16px_28px_-20px_rgb(6_24_56/0.7)]", TONE_CLASS[shopTone(shop.id)])}>
              <svg aria-hidden viewBox="-2 -2 52 52" className="absolute -right-8 -top-8 size-48 opacity-[0.13]">
                <path fill="none" stroke="currentColor" strokeWidth="8.5" d="M34 14A10 10 0 1 0 24 24A10 10 0 1 1 14 34" />
              </svg>
              <div className="relative">
                <div className="flex items-center justify-between gap-2 text-sm font-medium">
                  <span className="truncate opacity-95">{shop.businessCategory}</span>
                  <span className="shrink-0 rounded-full bg-black/15 px-2 py-0.5 text-xs font-semibold">{shop.isActive ? "Live" : "Paused"}</span>
                </div>
                <h2 className="mt-3 break-words font-display text-[1.9rem] font-semibold leading-[1.05]">{shop.name}</h2>
              </div>
              <div className="relative mt-5">
                <dl className="grid grid-cols-3 gap-2 text-sm">
                  <div><dt className="opacity-90">Scans</dt><dd className="text-xl font-semibold tabular-nums">{shop.scans}</dd></div>
                  <div><dt className="opacity-90">Google</dt><dd className="text-xl font-semibold tabular-nums">{shop.google}</dd></div>
                  <div><dt className="inline-flex items-center gap-1 opacity-90"><BellRing aria-hidden className="size-3" />Open</dt><dd className="text-xl font-semibold tabular-nums">{shop.open}</dd></div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/admin/shops/${shop.id}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-ink hover:bg-white/90">
                    <ChartNoAxesCombined aria-hidden className="size-4" /> Tracking
                  </Link>
                  <Link href={`/admin/shops/${shop.id}?tab=manage`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-current px-4 text-sm font-semibold hover:bg-black/10">
                    <QrCode aria-hidden className="size-4" /> QR and chips
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-2xl bg-paper px-5 py-8 text-moss">No shops match “{query}”.</p>
      )}
    </div>
  );
}
