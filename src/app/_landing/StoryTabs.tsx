"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { STORY, type StoryLanguage } from "./content";

const LANGUAGES: StoryLanguage[] = ["hinglish", "hi", "en"];

export function StoryTabs() {
  const [language, setLanguage] = useState<StoryLanguage>("hinglish");
  const story = STORY[language];

  return (
    <div>
      <div role="group" aria-label="Choose story language" className="flex flex-wrap gap-2">
        {LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            aria-pressed={language === code}
            onClick={() => setLanguage(code)}
            className={cn(
              "min-h-11 rounded-full border px-4 text-sm font-semibold",
              language === code ? "border-g-blue bg-g-blue text-white" : "border-line bg-white text-ink hover:border-g-blue"
            )}
          >
            {STORY[code].tab}
          </button>
        ))}
      </div>
      <article lang={language === "hi" ? "hi" : "en"} className="mt-6">
        <h3 className="text-3xl font-bold">{story.title}</h3>
        <div className="mt-4 space-y-4 text-[1.0625rem] leading-relaxed text-ink">
          {story.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-5 text-sm text-moss">{story.note}</p>
      </article>
    </div>
  );
}
