"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TONES, type Story, type StoryLanguage } from "./content";
import { activePage, leafTurn } from "./flip";

export type FlipPage = { id: string; tone: Story["tone"]; eyebrow: string; label?: string; title: string; language: StoryLanguage; body: ReactNode };

function TitlePage({ page }: { page: FlipPage }) {
  return (
    <div lang={page.language === "hi" ? "hi" : "en"} className={cn("relative flex h-full flex-col justify-between overflow-hidden p-8 xl:p-12", TONES[page.tone])}>
      <svg aria-hidden viewBox="-2 -2 52 52" className="absolute -right-[12%] -top-[14%] h-[105%] opacity-[0.13]">
        <path fill="none" stroke="currentColor" strokeWidth="8.5" d="M34 14A10 10 0 1 0 24 24A10 10 0 1 1 14 34" />
      </svg>
      <p className="relative text-lg font-medium opacity-90">{page.eyebrow}</p>
      <div className="relative">
        {page.label && <p className="text-lg font-medium opacity-90">{page.label}</p>}
        <p className="mt-2 font-display text-[clamp(2.75rem,4.6vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.025em]">{page.title}</p>
      </div>
    </div>
  );
}

type Props = {
  id: string;
  title: string;
  as?: "h1" | "h2";
  controls: ReactNode;
  pages: FlipPage[];
  skipLabel: string;
  onSkip?: () => void;
};

export function FlipBook({ id, title, as: Heading = "h2", controls, pages, skipLabel, onSkip }: Props) {
  const count = pages.length;
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const leaves = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
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
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [count]);

  const goTo = (page: number) => {
    if (!section.current || !stage.current) return;
    const range = section.current.offsetHeight - stage.current.offsetHeight;
    const top = section.current.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(stage.current).top);
    window.scrollTo({ top: top + (page / (count - 1)) * range });
  };

  const skip = () => {
    if (onSkip) return onSkip();
    window.scrollTo({ top: (section.current?.getBoundingClientRect().bottom ?? 0) + window.scrollY - 72 });
  };

  return (
    <section ref={section} id={id} aria-labelledby={`${id}-title`} className="book-scroll scroll-mt-[4.5rem] bg-night text-white" style={{ "--count": count } as CSSProperties}>
      <div ref={stage} className="book-stage mx-auto max-w-[90rem] px-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <Heading id={`${id}-title`} className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold">{title}</Heading>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">{controls}</div>
        </div>

        <div className="book">
          <div aria-hidden className="book-left">
            <TitlePage page={pages[0]} />
          </div>
          {pages.map((page, index) => {
            const next = pages[index + 1];
            return (
              <div
                key={page.id}
                ref={(node) => {
                  leaves.current[index] = node;
                }}
                inert={index !== active}
                className="book-leaf"
                style={{ zIndex: count - index + 1 }}
              >
                <article lang={page.language === "hi" ? "hi" : "en"} className="book-face flex flex-col bg-white text-ink">
                  <div className={cn("book-band px-6 py-5", TONES[page.tone])}>
                    <p className="text-sm font-medium opacity-90">{page.eyebrow}{page.label ? `, ${page.label}` : ""}</p>
                    <h3 className="mt-1 text-[2rem] font-semibold">{page.title}</h3>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 p-6 xl:p-10">{page.body}</div>
                  <span aria-hidden className="book-shade" />
                </article>
                {next && (
                  <div aria-hidden className="book-face book-back">
                    <TitlePage page={next} />
                    <span className="book-shade" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="book-controls flex items-center justify-between gap-3">
          <div role="group" aria-label="Choose a page" className="flex gap-1">
            {pages.map((page, index) => (
              <button
                key={page.id}
                type="button"
                aria-label={`${page.eyebrow}: ${page.title}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => goTo(index)}
                className={cn("size-10 rounded-full text-sm font-semibold transition-colors", index === active ? "bg-white text-night" : "text-white/70 hover:bg-white/10 hover:text-white")}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button type="button" onClick={skip} className="min-h-10 px-2 text-right text-sm font-medium text-white/80 underline underline-offset-4 hover:text-white">
            {skipLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
