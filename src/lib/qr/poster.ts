import { SHOP_TYPES } from "@/lib/reviews/catalog";

type Language = "en" | "hi" | "hinglish";
type Phrase = Record<Language, string>;

const DEFAULT_COLOR = "#1A73E8";
const BLUE = "#1A73E8";
const RED = "#D93025";
const GREEN = "#188038";
const YELLOW = "#FBBC04";
const DEEP = "#174EA6";

const VISIT: Phrase = { en: "How was your visit?", hi: "आपकी विज़िट कैसी रही?", hinglish: "Aapki visit kaisi rahi?" };
const EXPERIENCE: Phrase = { en: "How was your experience?", hi: "आपका अनुभव कैसा रहा?", hinglish: "Aapka experience kaisa raha?" };
const SERVICE: Phrase = { en: "How was our service?", hi: "हमारी सर्विस कैसी रही?", hinglish: "Hamari service kaisi rahi?" };
const STAY: Phrase = { en: "How was your stay?", hi: "आपका ठहरना कैसा रहा?", hinglish: "Aapka stay kaisa raha?" };

export const GROUP_STYLE: Record<string, { color: string; headline: Phrase }> = {
  "Food and drink": { color: RED, headline: { en: "How was the taste?", hi: "स्वाद कैसा लगा?", hinglish: "Swaad kaisa laga?" } },
  Retail: { color: BLUE, headline: VISIT },
  "Beauty and wellness": { color: YELLOW, headline: EXPERIENCE },
  Health: { color: GREEN, headline: VISIT },
  "Auto and transport": { color: DEEP, headline: SERVICE },
  Education: { color: YELLOW, headline: { en: "How is the learning here?", hi: "यहाँ पढ़ाई कैसी लगी?", hinglish: "Yahan padhai kaisi lagi?" } },
  "Home services": { color: GREEN, headline: { en: "How was our work?", hi: "हमारा काम कैसा रहा?", hinglish: "Hamara kaam kaisa raha?" } },
  "Professional services": { color: DEEP, headline: SERVICE },
  "Events and stays": { color: RED, headline: EXPERIENCE },
};

const STAY_TYPES = new Set(["Hotel", "Resort", "Homestay", "PG and hostel"]);

const TEXT: Record<Language, { line: string; cta: string; steps: [string, string, string] }> = {
  en: {
    line: "Your honest review helps other customers and helps us improve.",
    cta: "Review us on Google",
    steps: ["Scan this QR", "Tap stars and options", "Copy and post on Google"],
  },
  hi: {
    line: "आपका सच्चा रिव्यू दूसरे ग्राहकों की मदद करता है और हमें बेहतर बनाता है।",
    cta: "Google पर रिव्यू दें",
    steps: ["QR स्कैन करें", "स्टार और विकल्प चुनें", "कॉपी करके Google पर पोस्ट करें"],
  },
  hinglish: {
    line: "Aapka sachcha review doosre customers ki madad karta hai aur humein behtar banata hai.",
    cta: "Google par review dein",
    steps: ["QR scan karein", "Stars aur options chunein", "Copy karke Google par post karein"],
  },
};

function readableOn(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const light = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (light + 0.05) >= (light + 0.05) / 0.05 ? "#FFFFFF" : "#000000";
}

export function groupColor(category: string): string {
  const group = SHOP_TYPES.find((type) => type.label === category)?.group;
  return (group && GROUP_STYLE[group]?.color) || DEFAULT_COLOR;
}

/** Wording stays neutral: Google does not allow asking only for positive reviews. */
export function posterFor(category: string, language: string, primaryColor: string) {
  const lang: Language = language === "hi" || language === "hinglish" ? language : "en";
  const group = SHOP_TYPES.find((type) => type.label === category)?.group ?? null;
  const style = group ? GROUP_STYLE[group] : null;
  const headline = STAY_TYPES.has(category) ? STAY : (style?.headline ?? EXPERIENCE);
  const background = primaryColor.toUpperCase() === DEFAULT_COLOR ? (style?.color ?? DEFAULT_COLOR) : primaryColor;
  return { group, lang, background, foreground: readableOn(background), headline: headline[lang], ...TEXT[lang] };
}
