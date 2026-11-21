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
      <div role="group" aria-label="Choose story language" className="inline-flex rounded-full bg-white/10 p-1">
        {LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            aria-pressed={language === code}
            onClick={() => setLanguage(code)}
            className={cn("min-h-10 rounded-full px-4 text-sm font-semibold transition-colors", language === code ? "bg-white text-night" : "text-white/80 hover:text-white")}
          >
            {STORY[code].tab}
          </button>
        ))}
      </div>
      <article lang={language === "hi" ? "hi" : "en"} className="mt-8">
        <h3 className="text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold">{story.title}</h3>
        <div className="mt-6 max-w-[62ch] space-y-5 text-[1.125rem] leading-[1.7] text-white/85">
          {story.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-6 text-sm text-white/60">{story.note}</p>
      </article>
    </div>
  );
}
