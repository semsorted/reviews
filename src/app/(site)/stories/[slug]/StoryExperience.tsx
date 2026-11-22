"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { CHAPTERS, STORY_UI, TONES, type Story, type StoryLanguage } from "@/app/_landing/content";
import { FlipBook, type FlipPage } from "@/app/_landing/FlipBook";
import { LanguageTabs } from "@/app/_landing/LanguageTabs";
import { cn } from "@/lib/utils";

export function StoryExperience({ story, next }: { story: Story; next: Story }) {
  const [language, setLanguage] = useState<StoryLanguage>("hinglish");
  const [open, setOpen] = useState(false);
  const full = useRef<HTMLElement>(null);
  const text = story.text[language];
  const ui = STORY_UI[language];
  const chapters = CHAPTERS[story.slug][language];

  const pages: FlipPage[] = text.paragraphs.map((paragraph, index) => ({
    id: `${story.slug}-${index}`,
    tone: story.tone,
    eyebrow: `${ui.page} ${index + 1}/${text.paragraphs.length}`,
    label: text.trade,
    title: chapters[index],
    language,
    body: (
      <>
        <p className="book-para my-auto">{paragraph}</p>
        <p className="text-xs text-moss">{ui.note}</p>
      </>
    ),
  }));

  return (
    <>
      <FlipBook
        id="story-book"
        as="h1"
        title={text.title}
        pages={pages}
        skipLabel={ui.skip}
        onSkip={() => {
          setOpen(true);
          requestAnimationFrame(() => full.current?.scrollIntoView());
        }}
        controls={
          <>
            <Link href="/stories" className="inline-flex min-h-10 items-center text-sm font-medium text-white/80 underline underline-offset-4 hover:text-white">{ui.all}</Link>
            <LanguageTabs language={language} onChange={setLanguage} />
          </>
        }
      />

      <section ref={full} aria-label={ui.whole} className="mx-auto max-w-3xl scroll-mt-24 px-4 py-14 sm:px-8 lg:py-20">
        <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="group rounded-[1.75rem] bg-mist">
          <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 p-6 font-display text-[clamp(1.5rem,3vw,2.1rem)] font-semibold leading-tight sm:px-8 [&::-webkit-details-marker]:hidden">
            {ui.whole}
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-g-blue text-white">
              <ChevronDown aria-hidden className="size-6 transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div lang={language === "hi" ? "hi" : "en"} className="px-6 pb-8 sm:px-8">
            {text.paragraphs.map((paragraph, index) => (
              <div key={paragraph} className="border-t border-line py-6">
                <h2 className="text-2xl font-semibold">{chapters[index]}</h2>
                <p className="mt-2 text-[1.2rem] leading-[1.7]">{paragraph}</p>
              </div>
            ))}
            <p className="text-sm text-moss">{ui.note}</p>
          </div>
        </details>
      </section>

      <Link href={`/stories/${next.slug}`} className={cn("group block", TONES[next.tone])}>
        <span className="mx-auto block max-w-[90rem] px-4 py-14 sm:px-8 lg:py-20">
          <span className="block text-lg font-medium opacity-90">{ui.next}</span>
          <span lang={language === "hi" ? "hi" : "en"} className="mt-1 block font-display text-[clamp(2.5rem,6.4vw,5.5rem)] font-semibold leading-none tracking-[-0.03em] underline-offset-8 group-hover:underline">{next.text[language].title}</span>
        </span>
      </Link>
    </>
  );
}
