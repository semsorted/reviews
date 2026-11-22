"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
}

const columns = "md:grid-cols-[minmax(0,2.2fr)_repeat(5,minmax(3.75rem,0.8fr))_minmax(7.5rem,1.1fr)_4.5rem]";

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

      <div className="mt-4 overflow-hidden rounded-xl bg-paper">
        <div className={cn("hidden gap-3 border-b border-line px-5 py-3 text-sm font-semibold text-moss md:grid", columns)}>
          <span>Shop</span>
          <span className="text-right">Scans</span>
          <span className="text-right">Reviews</span>
          <span className="text-right">Copied</span>
          <span className="text-right">Google</span>
          <span className="text-right">Rating</span>
          <span className="text-right">Last activity</span>
          <span className="text-right">Status</span>
        </div>
        <ul className="divide-y divide-line">
          {visible.map((shop) => (
            <li key={shop.id}>
              <Link
                href={{ pathname: `/admin/shops/${shop.id}`, query: { range } }}
                className={cn("grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 px-5 py-3.5 hover:bg-mist/60 md:items-center", columns)}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{shop.name}</span>
                  <span className="block truncate text-sm text-moss">{shop.businessCategory}, {shop.qrCount} QR</span>
                </span>
                <span className="hidden text-right tabular-nums md:block">{shop.scans}</span>
                <span className="hidden text-right tabular-nums md:block">{shop.drafts}</span>
                <span className="hidden text-right tabular-nums md:block">{shop.copied}</span>
                <span className="hidden text-right tabular-nums md:block">{shop.google}</span>
                <span className="hidden text-right tabular-nums md:block">{shop.rating?.toFixed(1) ?? "None"}</span>
                <span className="hidden text-right text-sm text-moss md:block">{shop.lastActivity ?? "No activity"}</span>
                <span className={cn("text-right text-sm font-semibold", shop.isActive ? "text-pine" : "text-moss")}>
                  {shop.isActive ? "Live" : "Paused"}
                </span>
                <span className="col-span-2 text-sm tabular-nums text-moss md:hidden">
                  {shop.scans} scans, {shop.drafts} reviews, {shop.copied} copied, {shop.google} sent to Google
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {visible.length === 0 && <p className="px-5 py-8 text-moss">No shops match “{query}”.</p>}
      </div>
    </div>
  );
}
