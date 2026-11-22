"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubscriptionInfo } from "@/lib/subscription";
import { cn } from "@/lib/utils";

export interface RenewalItem {
  id: string;
  name: string;
  subscription: SubscriptionInfo;
}

const STORAGE_KEY = "semsorted-renewal-popup";
const signature = (item: RenewalItem) => `${item.id}:${item.subscription.state}`;

function readSeen(today: string): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return saved?.day === today && Array.isArray(saved.seen) ? saved.seen : [];
  } catch {
    return [];
  }
}

/** Opens once a day, and again the same day only if another business needs renewal. */
export function RenewalPopup({ items, today }: { items: RenewalItem[]; today: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const seenRef = useRef<string[]>([]);

  useEffect(() => {
    const seen = new Set([...readSeen(today), ...seenRef.current]);
    if (items.some((item) => !seen.has(signature(item))) && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [items, today]);

  const remember = () => {
    seenRef.current = [...new Set([...readSeen(today), ...seenRef.current, ...items.map(signature)])];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: today, seen: seenRef.current }));
    } catch {}
  };

  if (!items.length) return null;
  const expired = items.filter((item) => item.subscription.state === "expired").length;

  return (
    <dialog ref={dialogRef} onClose={remember} aria-labelledby="renewal-title" className="m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl bg-paper p-0 text-ink backdrop:bg-night/55 print:hidden">
      <div className={cn("flex items-start gap-3 p-5", expired ? "bg-g-red text-white" : "bg-g-yellow text-ink")}>
        <CalendarClock aria-hidden className="mt-0.5 size-6 shrink-0" />
        <div>
          <h2 id="renewal-title" className="text-2xl font-semibold leading-tight">
            {items.length} {items.length === 1 ? "subscription needs" : "subscriptions need"} renewal
          </h2>
          <p className="mt-1 text-sm">{expired ? `${expired} expired. Their QR codes are stopped.` : "These end within 30 days."}</p>
        </div>
      </div>
      <ul className="max-h-[50dvh] divide-y divide-line overflow-y-auto">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={`/admin/shops/${item.id}`} onClick={() => dialogRef.current?.close()} className="flex min-h-16 items-center gap-3 px-5 py-2.5 hover:bg-mist">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{item.name}</span>
                <span className="block text-sm text-moss">{item.subscription.state === "expired" ? "Ended" : "Ends"} {item.subscription.endsOn}</span>
              </span>
              <span className={cn("shrink-0 text-sm font-semibold", item.subscription.state === "expired" && "text-g-red")}>{item.subscription.label}</span>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-moss" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex justify-end border-t border-line p-3">
        <Button type="button" variant="ghost" onClick={() => dialogRef.current?.close()}>Later</Button>
      </div>
    </dialog>
  );
}
