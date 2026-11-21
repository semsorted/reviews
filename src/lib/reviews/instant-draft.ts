import type { ReviewLanguage } from "@/lib/ai/provider.interface";

export interface InstantDraftInput {
  shopName: string;
  rating: number;
  chips: string[];
  language: ReviewLanguage;
}

type Tone = "strong" | "good" | "mixed" | "low";
type Line = (value: string) => string;
type PhraseSet = { open: Line[]; topic: Line[]; close: string[] };

const EN_OPEN: Line[] = [
  (s) => `I visited ${s} recently.`,
  (s) => `I recently went to ${s}.`,
  (s) => `I stopped by ${s} recently.`,
  (s) => `I was at ${s} recently.`,
];
const HI_OPEN: Line[] = [(s) => `हाल ही में ${s} जाना हुआ।`, (s) => `कुछ समय पहले ${s} जाना हुआ।`, (s) => `कुछ दिन पहले ${s} जाना हुआ।`];
const HINGLISH_OPEN: Line[] = [(s) => `Recently ${s} jaana hua.`, (s) => `Haal hi me ${s} visit kiya.`, (s) => `${s} me recently jaana hua.`];

const PHRASES: Record<ReviewLanguage, Record<Tone, PhraseSet>> = {
  en: {
    strong: {
      open: [...EN_OPEN, (s) => `My visit to ${s} went really well.`],
      topic: [(t) => `I liked the ${t}.`, (t) => `The ${t} stood out for me.`, (t) => `I was happy with the ${t}.`, (t) => `What I appreciated most was the ${t}.`, (t) => `The ${t} left a strong impression.`],
      close: ["Overall, a great experience.", "Really happy with my visit.", "Very happy with the experience overall.", "Overall, I was really impressed.", "A really nice experience overall."],
    },
    good: {
      open: [...EN_OPEN, (s) => `My visit to ${s} went well.`],
      topic: [(t) => `I liked the ${t}.`, (t) => `The ${t} stood out for me.`, (t) => `I was happy with the ${t}.`, (t) => `The ${t} left a good impression.`, (t) => `No complaints about the ${t}.`],
      close: ["Overall, a good experience.", "A pleasant visit overall.", "Satisfied with my visit.", "It was a nice experience."],
    },
    mixed: {
      open: EN_OPEN,
      topic: [(t) => `The ${t} felt average.`, (t) => `I found the ${t} to be okay.`, (t) => `The ${t} could be a little better.`, (t) => `My experience with the ${t} was mixed.`],
      close: ["Overall, an average visit.", "It was an okay experience overall.", "Overall, it was fine but nothing special."],
    },
    low: {
      open: [...EN_OPEN, (s) => `My recent visit to ${s} did not go as expected.`, (s) => `I expected more from my visit to ${s}.`],
      topic: [(t) => `The ${t} could be better.`, (t) => `I hope they improve the ${t}.`, (t) => `More attention is needed on the ${t}.`, (t) => `I was not satisfied with the ${t}.`],
      close: ["Overall, it did not meet my expectations.", "Overall, a disappointing experience.", "There is clear room for improvement."],
    },
  },
  hi: {
    strong: {
      open: [...HI_OPEN, (s) => `${s} में मेरा अनुभव बहुत अच्छा रहा।`],
      topic: [(t) => `${t} के मामले में अनुभव बहुत अच्छा रहा।`, (t) => `${t} से मैं काफ़ी संतुष्ट हूँ।`, (t) => `${t} ने अच्छा प्रभाव छोड़ा।`],
      close: ["कुल मिलाकर शानदार अनुभव रहा।", "कुल मिलाकर बहुत अच्छा लगा।"],
    },
    good: {
      open: [...HI_OPEN, (s) => `${s} में मेरा अनुभव अच्छा रहा।`],
      topic: [(t) => `${t} के मामले में अनुभव अच्छा रहा।`, (t) => `${t} से मैं संतुष्ट हूँ।`],
      close: ["कुल मिलाकर अच्छा अनुभव रहा।", "कुल मिलाकर विज़िट अच्छी रही।"],
    },
    mixed: {
      open: HI_OPEN,
      topic: [(t) => `${t} के मामले में अनुभव ठीक-ठाक रहा।`, (t) => `${t} में थोड़ा सुधार हो सकता है।`],
      close: ["कुल मिलाकर अनुभव औसत रहा।", "कुल मिलाकर विज़िट ठीक-ठाक रही।"],
    },
    low: {
      open: [...HI_OPEN, (s) => `${s} की विज़िट उम्मीद के मुताबिक नहीं रही।`],
      topic: [(t) => `${t} में सुधार की ज़रूरत है।`, (t) => `${t} के मामले में अनुभव उम्मीद के मुताबिक नहीं रहा।`],
      close: ["कुल मिलाकर अनुभव निराशाजनक रहा।", "यहाँ सुधार की काफ़ी गुंजाइश है।"],
    },
  },
  hinglish: {
    strong: {
      open: [...HINGLISH_OPEN, (s) => `${s} me mera experience bahut achha raha.`],
      topic: [(t) => `${t} ke maamle me experience bahut achha raha.`, (t) => `${t} se main kaafi satisfied hoon.`, (t) => `${t} ne achha impression chhoda.`],
      close: ["Overall bahut badhiya experience raha.", "Overall visit bahut achhi rahi."],
    },
    good: {
      open: [...HINGLISH_OPEN, (s) => `${s} me mera experience achha raha.`],
      topic: [(t) => `${t} ke maamle me experience achha raha.`, (t) => `${t} se main satisfied hoon.`],
      close: ["Overall achha experience raha.", "Overall visit achhi rahi."],
    },
    mixed: {
      open: HINGLISH_OPEN,
      topic: [(t) => `${t} ke maamle me experience theek-thaak raha.`, (t) => `${t} me thoda improvement ho sakta hai.`],
      close: ["Overall experience average raha.", "Overall visit theek-thaak rahi."],
    },
    low: {
      open: [...HINGLISH_OPEN, (s) => `${s} ki visit expectation ke hisaab se nahi rahi.`],
      topic: [(t) => `${t} me improvement ki zarurat hai.`, (t) => `${t} ke maamle me experience expectation ke hisaab se nahi raha.`],
      close: ["Overall experience disappointing raha.", "Yahan improvement ki kaafi gunjaish hai."],
    },
  },
};

const LIST_JOINER: Record<ReviewLanguage, string> = { en: " and ", hi: " और ", hinglish: " aur " };

function toneFor(rating: number): Tone {
  if (rating <= 2) return "low";
  if (rating === 3) return "mixed";
  return rating === 4 ? "good" : "strong";
}

function topicText(chip: string): string {
  const firstWord = chip.split(" ")[0];
  return /[A-Z]/.test(firstWord.slice(1)) ? chip : chip.charAt(0).toLowerCase() + chip.slice(1);
}

function joinTopics(topics: string[], language: ReviewLanguage): string {
  if (topics.length < 2) return topics.join("");
  return `${topics.slice(0, -1).join(", ")}${LIST_JOINER[language]}${topics.at(-1)}`;
}

export function toReviewLanguage(value: string): ReviewLanguage {
  return value === "hi" || value === "hinglish" ? value : "en";
}

/** Small repeatable generator, so a customer's wording stays steady while they tap chips. */
export function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) state = Math.imul(state ^ seed.charCodeAt(i), 16777619);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** Writes a varied draft on the device, using only the rating and chips, so the customer never waits. */
export function writeInstantDraft(input: InstantDraftInput, random: () => number = Math.random): string {
  const { shopName, rating, chips, language } = input;
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
  const phrases = PHRASES[language][toneFor(rating)];
  const open = pick(phrases.open);
  const topic = pick(phrases.topic);
  const close = pick(phrases.close);
  const ordered = chips
    .map((chip) => ({ chip, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ chip }) => topicText(chip));

  return [open(shopName), topic(joinTopics(ordered, language)), close].join(" ");
}
