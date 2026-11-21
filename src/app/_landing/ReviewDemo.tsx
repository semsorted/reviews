"use client";

import { useState } from "react";
import { Check, RefreshCw, Star } from "lucide-react";
import { seededRandom, writeInstantDraft } from "@/lib/reviews/instant-draft";
import { MAX_CHIPS, MIN_CHIPS } from "@/lib/reviews/rules";
import { cn } from "@/lib/utils";

const SHOP = "Sunrise Bakery";

export function ReviewDemo({ chips }: { chips: string[] }) {
  const [rating, setRating] = useState(5);
  const [selected, setSelected] = useState([chips[0], chips[2]]);
  const [variant, setVariant] = useState(0);
  const [copied, setCopied] = useState(false);

  const ready = selected.length >= MIN_CHIPS;
  const draft = ready ? writeInstantDraft({ shopName: SHOP, rating, chips: selected, language: "en" }, seededRandom(`demo:${variant}`)) : "";

  const toggle = (chip: string) => {
    setCopied(false);
    setSelected((current) => (current.includes(chip) ? current.filter((item) => item !== chip) : current.length < MAX_CHIPS ? [...current, chip] : current));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft);
    } catch {
      // The preview still shows the next step when clipboard access is blocked.
    }
    setCopied(true);
  };

  return (
    <div className="review-surface w-[min(100%,20.5rem)] rounded-[2.75rem] bg-[#15171a] p-2 shadow-[0_32px_64px_-20px_rgb(6_24_56/0.65)]">
      <div className="relative flex min-h-[37rem] flex-col rounded-[2.35rem] bg-white px-5 pb-5 pt-10 text-review-ink">
        <span aria-hidden className="absolute left-1/2 top-3 h-5 w-20 -translate-x-1/2 rounded-full bg-[#15171a]" />
        <p className="text-lg font-medium">{SHOP}</p>
        <p className="text-sm text-review-muted">Sample shop preview</p>

        <div role="group" aria-label="Choose a rating" className="-ml-1 mt-4 flex">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              aria-pressed={rating === value}
              onClick={() => {
                setRating(value);
                setCopied(false);
              }}
              className="flex size-11 items-center justify-center"
            >
              <Star aria-hidden className={cn("size-8", value <= rating ? "fill-review-star text-review-star" : "fill-transparent text-review-line")} strokeWidth={1.5} />
            </button>
          ))}
        </div>

        <p className="mt-3 text-sm font-medium">What did you notice?</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((chip) => {
            const on = selected.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                aria-pressed={on}
                disabled={!on && selected.length >= MAX_CHIPS}
                onClick={() => toggle(chip)}
                className={cn(
                  "inline-flex min-h-9 items-center gap-1 rounded-lg border px-2.5 text-sm font-medium transition-colors disabled:opacity-40",
                  on ? "border-review-tint bg-review-tint text-review-blue" : "border-review-line text-review-ink"
                )}
              >
                {on && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
                {chip}
              </button>
            );
          })}
        </div>

        <div aria-live="polite" className="mt-3 min-h-[6.75rem] flex-1 rounded-xl bg-mist p-3 text-[0.9rem] leading-snug">
          {ready ? draft : <span className="text-review-muted">Choose at least {MIN_CHIPS} things.</span>}
        </div>

        <button
          type="button"
          disabled={!ready}
          onClick={() => {
            setVariant((value) => value + 1);
            setCopied(false);
          }}
          className="mt-1 inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-medium text-review-blue disabled:opacity-40"
        >
          <RefreshCw aria-hidden className="size-3.5" />
          Change wording
        </button>

        <button type="button" disabled={!ready} onClick={copy} className="min-h-12 rounded-full bg-review-blue font-medium text-white transition-colors hover:bg-pine-deep disabled:opacity-40">
          {copied ? "Copied" : "Copy & Next"}
        </button>
        <p role="status" className="mt-1.5 min-h-4 text-center text-xs text-review-muted">
          {copied ? "On a real QR, Google opens here." : ""}
        </p>
      </div>
    </div>
  );
}
