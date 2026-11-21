"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LANGUAGES, STORY_UI, type Story, type StoryLanguage } from "./content";

export function LanguageTabs({ language, onChange, dark = false }: { language: StoryLanguage; onChange: (code: StoryLanguage) => void; dark?: boolean }) {
  return (
    <div role="group" aria-label="Choose story language" className={cn("inline-flex rounded-full p-1", dark ? "bg-white/10" : "bg-mist")}>
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          aria-pressed={language === code}
          onClick={() => onChange(code)}
          className={cn(
            "min-h-10 rounded-full px-4 text-sm font-semibold transition-colors",
            language === code ? (dark ? "bg-white text-night" : "bg-g-blue text-white") : dark ? "text-white/80 hover:text-white" : "text-moss hover:text-ink"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function StoryReader({ story }: { story: Story }) {
  const [language, setLanguage] = useState<StoryLanguage>("hinglish");
  const text = story.text[language];

  return (
    <article lang={language === "hi" ? "hi" : "en"}>
      <LanguageTabs language={language} onChange={setLanguage} />
      <p className="mt-8 text-lg font-medium text-moss">{text.trade}</p>
      <h1 className="mt-1 text-[clamp(2.75rem,6.4vw,5.25rem)] font-semibold leading-[1.02] tracking-[-0.03em]">{text.title}</h1>
      <div className="mt-8 space-y-6 text-[1.25rem] leading-[1.7]">
        {text.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <p className="mt-8 text-sm text-moss">{STORY_UI[language].note}</p>
    </article>
  );
}
