"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { STORIES, STORY_UI, type Story, type StoryLanguage } from "./content";
import { activePage, leafTurn } from "./flip";
import { LanguageTabs } from "./StoryReader";

const TONES: Record<Story["tone"], string> = {
  blue: "bg-g-blue text-white",
  red: "bg-g-red text-white",
  green: "bg-g-green text-white",
  yellow: "bg-g-yellow text-ink",
  night: "bg-[#174ea6] text-white",
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const FLIP_KEY = "semsorted-page-flip";
const FLIP_EVENT = "semsorted-page-flip-change";

function subscribeToMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  window.addEventListener(FLIP_EVENT, onChange);
  return () => {
    query.removeEventListener("change", onChange);
    window.removeEventListener(FLIP_EVENT, onChange);
  };
}

function readFlipChoice() {
  try {
    return window.localStorage.getItem(FLIP_KEY) === "on";
  } catch {
    return false;
  }
}

function saveFlipChoice(on: boolean) {
  try {
    if (on) window.localStorage.setItem(FLIP_KEY, "on");
    else window.localStorage.removeItem(FLIP_KEY);
  } catch {
    // Without storage, the page simply keeps the visitor's system motion setting.
  }
  window.dispatchEvent(new Event(FLIP_EVENT));
}

function TitlePage({ story, index, language }: { story: Story; index: number; language: StoryLanguage }) {
  const text = story.text[language];
  return (
    <div lang={language === "hi" ? "hi" : "en"} className={cn("relative flex h-full flex-col justify-between overflow-hidden p-8 xl:p-12", TONES[story.tone])}>
      <svg aria-hidden viewBox="-2 -2 52 52" className="absolute -right-[12%] -top-[14%] h-[105%] opacity-[0.13]">
        <path fill="none" stroke="currentColor" strokeWidth="8.5" d="M34 14A10 10 0 1 0 24 24A10 10 0 1 1 14 34" />
      </svg>
      <p className="relative text-lg font-medium opacity-90">{STORY_UI[language].chapter} {index + 1}</p>
      <div className="relative">
        <p className="text-lg font-medium opacity-90">{text.trade}</p>
        <p className="mt-2 font-display text-[clamp(2.75rem,4.6vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.025em]">{text.title}</p>
      </div>
    </div>
  );
}

export function StoryBook({ id = "kahani" }: { id?: string }) {
  const count = STORIES.length;
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const leaves = useRef<(HTMLDivElement | null)[]>([]);
  const [language, setLanguage] = useState<StoryLanguage>("hinglish");
  const [active, setActive] = useState(0);
  const reduced = useSyncExternalStore(subscribeToMotion, () => window.matchMedia(REDUCED_MOTION).matches, () => false);
  const flipChosen = useSyncExternalStore(subscribeToMotion, readFlipChoice, () => false);
  const animated = !reduced || flipChosen;

  useEffect(() => {
    if (!animated) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!section.current || !stage.current) return;
      const travelled = stage.current.getBoundingClientRect().top - section.current.getBoundingClientRect().top;
      const range = section.current.offsetHeight - stage.current.offsetHeight;
      const progress = range > 0 ? travelled / range : 0;
      leaves.current.forEach((leaf, index) => {
        if (!leaf) return;
        const turn = leafTurn(progress, index, count);
        leaf.style.setProperty("--turn", String(turn));
        leaf.style.setProperty("--shade", String(Math.sin(Math.PI * turn)));
        leaf.style.zIndex = String(turn >= 0.5 ? index + 1 : count - index + 1);
      });
      setActive(activePage(progress, count));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [animated, count]);

  const goTo = (page: number) => {
    if (!section.current || !stage.current) return;
    const range = section.current.offsetHeight - stage.current.offsetHeight;
    const top = section.current.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(stage.current).top);
    window.scrollTo({ top: top + (page / (count - 1)) * range });
  };

  return (
    <section ref={section} id={id} aria-labelledby={`${id}-title`} data-flip={reduced && flipChosen ? "on" : undefined} className="book-scroll scroll-mt-[4.5rem] bg-night text-white" style={{ "--count": count } as React.CSSProperties}>
      <div ref={stage} className="book-stage mx-auto max-w-[90rem] px-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h2 id={`${id}-title`} className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold">Dukaan ki kahaniyan</h2>
          <div className="flex flex-wrap items-center gap-2">
            {reduced && (
              <button
                type="button"
                aria-pressed={flipChosen}
                onClick={() => {
                  saveFlipChoice(!flipChosen);
                  requestAnimationFrame(() => goTo(0));
                }}
                className="min-h-10 rounded-full border border-white/30 px-4 text-sm font-semibold hover:bg-white/10"
              >
                {flipChosen ? "Page flip band karo" : "Page flip chalu karo"}
              </button>
            )}
            <LanguageTabs language={language} onChange={setLanguage} dark />
          </div>
        </div>

        <div className="book">
          <div aria-hidden className="book-left">
            <TitlePage story={STORIES[0]} index={0} language={language} />
          </div>
          {STORIES.map((story, index) => {
            const text = story.text[language];
            const next = STORIES[index + 1];
            return (
              <div
                key={story.slug}
                ref={(node) => {
                  leaves.current[index] = node;
                }}
                inert={animated && index !== active}
                className="book-leaf"
                style={{ zIndex: count - index + 1 }}
              >
                <article lang={language === "hi" ? "hi" : "en"} className="book-face flex flex-col bg-white text-ink">
                  <div className={cn("book-band px-6 py-5", TONES[story.tone])}>
                    <p className="text-sm font-medium opacity-90">{STORY_UI[language].chapter} {index + 1}, {text.trade}</p>
                    <h3 className="mt-1 text-[2rem] font-semibold">{text.title}</h3>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 p-6 xl:p-10">
                    <p className="book-teaser leading-[1.5]">{text.teaser}</p>
                    <div className="book-full space-y-2.5 leading-[1.55] text-ink/90">
                      {text.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                    <div>
                      <Link href={`/stories/${story.slug}`} className="inline-flex min-h-11 items-center font-semibold text-g-blue underline decoration-g-blue/30 underline-offset-[5px] hover:decoration-g-blue">
                        {STORY_UI[language].read}
                      </Link>
                      <p className="text-xs text-moss">{STORY_UI[language].note}</p>
                    </div>
                  </div>
                  <span aria-hidden className="book-shade" />
                </article>
                {next && (
                  <div aria-hidden className="book-face book-back">
                    <TitlePage story={next} index={index + 1} language={language} />
                    <span className="book-shade" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="book-controls flex items-center justify-between gap-3">
          <div role="group" aria-label="Choose a story" className="flex gap-1">
            {STORIES.map((story, index) => (
              <button
                key={story.slug}
                type="button"
                aria-label={`${STORY_UI[language].chapter} ${index + 1}: ${story.text[language].title}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => goTo(index)}
                className={cn("size-10 rounded-full text-sm font-semibold transition-colors", index === active ? "bg-white text-night" : "text-white/70 hover:bg-white/10 hover:text-white")}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => window.scrollTo({ top: (section.current?.getBoundingClientRect().bottom ?? 0) + window.scrollY - 72 })} className="min-h-10 px-2 text-sm font-medium text-white/80 underline underline-offset-4 hover:text-white">
            Skip stories
          </button>
        </div>
      </div>
    </section>
  );
}
