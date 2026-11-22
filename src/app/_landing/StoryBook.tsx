"use client";

import { useState } from "react";
import Link from "next/link";
import { STORIES, STORY_UI, type StoryLanguage } from "./content";
import { FlipBook, type FlipPage } from "./FlipBook";
import { LanguageTabs } from "./LanguageTabs";

export function StoryBook({ id = "kahani" }: { id?: string }) {
  const [language, setLanguage] = useState<StoryLanguage>("hinglish");
  const ui = STORY_UI[language];

  const pages: FlipPage[] = STORIES.map((story, index) => {
    const text = story.text[language];
    return {
      id: story.slug,
      tone: story.tone,
      eyebrow: `${ui.chapter} ${index + 1}`,
      label: text.trade,
      title: text.title,
      language,
      body: (
        <>
          <p className="book-teaser leading-[1.5]">{text.teaser}</p>
          <div className="book-full space-y-2.5 leading-[1.55] text-ink/90">
            {text.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div>
            <Link href={`/stories/${story.slug}`} className="inline-flex min-h-11 items-center font-semibold text-g-blue underline decoration-g-blue/30 underline-offset-[5px] hover:decoration-g-blue">
              {ui.read}
            </Link>
            <p className="text-xs text-moss">{ui.note}</p>
          </div>
        </>
      ),
    };
  });

  return <FlipBook id={id} title="Dukaan ki kahaniyan" pages={pages} skipLabel="Skip stories" controls={<LanguageTabs language={language} onChange={setLanguage} />} />;
}
