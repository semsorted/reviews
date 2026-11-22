"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChartNoAxesCombined, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { shopTone, TONE_CLASS } from "@/lib/admin/tones";
import { cn } from "@/lib/utils";

export interface ShopRow {
  id: string;
  name: string;
  businessCategory: string;
  isActive: boolean;
  qrCount: number;
  scans: number;
  drafts: number;
  copied: number;
  google: number;
  rating: number | null;
  lastActivity: string | null;
  open: number;
}

const columns = "lg:grid-cols-[minmax(0,2.3fr)_repeat(6,minmax(3.5rem,0.72fr))_8.25rem]";

export function ShopList({ shops, range }: { shops: ShopRow[]; range: string }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? shops.filter((shop) => `${shop.name} ${shop.businessCategory}`.toLowerCase().includes(needle))
      : shops;
  }, [query, shops]);

  return (
    <div>
      <div className="relative max-w-sm">
        <Search aria-hidden className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-moss" />
        <Input aria-label="Search shops" placeholder="Search shops" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-paper">
        <div className={cn("hidden gap-3 border-b border-line px-5 py-3 text-sm font-semibold text-moss lg:grid", columns)}>
          <span>Shop</span>
          <span className="text-right">Scans</span>
          <span className="text-right">Reviews</span>
          <span className="text-right">Copied</span>
          <span className="text-right">Google</span>
          <span className="text-right">Rating</span>
          <span className="text-right">Open</span>
          <span />
        </div>
        <ul className="divide-y divide-line">
          {visible.map((shop) => (
            <li key={shop.id} className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-5 py-3.5", columns)}>
              <span className="flex min-w-0 items-center gap-3">
                <span aria-hidden className={cn("flex size-10 shrink-0 items-center justify-center rounded-l-sm rounded-r-lg font-display text-lg font-semibold shadow-[inset_4px_0_6px_-4px_rgb(0_0_0/0.4)]", TONE_CLASS[shopTone(shop.id)])}>
                  {shop.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{shop.name}</span>
                  <span className="block truncate text-sm text-moss">{shop.isActive ? "Live" : "Paused"}, {shop.lastActivity ? `last activity ${shop.lastActivity}` : "no activity yet"}</span>
                </span>
              </span>
              <span className="hidden text-right tabular-nums lg:block">{shop.scans}</span>
              <span className="hidden text-right tabular-nums lg:block">{shop.drafts}</span>
              <span className="hidden text-right tabular-nums lg:block">{shop.copied}</span>
              <span className="hidden text-right tabular-nums lg:block">{shop.google}</span>
              <span className="hidden text-right tabular-nums lg:block">{shop.rating?.toFixed(1) ?? "None"}</span>
              <span className={cn("hidden text-right tabular-nums lg:block", shop.open > 0 && "font-bold text-g-red")}>{shop.open}</span>
              <Link
                href={{ pathname: `/admin/shops/${shop.id}`, query: { range } }}
                aria-label={`View tracking for ${shop.name}`}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 justify-self-end rounded-full bg-g-blue-tint px-3.5 text-sm font-semibold text-g-blue hover:bg-g-blue hover:text-white"
              >
                <ChartNoAxesCombined aria-hidden className="size-4" /> <span className="max-sm:sr-only">Tracking</span>
              </Link>
              <span className="col-span-2 text-sm tabular-nums text-moss lg:hidden">
                {shop.scans} scans, {shop.drafts} reviews, {shop.google} sent to Google, {shop.open} open
              </span>
            </li>
          ))}
        </ul>
        {visible.length === 0 && <p className="px-5 py-8 text-moss">No shops match “{query}”.</p>}
      </div>
    </div>
  );
}
