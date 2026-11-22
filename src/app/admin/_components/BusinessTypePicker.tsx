"use client";

import { useState } from "react";
import { Search, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SHOP_TYPE_GROUPS, SHOP_TYPES } from "@/lib/reviews/catalog";
import { cn } from "@/lib/utils";
import { BUSINESS_GROUPS } from "./business-groups";

const pill = "inline-flex min-h-11 items-center rounded-full border border-line bg-paper px-4 font-medium hover:border-g-blue hover:bg-g-blue-tint";

export function BusinessTypePicker({ value, onChoose }: { value: string; onChoose: (type: string) => void }) {
  const [isOpen, setIsOpen] = useState(!value);
  const [group, setGroup] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const choose = (type: string) => {
    onChoose(type);
    setIsOpen(false);
    setQuery("");
    setGroup(null);
  };

  if (!isOpen) {
    const selected = SHOP_TYPES.find((type) => type.label === value);
    const style = selected && BUSINESS_GROUPS[selected.group];
    const Icon = style?.icon ?? Store;
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-paper p-2.5">
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", style?.tint ?? "bg-mist text-moss")}><Icon aria-hidden className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{value}</span>
          <span className="block truncate text-sm text-moss">{style?.label ?? "Custom type"}</span>
        </span>
        <button type="button" onClick={() => setIsOpen(true)} className="min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-g-blue hover:bg-g-blue-tint">Change</button>
      </div>
    );
  }

  const needle = query.trim().toLowerCase();
  const types = needle ? SHOP_TYPES.filter((type) => type.label.toLowerCase().includes(needle)) : SHOP_TYPES.filter((type) => type.group === group);
  const custom = query.trim();
  const canUseCustom = custom.length >= 2 && custom.length <= 60 && !SHOP_TYPES.some((type) => type.label.toLowerCase() === custom.toLowerCase());

  return (
    <div>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-moss" />
        <Input aria-label="Search business type" placeholder="Search clinic, salon, bakery" maxLength={60} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && event.preventDefault()} className="pl-10" />
      </div>

      {value && (
        <button type="button" onClick={() => setIsOpen(false)} className="mt-2 min-h-11 text-sm font-semibold text-g-blue hover:underline">Keep {value}</button>
      )}

      {!needle && !group && (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SHOP_TYPE_GROUPS.map((key) => {
            const { label, icon: Icon, tint } = BUSINESS_GROUPS[key];
            return (
              <li key={key}>
                <button type="button" onClick={() => setGroup(key)} className="flex min-h-24 w-full flex-col items-start justify-between gap-2 rounded-xl border border-line bg-paper p-3 text-left font-semibold leading-tight hover:border-g-blue">
                  <span className={cn("flex size-9 items-center justify-center rounded-lg", tint)}><Icon aria-hidden className="size-[1.125rem]" /></span>
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {(needle || group) && (
        <div className="mt-3">
          {!needle && group && (
            <button type="button" onClick={() => setGroup(null)} className="mb-2 min-h-11 text-sm font-semibold text-g-blue hover:underline">All categories</button>
          )}
          <ul className="flex flex-wrap gap-2">
            {types.map((type) => (
              <li key={type.label}><button type="button" onClick={() => choose(type.label)} className={pill}>{type.label}</button></li>
            ))}
            {canUseCustom && (
              <li><button type="button" onClick={() => choose(custom)} className={cn(pill, "border-dashed")}>Use “{custom}”</button></li>
            )}
          </ul>
          {!types.length && !canUseCustom && <p className="text-sm text-moss">Type at least 2 letters.</p>}
        </div>
      )}
    </div>
  );
}
