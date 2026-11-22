"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Check, RefreshCw, Star } from "lucide-react";
import type { ReviewLanguage } from "@/lib/ai/provider.interface";
import { copyDraft, copyViaCommand } from "@/lib/reviews/copy-draft";
import { seededRandom, writeInstantDraft } from "@/lib/reviews/instant-draft";
import { MAX_CHIPS, MIN_CHIPS } from "@/lib/reviews/rules";
import { cn } from "@/lib/utils";

export interface CustomerReviewClientProps {
  token: string;
  sessionId: string;
  language: ReviewLanguage;
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
const actionClass =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-base font-medium";

function monogramTextColor(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#1f2328" : "#ffffff";
}

export default function CustomerReviewClient({ token, sessionId, language, shop, chips }: CustomerReviewClientProps) {
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [draftText, setDraftText] = useState("");
  const [variant, setVariant] = useState(0);
  const [isEdited, setIsEdited] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const recordRef = useRef<Promise<string | null> | null>(null);
  const syncRef = useRef(0);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const didRevealDraft = useRef(false);

  const hasDraft = draftText.trim().length > 0;
  const isReady = rating > 0 && selected.length >= MIN_CHIPS;
  const atLimit = selected.length >= MAX_CHIPS;

  useEffect(() => {
    if (!hasDraft || didRevealDraft.current) return;
    didRevealDraft.current = true;
    draftRef.current?.scrollIntoView({ block: "nearest" });
  }, [hasDraft]);

  const writeDraft = (nextRating: number, nextSelected: string[], nextVariant: number) =>
    writeInstantDraft(
      {
        shopName: shop.name,
        rating: nextRating,
        chips: nextSelected.map((id) => chips.find((chip) => chip.id === id)!.label),
        language,
      },
      seededRandom(`${sessionId}:${nextVariant}`)
    );

  // The draft is already on screen. This background check only swaps it if this shop has used it before.
  const recordDraft = (nextRating: number, nextSelected: string[], nextVariant: number, shownText: string) => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    const syncId = ++syncRef.current;
    syncTimer.current = setTimeout(() => {
      recordRef.current = fetch("/api/review/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ token, sessionId, rating: nextRating, variant: nextVariant, chipIds: nextSelected }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (syncId === syncRef.current && data?.text) {
            setDraftText((current) => (current === shownText ? data.text : current));
          }
          return data?.draftId ?? null;
        })
        .catch(() => null);
    }, 120);
  };

  const track = (eventType: "copy_click" | "regenerate_click" | "google_review_click") => {
    void (recordRef.current ?? Promise.resolve(null))
      .then((draftId) =>
        fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({ token, sessionId, eventType, draftId: draftId ?? undefined, edited: eventType === "copy_click" && isEdited ? true : undefined }),
        })
      )
      .catch(() => {});
  };

  const applySelection = (nextRating: number, nextSelected: string[]) => {
    setRating(nextRating);
    setSelected(nextSelected);
    setCopyState("idle");
    if (isEdited) {
      setIsStale(true);
      return;
    }
    const ready = nextRating > 0 && nextSelected.length >= MIN_CHIPS;
    const nextText = ready ? writeDraft(nextRating, nextSelected, variant) : "";
    setDraftText(nextText);
    if (ready) recordDraft(nextRating, nextSelected, variant, nextText);
  };

  const toggleChip = (id: string) => {
    if (selected.includes(id)) applySelection(rating, selected.filter((chipId) => chipId !== id));
    else if (!atLimit) applySelection(rating, [...selected, id]);
  };

  const changeWording = () => {
    if (!isReady) return;
    const nextVariant = variant + 1;
    setVariant(nextVariant);
    const nextText = writeDraft(rating, selected, nextVariant);
    setDraftText(nextText);
    setIsEdited(false);
    setIsStale(false);
    setCopyState("idle");
    recordDraft(rating, selected, nextVariant, nextText);
    track("regenerate_click");
  };

  const selectDraft = () => {
    textRef.current?.focus();
    textRef.current?.select();
  };

  // Copying must start inside the link click, before the browser leaves this page.
  const copyAndContinue = (event: MouseEvent<HTMLAnchorElement>) => {
    syncRef.current++; // Never change the text after the customer has copied it.
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

  const hint =
    copyState === "manual"
      ? "Copy the selected text, then paste it on Google."
      : copyState === "copied"
        ? "Copied. Paste it on Google and tap Post."
        : hasDraft
          ? "Google opens next. Paste your review and post it."
          : rating === 0
            ? "Tap a star to start."
            : `Pick ${Math.max(MIN_CHIPS - selected.length, 1)} more to write your review.`;

  return (
    <div className="review-surface min-h-dvh bg-white text-review-ink">
      <main className="mx-auto w-full max-w-[28rem] px-5 pb-44 pt-5">
        <header className="flex items-center gap-3">
          {shop.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logoUrl} alt="" className="size-11 rounded-full object-cover" />
          ) : (
            <div
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-medium"
              style={{ backgroundColor: shop.primaryColor, color: monogramTextColor(shop.primaryColor) }}
            >
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-[1.0625rem] font-medium">{shop.name}</h1>
            <p className="truncate text-sm text-review-muted">{shop.businessCategory}</p>
          </div>
        </header>

        <fieldset className="mt-5 border-t border-review-line pt-6 text-center">
          <legend className="contents">
            <h2 className="text-lg font-medium">How was your visit?</h2>
          </legend>
          <div className="mt-3 flex justify-center">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                className="flex size-13 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-review-blue"
              >
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => applySelection(value, selected)}
                  className="sr-only"
                  aria-label={`${value} out of 5, ${RATING_WORDS[value]}`}
                />
                <Star
                  aria-hidden
                  strokeWidth={1.5}
                  className={cn("size-10", value <= rating ? "fill-review-star text-review-star" : "fill-transparent text-review-muted/60")}
                />
              </label>
            ))}
          </div>
          <p aria-live="polite" className="mt-1 h-6 text-sm text-review-muted">
            {RATING_WORDS[rating]}
          </p>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="contents">
            <h2 className="font-medium">{rating > 0 && rating <= 2 ? "What should improve?" : "What stood out?"}</h2>
          </legend>
          <p className="mt-0.5 text-sm text-review-muted" aria-live="polite">
            {atLimit ? `You picked ${MAX_CHIPS}. Remove one to change it.` : `Pick ${MIN_CHIPS} to ${MAX_CHIPS}`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => {
              const isSelected = selected.includes(chip.id);
              const isDisabled = atLimit && !isSelected;
              return (
                <label
                  key={chip.id}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 text-[0.9375rem] font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-review-blue",
                    isSelected ? "border-review-tint bg-review-tint text-review-blue" : "border-review-line bg-white",
                    isDisabled && "cursor-not-allowed opacity-40"
                  )}
                >
                  <input type="checkbox" checked={isSelected} disabled={isDisabled} onChange={() => toggleChip(chip.id)} className="sr-only" />
                  {isSelected && <Check aria-hidden className="size-4" strokeWidth={2.5} />}
                  {chip.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        {hasDraft && (
          <section ref={draftRef} className="mt-6 scroll-mb-44">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="draft" className="font-medium">
                Your review
              </label>
              <button
                type="button"
                onClick={changeWording}
                disabled={!isReady}
                className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-review-blue disabled:opacity-40"
              >
                <RefreshCw aria-hidden className="size-4" />
                {isStale ? "Update" : "Change wording"}
              </button>
            </div>
            <textarea
              id="draft"
              ref={textRef}
              value={draftText}
              maxLength={2000}
              rows={4}
              onChange={(event) => {
                setDraftText(event.target.value);
                setIsEdited(event.target.value.trim().length > 0);
                setCopyState("idle");
              }}
              className="slip-text mt-1 block max-h-72 w-full resize-none rounded-lg border border-review-line bg-white p-3.5 text-base leading-relaxed outline-none focus:border-review-blue focus:ring-1 focus:ring-review-blue"
            />
            <p className="mt-1.5 text-sm text-review-muted">
              {isStale ? "Your choices changed. Tap Update to match them." : "Edit anything so it sounds like you."}
            </p>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-review-line bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-[28rem] px-5">
          {hasDraft ? (
            <a
              href={shop.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={copyAndContinue}
              className={cn(actionClass, "bg-review-blue text-white")}
            >
              {copyState === "copied" && <Check aria-hidden className="size-5" />}
              {copyState === "copied" ? "Copied. Open Google" : copyState === "manual" ? "Open Google" : "Copy & Next"}
            </a>
          ) : (
            <button type="button" disabled className={cn(actionClass, "bg-review-line/70 text-review-muted")}>
              Copy &amp; Next
            </button>
          )}
          <p role="status" className="mt-1.5 text-center text-sm text-review-muted">
            {hint}
          </p>
        </div>
      </div>
    </div>
  );
}
