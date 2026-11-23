import { SHOP_TYPES } from "@/lib/reviews/catalog";

type Language = "en" | "hi" | "hinglish";
type Phrase = Record<Language, string>;

const AUTO_COLORS = new Set(["#1A73E8", "#D93025", "#188038", "#FBBC04", "#174EA6", "#4F46E5"]);
const INK = "#17191C";
const GOLD = "#F5B301";

const VISIT: Phrase = { en: "How was your visit?", hi: "आपकी विज़िट कैसी रही?", hinglish: "Aapki visit kaisi rahi?" };
const EXPERIENCE: Phrase = { en: "How was your experience?", hi: "आपका अनुभव कैसा रहा?", hinglish: "Aapka experience kaisa raha?" };
const SERVICE: Phrase = { en: "How was our service?", hi: "हमारी सर्विस कैसी रही?", hinglish: "Hamari service kaisi rahi?" };
const STAY: Phrase = { en: "How was your stay?", hi: "आपका ठहरना कैसा रहा?", hinglish: "Aapka stay kaisa raha?" };

type Palette = { color: string; surface: string; accent: string };

const OTHER_STYLE: Palette = { color: "#1C2B3A", surface: "#F4F5F2", accent: "#E9B44C" };

export const GROUP_STYLE: Record<string, Palette & { headline: Phrase }> = {
  "Food and drink": { color: "#5B1A18", surface: "#FBF3E9", accent: "#F2A93B", headline: { en: "How was the taste?", hi: "स्वाद कैसा लगा?", hinglish: "Swaad kaisa laga?" } },
  Retail: { color: "#12264F", surface: "#F3F5FA", accent: "#F5B301", headline: VISIT },
  "Beauty and wellness": { color: "#43203F", surface: "#FBF2F2", accent: "#E8B4A0", headline: EXPERIENCE },
  Health: { color: "#0F3D3A", surface: "#F2F7F4", accent: "#D9B45B", headline: VISIT },
  "Auto and transport": { color: "#1C2430", surface: "#F2F4F7", accent: "#F2711C", headline: SERVICE },
  Education: { color: "#1F2A6B", surface: "#F4F4FB", accent: "#F5B301", headline: { en: "How is the learning here?", hi: "यहाँ पढ़ाई कैसी लगी?", hinglish: "Yahan padhai kaisi lagi?" } },
  "Home services": { color: "#1E3D2F", surface: "#F4F6EF", accent: "#E9A23B", headline: { en: "How was our work?", hi: "हमारा काम कैसा रहा?", hinglish: "Hamara kaam kaisa raha?" } },
  "Professional services": { color: "#16243A", surface: "#F4F3EF", accent: "#C6A15B", headline: SERVICE },
  "Events and stays": { color: "#4A1530", surface: "#FAF4EF", accent: "#D4AF6A", headline: EXPERIENCE },
};

const STAY_TYPES = new Set(["Hotel", "Resort", "Homestay", "PG and hostel"]);
const HEALTH_LINE: Phrase = {
  en: "Your honest review helps other patients find the right care.",
  hi: "आपका सच्चा रिव्यू दूसरे मरीज़ों को सही इलाज ढूँढने में मदद करता है।",
  hinglish: "Aapka sachcha review doosre patients ko sahi care dhoondhne me madad karta hai.",
};

const TEXT: Record<Language, { line: string; cta: string; steps: [string, string, string] }> = {
  en: {
    line: "Your honest review helps other customers and helps us improve.",
    cta: "Scan to review us on Google",
    steps: ["Scan the QR", "Pick stars and options", "Post on Google"],
  },
  hi: {
    line: "आपका सच्चा रिव्यू दूसरे ग्राहकों की मदद करता है और हमें बेहतर बनाता है।",
    cta: "स्कैन करके Google पर रिव्यू दें",
    steps: ["QR स्कैन करें", "स्टार और विकल्प चुनें", "Google पर पोस्ट करें"],
  },
  hinglish: {
    line: "Aapka sachcha review doosre customers ki madad karta hai aur humein behtar banata hai.",
    cta: "Scan karke Google par review dein",
    steps: ["QR scan karein", "Stars aur options chunein", "Google par post karein"],
  },
};

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

const readableOn = (hex: string) => (contrast(hex, "#FFFFFF") >= contrast(hex, "#000000") ? "#FFFFFF" : "#000000");

function mix(from: string, to: string, amount: number) {
  const channel = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  return `#${[1, 3, 5].map((i) => Math.round(channel(from, i) * (1 - amount) + channel(to, i) * amount).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function groupColor(category: string): string {
  const group = SHOP_TYPES.find((type) => type.label === category)?.group;
  return (group && GROUP_STYLE[group]?.color) || OTHER_STYLE.color;
}

/** Wording stays neutral: Google does not allow asking only for positive reviews. */
export function posterFor(category: string, language: string, primaryColor: string, brand?: { surface?: string | null; accent?: string | null }) {
  const lang: Language = language === "hi" || language === "hinglish" ? language : "en";
  const group = SHOP_TYPES.find((type) => type.label === category)?.group ?? null;
  const style = group ? GROUP_STYLE[group] : null;
  const designed = style ?? OTHER_STYLE;
  const headline = STAY_TYPES.has(category) ? STAY : (style?.headline ?? EXPERIENCE);
  const primary = primaryColor.toUpperCase();
  const isDesigned = AUTO_COLORS.has(primary) || primary === designed.color;
  const background = isDesigned ? designed.color : primary;
  const page = brand?.surface?.toUpperCase() ?? (isDesigned ? designed.surface : mix(primary, "#FFFFFF", 0.94));
  const foreground = readableOn(background);
  const wantedAccent = brand?.accent?.toUpperCase() ?? (isDesigned ? designed.accent : GOLD);
  const accent = contrast(background, wantedAccent) >= 3 ? wantedAccent : foreground;
  const ink = contrast(background, page) >= 4.5 ? background : contrast(INK, page) >= 4.5 ? INK : readableOn(page);
  const softInk = mix(ink, page, 0.28);
  const text = TEXT[lang];
  return {
    group,
    lang,
    background,
    foreground,
    page,
    accent,
    onAccent: readableOn(accent),
    ink,
    muted: contrast(softInk, page) >= 4.5 ? softInk : ink,
    headline: headline[lang],
    ...text,
    line: group === "Health" ? HEALTH_LINE[lang] : text.line,
  };
}
