"use client";

import { cn } from "@/lib/utils";
import { LANGUAGES, type StoryLanguage } from "./content";

export function LanguageTabs({ language, onChange }: { language: StoryLanguage; onChange: (code: StoryLanguage) => void }) {
  return (
    <div role="group" aria-label="Choose story language" className="inline-flex rounded-full bg-white/10 p-1">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          aria-pressed={language === code}
          onClick={() => onChange(code)}
          className={cn("min-h-10 rounded-full px-4 text-sm font-semibold transition-colors", language === code ? "bg-white text-night" : "text-white/80 hover:text-white")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
