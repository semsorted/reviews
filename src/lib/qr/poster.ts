import { SHOP_TYPES } from "@/lib/reviews/catalog";
import { artFor } from "./poster-art";

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
const TITLE: Phrase = { en: "Your opinion matters!", hi: "आपकी राय मायने रखती है!", hinglish: "Aapki raay zaroori hai!" };
const CTA: Phrase = { en: "Scan to review us on Google", hi: "स्कैन करके Google पर रिव्यू दें", hinglish: "Scan karke Google par review dein" };

const LINES = {
  meal: { en: "Tell others how your meal was.", hi: "दूसरों को बताइए आपका खाना कैसा रहा।", hinglish: "Sabko batayein aapka khana kaisa raha." },
  treat: { en: "Tell others how every bite and sip was.", hi: "बताइए हर बाइट और घूँट कैसा लगा।", hinglish: "Batayein har bite aur sip kaisi lagi." },
  fashion: { en: "Tell others what you think of our collection.", hi: "बताइए आपको हमारा कलेक्शन कैसा लगा।", hinglish: "Batayein aapko hamara collection kaisa laga." },
  fresh: { en: "Tell others about our quality and freshness.", hi: "दूसरों को हमारी क्वालिटी और ताज़गी के बारे में बताइए।", hinglish: "Sabko hamari quality aur freshness ke baare me batayein." },
  tech: { en: "Tell others how our products and support were.", hi: "बताइए हमारे प्रोडक्ट और सपोर्ट कैसे रहे।", hinglish: "Batayein hamare products aur support kaise rahe." },
  work: { en: "Tell others how our work turned out.", hi: "बताइए हमारा काम कैसा रहा।", hinglish: "Batayein hamara kaam kaisa raha." },
  range: { en: "Tell others about our range and guidance.", hi: "दूसरों को हमारी रेंज और सलाह के बारे में बताइए।", hinglish: "Sabko hamari range aur salah ke baare me batayein." },
  shopping: { en: "Tell others how your shopping was.", hi: "बताइए आपकी शॉपिंग कैसी रही।", hinglish: "Batayein aapki shopping kaisi rahi." },
  look: { en: "Tell others how your new look turned out.", hi: "बताइए आपका नया लुक कैसा रहा।", hinglish: "Batayein aapka naya look kaisa raha." },
  session: { en: "Tell others how your session felt.", hi: "बताइए आपका सेशन कैसा रहा।", hinglish: "Batayein aapka session kaisa raha." },
  training: { en: "Tell others what training here is like.", hi: "बताइए यहाँ की ट्रेनिंग कैसी लगी।", hinglish: "Batayein yahan ki training kaisi lagi." },
  care: { en: "Help other patients find the right care.", hi: "दूसरे मरीज़ों को सही इलाज ढूँढने में मदद करें।", hinglish: "Doosre patients ko sahi care dhoondhne me madad karein." },
  pet: { en: "Tell other pet parents about the care here.", hi: "दूसरे पेट पैरेंट्स को यहाँ की देखभाल के बारे में बताइए।", hinglish: "Doosre pet parents ko yahan ki care ke baare me batayein." },
  drivers: { en: "Tell other drivers how the service was.", hi: "दूसरे ड्राइवरों को बताइए सर्विस कैसी रही।", hinglish: "Doosre drivers ko batayein service kaisi rahi." },
  buyers: { en: "Tell other buyers how your experience was.", hi: "दूसरे खरीदारों को बताइए आपका अनुभव कैसा रहा।", hinglish: "Doosre buyers ko batayein aapka experience kaisa raha." },
  riders: { en: "Tell other riders how your trip was.", hi: "दूसरे यात्रियों को बताइए आपकी यात्रा कैसी रही।", hinglish: "Doosre riders ko batayein aapka trip kaisa raha." },
  learning: { en: "Tell students and parents what learning here is like.", hi: "छात्रों और अभिभावकों को बताइए यहाँ पढ़ाई कैसी है।", hinglish: "Students aur parents ko batayein yahan padhai kaisi hai." },
  handled: { en: "Tell others how we handled your work.", hi: "बताइए हमने आपका काम कैसे संभाला।", hinglish: "Batayein humne aapka kaam kaise sambhala." },
  stay: { en: "Tell the next guest how your stay was.", hi: "अगले मेहमान को बताइए आपका ठहरना कैसा रहा।", hinglish: "Agle guest ko batayein aapka stay kaisa raha." },
  event: { en: "Tell others how your event went.", hi: "बताइए आपका इवेंट कैसा रहा।", hinglish: "Batayein aapka event kaisa raha." },
  time: { en: "Tell others how your time here was.", hi: "बताइए यहाँ आपका समय कैसा रहा।", hinglish: "Batayein yahan aapka time kaisa raha." },
  other: { en: "Tell others how your experience was.", hi: "दूसरों को बताइए आपका अनुभव कैसा रहा।", hinglish: "Sabko batayein aapka experience kaisa raha." },
} satisfies Record<string, Phrase>;

const GROUP_LINES: Record<string, Phrase> = {
  "Food and drink": LINES.meal,
  Retail: LINES.shopping,
  "Beauty and wellness": LINES.session,
  Health: LINES.care,
  "Auto and transport": LINES.drivers,
  Education: LINES.learning,
  "Home services": LINES.work,
  "Professional services": LINES.handled,
  "Events and stays": LINES.event,
};

const TYPE_GROUPS: [Phrase, string[]][] = [
  [LINES.treat, ["Cafe", "Bakery", "Sweet shop", "Ice cream parlour", "Juice bar", "Tea stall"]],
  [LINES.fashion, ["Clothing store", "Saree and ethnic wear", "Kids wear", "Boutique", "Footwear store", "Jewellery store", "Watch and accessories", "Cosmetics store"]],
  [LINES.fresh, ["Grocery store", "Supermarket", "Fruit and vegetable shop", "Meat and fish shop", "Dairy shop"]],
  [LINES.tech, ["Mobile shop", "Electronics store", "Computer and laptop shop"]],
  [LINES.work, ["Tailor", "Mobile repair"]],
  [LINES.range, ["Furniture store", "Home decor", "Hardware store", "Paint and building materials"]],
  [LINES.look, ["Salon", "Barber shop", "Beauty parlour", "Bridal makeup studio", "Nail studio", "Tattoo studio"]],
  [LINES.training, ["Gym", "Yoga studio", "Dance academy"]],
  [LINES.pet, ["Veterinary clinic"]],
  [LINES.buyers, ["Car showroom", "Bike showroom", "Tyre and battery shop"]],
  [LINES.riders, ["Taxi and cab service"]],
  [LINES.learning, ["Driving school"]],
  [LINES.stay, [...STAY_TYPES]],
  [LINES.time, ["Cinema", "Gaming zone"]],
];
const TYPE_LINES = new Map(TYPE_GROUPS.flatMap(([line, types]) => types.map((type) => [type, line] as const)));

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
    // The customer review page uses headline. Printed posters use title.
    headline: headline[lang],
    title: TITLE[lang],
    art: artFor(category, group),
    line: (TYPE_LINES.get(category) ?? (group ? GROUP_LINES[group] : LINES.other))[lang],
    cta: CTA[lang],
  };
}
