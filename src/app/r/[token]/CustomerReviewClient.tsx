"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { Check, RefreshCw, Star } from "lucide-react";
import type { ReviewLanguage } from "@/lib/ai/provider.interface";
import { copyDraft, copyViaCommand } from "@/lib/reviews/copy-draft";
import { seededRandom, writeInstantDraft } from "@/lib/reviews/instant-draft";
import { readReviewDone, saveReviewDone, type ReviewDone } from "@/lib/reviews/review-done";
import { MAX_CHIPS, MIN_CHIPS } from "@/lib/reviews/rules";
import { cn } from "@/lib/utils";
import { COPY } from "./copy";

export interface CustomerReviewClientProps {
  token: string;
  sessionId: string;
  language: ReviewLanguage;
  headline: string;
  shop: {
    name: string;
    businessCategory: string;
    logoUrl: string | null;
    primaryColor: string;
    googleReviewUrl: string;
  };
  chips: { id: string; label: string }[];
}

const LANGUAGES: { id: ReviewLanguage; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिंदी" },
  { id: "hinglish", label: "Hinglish" },
];
const actionClass =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-base font-medium";

function monogramTextColor(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#1f2328" : "#ffffff";
}

const tabStorage = () => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};
const noSubscription = () => () => {};
const doneNow = (kind: ReviewDone["kind"], text: string): ReviewDone => ({ kind, text, at: Date.now() });

function ShopMark({ shop }: { shop: CustomerReviewClientProps["shop"] }) {
  return shop.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={shop.logoUrl} alt="" className="size-11 shrink-0 rounded-full border border-review-line bg-white object-contain p-0.5" />
  ) : (
    <div
      aria-hidden
      className="flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-medium"
      style={{ backgroundColor: shop.primaryColor, color: monogramTextColor(shop.primaryColor) }}
    >
      {shop.name.charAt(0).toUpperCase()}
    </div>
  );
}

function DoneScreen({ done, shop, onGoogle }: { done: ReviewDone; shop: CustomerReviewClientProps["shop"]; onGoogle: () => void }) {
  const [copied, setCopied] = useState(false);
  const isGoogle = done.kind === "google";
  const copyAgain = () => {
    if (copyViaCommand(done.text)) setCopied(true);
    else void copyDraft(done.text, navigator.clipboard).then(setCopied);
  };

  return (
    <div className="review-surface min-h-dvh bg-white text-review-ink">
      <main className="mx-auto flex min-h-dvh w-full max-w-[28rem] flex-col items-center justify-center px-6 py-10 text-center">
        <ShopMark shop={shop} />
        <p className="mt-2 max-w-full truncate text-sm text-review-muted">{shop.name}</p>
        <span className="mt-6 flex size-14 items-center justify-center rounded-full bg-review-tint text-review-blue">
          <Check aria-hidden className="size-7" strokeWidth={2.5} />
        </span>
        <h1 className="mt-4 text-2xl font-medium">{isGoogle ? COPY.doneTitle : COPY.sentTitle}</h1>
        <p className="mt-2 max-w-[22rem] leading-relaxed text-review-muted">{isGoogle ? COPY.doneText : COPY.sentText}</p>
        <div className="mt-6 w-full space-y-2">
          <button type="button" onClick={onGoogle} className={cn(actionClass, isGoogle ? "bg-review-blue text-white" : "border border-review-blue text-review-blue")}>
            {isGoogle ? COPY.openAgain : COPY.postGoogle}
          </button>
          {isGoogle && (
            <button type="button" onClick={copyAgain} className={cn(actionClass, "border border-review-line text-review-blue")}>
              {copied && <Check aria-hidden className="size-5" />}
              {copied ? COPY.copiedAgain : COPY.copyAgain}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CustomerReviewClient({ token, sessionId, language: defaultLanguage, headline, shop, chips }: CustomerReviewClientProps) {
  const savedDone = useSyncExternalStore(noSubscription, () => readReviewDone(tabStorage(), token), () => null);
  const restoredDone = useMemo<ReviewDone | null>(() => (savedDone ? JSON.parse(savedDone) : null), [savedDone]);
  const [finished, setFinished] = useState<ReviewDone | null>(null);
  const [language, setLanguage] = useState(defaultLanguage);
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [draftText, setDraftText] = useState("");
  const [variant, setVariant] = useState(0);
  const [isEdited, setIsEdited] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const [privateState, setPrivateState] = useState<"idle" | "sending" | "error">("idle");
  const recordRef = useRef<Promise<string | null> | null>(null);
  const syncRef = useRef(0);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const didRevealDraft = useRef(false);

  const copy = COPY;
  const hasDraft = draftText.trim().length > 0;
  const isReady = rating > 0 && selected.length >= MIN_CHIPS;
  const atLimit = selected.length >= MAX_CHIPS;
  const isLowRating = rating > 0 && rating <= 2;
  const done = finished ?? restoredDone;

  useEffect(() => {
    if (!hasDraft || didRevealDraft.current) return;
    didRevealDraft.current = true;
    draftRef.current?.scrollIntoView({ block: "nearest" });
  }, [hasDraft]);

  const writeDraft = (nextRating: number, nextSelected: string[], nextVariant: number, nextLanguage: ReviewLanguage) =>
    writeInstantDraft(
      {
        shopName: shop.name,
        rating: nextRating,
        chips: nextSelected.map((id) => chips.find((chip) => chip.id === id)!.label),
        language: nextLanguage,
      },
      seededRandom(`${sessionId}:${nextVariant}`)
    );

  // The draft is already on screen. This background check only swaps it if this shop has used it before.
  const recordDraft = (nextRating: number, nextSelected: string[], nextVariant: number, nextLanguage: ReviewLanguage, shownText: string) => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    const syncId = ++syncRef.current;
    syncTimer.current = setTimeout(() => {
      recordRef.current = fetch("/api/review/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ token, sessionId, rating: nextRating, variant: nextVariant, language: nextLanguage, chipIds: nextSelected }),
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

  const track = (eventType: "copy_click" | "regenerate_click" | "google_review_click") =>
    (recordRef.current ?? Promise.resolve(null))
      .then((draftId) =>
        fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({ token, sessionId, eventType, draftId: draftId ?? undefined, edited: eventType === "copy_click" && isEdited ? true : undefined }),
        })
      )
      .catch(() => {});

  const finish = (next: ReviewDone) => {
    saveReviewDone(tabStorage(), token, next);
    setFinished(next);
  };

  // Replace removes this page from history, so Back from Google cannot reopen the review form.
  const leaveForGoogle = async (text: string, wasCopied: boolean) => {
    finish(doneNow("google", text));
    const events = wasCopied ? [track("copy_click"), track("google_review_click")] : [track("google_review_click")];
    await Promise.race([Promise.allSettled(events), new Promise((resolve) => setTimeout(resolve, 300))]);
    window.location.replace(shop.googleReviewUrl);
  };

  const applySelection = (nextRating: number, nextSelected: string[], nextLanguage = language) => {
    setRating(nextRating);
    setSelected(nextSelected);
    setLanguage(nextLanguage);
    setCopyState("idle");
    if (isEdited) {
      setIsStale(true);
      return;
    }
    const ready = nextRating > 0 && nextSelected.length >= MIN_CHIPS;
    const nextText = ready ? writeDraft(nextRating, nextSelected, variant, nextLanguage) : "";
    setDraftText(nextText);
    if (ready) recordDraft(nextRating, nextSelected, variant, nextLanguage, nextText);
  };

  const toggleChip = (id: string) => {
    if (selected.includes(id)) applySelection(rating, selected.filter((chipId) => chipId !== id));
    else if (!atLimit) applySelection(rating, [...selected, id]);
  };

  const changeWording = () => {
    if (!isReady) return;
    const nextVariant = variant + 1;
    setVariant(nextVariant);
    const nextText = writeDraft(rating, selected, nextVariant, language);
    setDraftText(nextText);
    setIsEdited(false);
    setIsStale(false);
    setCopyState("idle");
    recordDraft(rating, selected, nextVariant, language, nextText);
    void track("regenerate_click");
  };

  const selectDraft = () => {
    textRef.current?.focus();
    textRef.current?.select();
  };

  // Copying must start inside the click, before the browser leaves this page.
  const copyAndContinue = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    syncRef.current++; // Never change the text after the customer has copied it.
    if (copyViaCommand(draftText)) {
      setCopyState("copied");
      void leaveForGoogle(draftText, true);
      return;
    }
    if (copyState !== "idle") {
      void leaveForGoogle(draftText, false);
      return;
    }

    void copyDraft(draftText, navigator.clipboard).then((copied) => {
      setCopyState(copied ? "copied" : "manual");
      if (copied) void leaveForGoogle(draftText, true);
      else selectDraft();
    });
  };

  const sendToUs = async () => {
    if (!hasDraft || privateState === "sending") return;
    syncRef.current++;
    setPrivateState("sending");
    try {
      const res = await fetch("/api/review/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, sessionId, rating, message: draftText.trim().slice(0, 1000) }),
      });
      if (!res.ok) return setPrivateState("error");
      setPrivateState("idle");
      finish(doneNow("private", draftText));
    } catch {
      setPrivateState("error");
    }
  };

  const openGoogleFromDone = (text: string) => {
    if (copyViaCommand(text)) void leaveForGoogle(text, true);
    else void copyDraft(text, navigator.clipboard).then((copied) => leaveForGoogle(text, copied));
  };

  if (done) return <DoneScreen done={done} shop={shop} onGoogle={() => openGoogleFromDone(done.text)} />;

  const hint =
    copyState === "manual"
      ? copy.hintManual
      : copyState === "copied"
        ? copy.hintCopied
        : hasDraft
          ? isLowRating
            ? copy.hintLow
            : copy.hintReady
          : rating === 0
            ? copy.hintStart
            : copy.hintMore(Math.max(MIN_CHIPS - selected.length, 1));

  return (
    <div className="review-surface min-h-dvh bg-white text-review-ink">
      <main className="mx-auto w-full max-w-[28rem] px-5 pb-44 pt-5">
        <header className="flex items-center gap-3">
          <ShopMark shop={shop} />
          <div className="min-w-0">
            <h1 className="truncate text-[1.0625rem] font-medium">{shop.name}</h1>
            <p className="truncate text-sm text-review-muted">{shop.businessCategory}</p>
          </div>
        </header>

        <fieldset className="mt-5 border-t border-review-line pt-4">
          <legend className="contents">
            <h2 className="text-center text-sm font-medium text-review-muted">{copy.chooseLanguage}</h2>
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {LANGUAGES.map((option) => {
              const isChosen = language === option.id;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center justify-center gap-1 rounded-lg border px-1 text-[0.9375rem] font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-review-blue",
                    isChosen ? "border-review-blue bg-review-tint text-review-blue" : "border-review-line bg-white"
                  )}
                >
                  <input type="radio" name="language" value={option.id} checked={isChosen} onChange={() => applySelection(rating, selected, option.id)} className="sr-only" />
                  {isChosen && <Check aria-hidden className="size-4 shrink-0" strokeWidth={2.5} />}
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-5 border-t border-review-line pt-5 text-center">
          <legend className="contents">
            <h2 className="text-lg font-medium">{headline}</h2>
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
                  aria-label={`${value}/5, ${copy.ratings[value]}`}
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
            {copy.ratings[rating]}
          </p>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="contents">
            <h2 className="font-medium">{isLowRating ? copy.improve : copy.standOut}</h2>
          </legend>
          <p className="mt-0.5 text-sm text-review-muted" aria-live="polite">
            {atLimit ? copy.picked(MAX_CHIPS) : copy.pick(MIN_CHIPS, MAX_CHIPS)}
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
                {copy.yourReview}
              </label>
              <button
                type="button"
                onClick={changeWording}
                disabled={!isReady}
                className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-review-blue disabled:opacity-40"
              >
                <RefreshCw aria-hidden className="size-4" />
                {isStale ? copy.update : copy.changeWording}
              </button>
            </div>
            <textarea
              id="draft"
              lang={language === "hi" ? "hi" : "en"}
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
              {isStale ? copy.staleHint : copy.editHint}
            </p>
          </section>
        )}

      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-review-line bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-[28rem] px-5">
          {hasDraft && isLowRating ? (
            // Both stay the same size: Google does not allow discouraging low-rating reviews.
            <div className="grid grid-cols-2 gap-2">
              <a href={shop.googleReviewUrl} rel="noreferrer" onClick={copyAndContinue} className={cn(actionClass, "border border-review-blue px-3 text-review-blue")}>
                {copy.postGoogle}
              </a>
              <button type="button" onClick={sendToUs} disabled={privateState === "sending"} className={cn(actionClass, "bg-review-blue px-3 text-white disabled:opacity-60")}>
                {privateState === "sending" ? copy.sending : copy.send}
              </button>
            </div>
          ) : hasDraft ? (
            <a
              href={shop.googleReviewUrl}
              rel="noreferrer"
              onClick={copyAndContinue}
              className={cn(actionClass, "bg-review-blue text-white")}
            >
              {copyState === "copied" && <Check aria-hidden className="size-5" />}
              {copyState === "copied" ? copy.copiedOpen : copyState === "manual" ? copy.openGoogle : copy.copyNext}
            </a>
          ) : (
            <button type="button" disabled className={cn(actionClass, "bg-review-line/70 text-review-muted")}>
              {copy.copyNext}
            </button>
          )}
          {privateState === "error" && <p role="alert" className="mt-1.5 text-center text-sm text-danger">{copy.privateError}</p>}
          <p role="status" className="mt-1.5 text-center text-sm text-review-muted">
            {hint}
          </p>
        </div>
      </div>
    </div>
  );
}
