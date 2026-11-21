"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Check, ExternalLink, RefreshCw, Star } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { copyDraft, copyViaCommand } from "@/lib/reviews/copy-draft";
import { MAX_CHIPS, MIN_CHIPS } from "@/lib/reviews/rules";
import { cn } from "@/lib/utils";

export interface CustomerReviewClientProps {
  token: string;
  sessionId: string;
  shop: {
    name: string;
    businessCategory: string;
    logoUrl: string | null;
    primaryColor: string;
    googleReviewUrl: string;
  };
  chips: { id: string; label: string }[];
}

const RATING_WORDS = ["", "Poor", "Below average", "Okay", "Good", "Excellent"];

function monogramTextColor(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#14211d" : "#ffffff";
}

export default function CustomerReviewClient({ token, sessionId, shop, chips }: CustomerReviewClientProps) {
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [draft, setDraft] = useState<{ id: string; key: string } | null>(null);
  const [draftText, setDraftText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const slipRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const selectionKey = `${rating}:${[...selected].sort().join(",")}`;
  const canGenerate = rating > 0 && selected.length >= MIN_CHIPS;
  const hasDraft = Boolean(draft) && draftText.trim().length > 0;
  const isDraftCurrent = draft?.key === selectionKey;
  const atLimit = selected.length >= MAX_CHIPS;

  useEffect(() => {
    if (!draft) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    slipRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }, [draft]);

  const track = (eventType: "copy_click" | "regenerate_click" | "google_review_click") => {
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ token, sessionId, eventType, draftId: draft?.id }),
    }).catch(() => {});
  };

  const toggleChip = (id: string) => {
    setCopyState("idle");
    setSelected((current) => {
      if (current.includes(id)) return current.filter((chipId) => chipId !== id);
      return current.length >= MAX_CHIPS ? current : [...current, id];
    });
  };

  const generate = async (isRegeneration = false) => {
    if (!canGenerate || isLoading) return;
    setIsLoading(true);
    setError(null);
    setCopyState("idle");
    if (isRegeneration) track("regenerate_click");

    try {
      const res = await fetch("/api/review/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, sessionId, rating, chipIds: selected }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.draftText) {
        setError(data?.error ?? "Could not write your review. Try again.");
        return;
      }
      setDraft({ id: data.draftId, key: selectionKey });
      setDraftText(data.draftText);
    } catch {
      setError("No connection. Check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectDraft = () => {
    textRef.current?.focus();
    textRef.current?.select();
  };

  // Copying must start inside the link click, before the browser leaves this page.
  const copyAndContinue = (event: MouseEvent<HTMLAnchorElement>) => {
    if (copyViaCommand(draftText)) {
      setCopyState("copied");
      track("copy_click");
      track("google_review_click");
      return;
    }
    if (copyState !== "idle") {
      track("google_review_click");
      return;
    }

    event.preventDefault();
    void copyDraft(draftText, navigator.clipboard).then((copied) => {
      setCopyState(copied ? "copied" : "manual");
      if (copied) track("copy_click");
      else selectDraft();
    });
  };

  return (
    <div className="min-h-dvh bg-mist">
      <main className="mx-auto w-full max-w-[30rem] px-5 pb-44 pt-6">
        <header className="flex items-center gap-3">
          {shop.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logoUrl} alt="" className="size-12 rounded-xl bg-paper object-cover" />
          ) : (
            <div
              aria-hidden
              className="flex size-12 items-center justify-center rounded-xl font-display text-xl font-bold"
              style={{ backgroundColor: shop.primaryColor, color: monogramTextColor(shop.primaryColor) }}
            >
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{shop.name}</p>
            <p className="truncate text-sm leading-tight text-moss">{shop.businessCategory}</p>
          </div>
        </header>

        <fieldset className="mt-9">
          <legend className="contents">
            <h1 className="text-[2.35rem] font-bold">How was your visit?</h1>
          </legend>
          <div className="-ml-1.5 mt-4 flex items-center">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className="flex size-12 cursor-pointer items-center justify-center rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-pine">
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => {
                    setRating(value);
                    setCopyState("idle");
                  }}
                  className="sr-only"
                  aria-label={`${value} out of 5, ${RATING_WORDS[value]}`}
                />
                <Star
                  aria-hidden
                  strokeWidth={1.75}
                  className={cn(
                    "size-9 transition-colors",
                    value <= rating ? "fill-marigold text-marigold" : "fill-transparent text-moss/50"
                  )}
                />
              </label>
            ))}
            <span aria-live="polite" className="ml-2 font-semibold text-moss">
              {RATING_WORDS[rating]}
            </span>
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="contents">
            <h2 className="text-xl font-semibold">{rating > 0 && rating <= 2 ? "What should improve?" : "What stood out?"}</h2>
          </legend>
          <p className="mt-1 text-sm text-moss" aria-live="polite">
            {atLimit ? `You picked ${MAX_CHIPS}. Remove one to change it.` : `Pick ${MIN_CHIPS} to ${MAX_CHIPS}.`}
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {chips.map((chip) => {
              const isSelected = selected.includes(chip.id);
              const isDisabled = atLimit && !isSelected;
              return (
                <label
                  key={chip.id}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-pine",
                    isSelected ? "border-pine bg-pine text-white" : "border-line bg-paper text-ink hover:border-pine",
                    isDisabled && "cursor-not-allowed opacity-45 hover:border-line"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => toggleChip(chip.id)}
                    className="sr-only"
                  />
                  {isSelected && <Check aria-hidden className="size-4" strokeWidth={2.5} />}
                  {chip.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="mt-5 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {draft && (
          <section ref={slipRef} aria-labelledby="draft-title" className="slip mt-8 scroll-mt-6">
            <div className="flex items-center justify-between gap-2 px-4 pt-3">
              <h2 id="draft-title" className="text-lg font-semibold">
                Your review
              </h2>
              <button
                type="button"
                onClick={() => generate(true)}
                disabled={isLoading || !canGenerate}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-pine disabled:opacity-45"
              >
                <RefreshCw aria-hidden className={cn("size-4", isLoading && "animate-spin motion-reduce:animate-none")} />
                {isDraftCurrent ? "Rewrite" : "Update"}
              </button>
            </div>
            <div className="mx-4 border-t border-dashed border-line" />
            <label htmlFor="draft" className="sr-only">
              Edit your review
            </label>
            <textarea
              id="draft"
              ref={textRef}
              value={draftText}
              maxLength={2000}
              rows={4}
              onChange={(event) => {
                setDraftText(event.target.value);
                setCopyState("idle");
              }}
              className="slip-text block max-h-72 w-full resize-none bg-transparent px-4 py-3 text-[1.05rem] leading-relaxed outline-none"
            />
            <p className="px-4 text-sm text-moss">
              {isDraftCurrent ? "Change anything so it sounds like you." : "Your choices changed. Tap Update to match them."}
            </p>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-mist/95 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-[30rem] px-5">
          {hasDraft ? (
            <>
              <a
                href={shop.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={copyAndContinue}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                {copyState === "copied" ? <Check aria-hidden className="size-5" /> : <ExternalLink aria-hidden className="size-5" />}
                {copyState === "copied" ? "Copied. Open Google" : copyState === "manual" ? "Open Google" : "Copy & Next"}
              </a>
              <p role="status" className="mt-1.5 text-center text-sm text-moss">
                {copyState === "manual"
                  ? "Copy the selected text, then paste it on Google."
                  : "On Google, tap your stars, paste, and post."}
              </p>
            </>
          ) : (
            <Button size="lg" onClick={() => generate()} disabled={!canGenerate} isLoading={isLoading}>
              {isLoading ? "Writing your review" : draft ? "Update my review" : "Write my review"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
