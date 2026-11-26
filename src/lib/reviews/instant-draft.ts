import type { ReviewLanguage } from "@/lib/ai/provider.interface";
import { chipFamily } from "./chip-families";
import { hindiChip } from "./chip-hindi";
import { isConfidence, isPerson, voiceFor } from "./category-voice";

export interface InstantDraftInput {
  shopName: string;
  rating: number;
  chips: string[];
  language: ReviewLanguage;
  /** The business type. It changes what the review says the customer did. */
  category?: string;
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
const HI_OPEN: Line[] = [(s) => `हाल ही में ${s} जाना हुआ।`, (s) => `कुछ समय पहले ${s} जाना हुआ।`, (s) => `कुछ दिन पहले ${s} जाना हुआ।`, (s) => `पिछले दिनों ${s} जाना हुआ।`, (s) => `हाल ही में ${s} जाने का मौका मिला।`];
const HINGLISH_OPEN: Line[] = [(s) => `Recently ${s} jaana hua.`, (s) => `Haal hi me ${s} visit kiya.`, (s) => `${s} me recently jaana hua.`, (s) => `Pichhle dino ${s} jaana hua.`, (s) => `Haal hi me ${s} jaane ka mauka mila.`];

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
      topic: [(t) => `${t} के मामले में अनुभव बहुत अच्छा रहा।`, (t) => `${t} से मैं काफ़ी संतुष्ट हूँ।`, (t) => `${t} ने अच्छा प्रभाव छोड़ा।`, (t) => `${t} की बात करें तो अनुभव बहुत बढ़िया रहा।`, (t) => `${t} को लेकर मैं काफ़ी खुश हूँ।`, (t) => `${t} के मामले में यहाँ का काम मुझे बहुत पसंद आया।`],
      close: ["कुल मिलाकर शानदार अनुभव रहा।", "कुल मिलाकर बहुत अच्छा लगा।", "कुल मिलाकर मैं बहुत खुश हूँ।", "मेरी यह विज़िट सच में अच्छी रही।", "सब कुछ मिलाकर बढ़िया अनुभव रहा।", "इस विज़िट से मैं बहुत संतुष्ट हूँ।"],
    },
    good: {
      open: [...HI_OPEN, (s) => `${s} में मेरा अनुभव अच्छा रहा।`],
      topic: [(t) => `${t} के मामले में अनुभव अच्छा रहा।`, (t) => `${t} से मैं संतुष्ट हूँ।`, (t) => `${t} की बात करें तो अनुभव अच्छा रहा।`, (t) => `${t} को लेकर मुझे कोई शिकायत नहीं है।`, (t) => `${t} को लेकर मैं खुश हूँ।`, (t) => `${t} के मामले में यहाँ का काम अच्छा लगा।`],
      close: ["कुल मिलाकर अच्छा अनुभव रहा।", "कुल मिलाकर विज़िट अच्छी रही।", "कुल मिलाकर संतोषजनक अनुभव रहा।", "मेरी यह विज़िट अच्छी रही।", "सब मिलाकर अनुभव अच्छा रहा।", "इस विज़िट से मैं संतुष्ट हूँ।"],
    },
    mixed: {
      open: HI_OPEN,
      topic: [(t) => `${t} के मामले में अनुभव ठीक-ठाक रहा।`, (t) => `${t} में थोड़ा सुधार हो सकता है।`, (t) => `${t} की बात करें तो अनुभव औसत रहा।`, (t) => `${t} को लेकर मेरा अनुभव मिला-जुला रहा।`, (t) => `${t} को थोड़ा और बेहतर किया जा सकता है।`, (t) => `${t} के मामले में सब कुछ सामान्य लगा।`],
      close: ["कुल मिलाकर अनुभव औसत रहा।", "कुल मिलाकर विज़िट ठीक-ठाक रही।", "कुल मिलाकर ठीक अनुभव रहा।", "मेरी यह विज़िट सामान्य रही।", "सब मिलाकर अनुभव मिला-जुला रहा।", "कुछ बातें ठीक लगीं, कुछ में सुधार हो सकता है।"],
    },
    low: {
      open: [...HI_OPEN, (s) => `${s} की विज़िट उम्मीद के मुताबिक नहीं रही।`],
      topic: [(t) => `${t} में सुधार की ज़रूरत है।`, (t) => `${t} के मामले में अनुभव उम्मीद के मुताबिक नहीं रहा।`, (t) => `${t} पर और ध्यान देने की ज़रूरत है।`, (t) => `${t} को लेकर मैं संतुष्ट नहीं हूँ।`, (t) => `${t} को बेहतर किया जाना चाहिए।`, (t) => `${t} के मामले में मुझे निराशा हुई।`],
      close: ["कुल मिलाकर अनुभव निराशाजनक रहा।", "यहाँ सुधार की काफ़ी गुंजाइश है।", "मेरी यह विज़िट उम्मीद से कम रही।", "उम्मीद है यहाँ सुधार होगा।", "कुल मिलाकर अनुभव संतोषजनक नहीं रहा।", "इस बार मैं संतुष्ट नहीं हूँ।"],
    },
  },
  hinglish: {
    strong: {
      open: [...HINGLISH_OPEN, (s) => `${s} me mera experience bahut achha raha.`],
      topic: [(t) => `${t} ke maamle me experience bahut achha raha.`, (t) => `${t} se main kaafi satisfied hoon.`, (t) => `${t} ne achha impression chhoda.`, (t) => `${t} ki baat karein to experience bahut badhiya raha.`, (t) => `${t} ko lekar main kaafi khush hoon.`, (t) => `${t} ke maamle me yahan ka kaam mujhe bahut pasand aaya.`],
      close: ["Overall bahut badhiya experience raha.", "Overall visit bahut achhi rahi.", "Overall main bahut khush hoon.", "Meri yeh visit sach me achhi rahi.", "Sab milakar badhiya experience raha.", "Is visit se main bahut satisfied hoon."],
    },
    good: {
      open: [...HINGLISH_OPEN, (s) => `${s} me mera experience achha raha.`],
      topic: [(t) => `${t} ke maamle me experience achha raha.`, (t) => `${t} se main satisfied hoon.`, (t) => `${t} ki baat karein to experience achha raha.`, (t) => `${t} ko lekar mujhe koi shikayat nahi hai.`, (t) => `${t} ko lekar main khush hoon.`, (t) => `${t} ke maamle me yahan ka kaam achha laga.`],
      close: ["Overall achha experience raha.", "Overall visit achhi rahi.", "Overall satisfying experience raha.", "Meri yeh visit achhi rahi.", "Sab milakar experience achha raha.", "Is visit se main satisfied hoon."],
    },
    mixed: {
      open: HINGLISH_OPEN,
      topic: [(t) => `${t} ke maamle me experience theek-thaak raha.`, (t) => `${t} me thoda improvement ho sakta hai.`, (t) => `${t} ki baat karein to experience average raha.`, (t) => `${t} ko lekar mera experience mixed raha.`, (t) => `${t} ko thoda aur better kiya ja sakta hai.`, (t) => `${t} ke maamle me sab normal laga.`],
      close: ["Overall experience average raha.", "Overall visit theek-thaak rahi.", "Overall theek experience raha.", "Meri yeh visit normal rahi.", "Sab milakar experience mixed raha.", "Kuch cheezein theek lagin, kuch me improvement ho sakta hai."],
    },
    low: {
      open: [...HINGLISH_OPEN, (s) => `${s} ki visit expectation ke hisaab se nahi rahi.`],
      topic: [(t) => `${t} me improvement ki zarurat hai.`, (t) => `${t} ke maamle me experience expectation ke hisaab se nahi raha.`, (t) => `${t} par aur dhyan dene ki zarurat hai.`, (t) => `${t} ko lekar main satisfied nahi hoon.`, (t) => `${t} ko better kiya jaana chahiye.`, (t) => `${t} ke maamle me mujhe nirasha hui.`],
      close: ["Overall experience disappointing raha.", "Yahan improvement ki kaafi gunjaish hai.", "Meri yeh visit expectation se kam rahi.", "Umeed hai yahan improvement hoga.", "Overall experience satisfying nahi raha.", "Is baar main satisfied nahi hoon."],
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

/** How a chip reads inside a topic template, in the review's language. */
const topicFor = (chip: string, language: ReviewLanguage) => topicText(chipFamily(chip)?.topic?.[language] ?? (language === "hi" ? hindiChip(chip) : chip));

/** A chip's own sentences for a 4 or 5 star review, when it has them. */
const ownLines = (chip: string, rating: number, language: ReviewLanguage) => (rating >= 4 ? chipFamily(chip)?.good[language] : undefined);

/** Lines that credit a person for this chip, at 4 or 5 stars. */
const personLinesFor = (chip: string, language: ReviewLanguage) => chipFamily(chip)?.person?.[language] ?? (isConfidence(chip) ? CONFIDENCE_LINES[language] : undefined);

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

const PERSON_LINES: Record<ReviewLanguage, Record<"teach" | "plain", Record<Tone, Line[]>>> = {
  en: {
    teach: {
      strong: [(p) => `I liked ${p}'s way of teaching.`, (p) => `${p}'s teaching stood out for me.`],
      good: [(p) => `I liked ${p}'s way of teaching.`, (p) => `${p}'s teaching stood out for me.`],
      mixed: [(p) => `${p}'s teaching was okay.`],
      low: [(p) => `${p}'s teaching could be better.`],
    },
    plain: {
      strong: [(p) => `I liked ${p}'s approach.`, (p) => `${p} stood out for me.`, (p) => `${p} made a good impression.`],
      good: [(p) => `I liked ${p}'s approach.`, (p) => `${p} stood out for me.`, (p) => `${p} made a good impression.`],
      mixed: [(p) => `${p}'s approach was okay.`],
      low: [(p) => `${p}'s approach could be better.`],
    },
  },
  hinglish: {
    teach: {
      strong: [(p) => `${p} ka padhane ka tareeka achha laga.`, (p) => `${p} ke padhane ka tareeka pasand aaya.`],
      good: [(p) => `${p} ka padhane ka tareeka achha laga.`, (p) => `${p} ke padhane ka tareeka pasand aaya.`],
      mixed: [(p) => `${p} ka padhane ka tareeka theek-thaak raha.`],
      low: [(p) => `${p} ke padhane ke tareeke me improvement ki zarurat hai.`],
    },
    plain: {
      strong: [(p) => `${p} ka tareeka achha laga.`, (p) => `${p} ne achha impression chhoda.`],
      good: [(p) => `${p} ka tareeka achha laga.`, (p) => `${p} ne achha impression chhoda.`],
      mixed: [(p) => `${p} ka tareeka theek-thaak raha.`],
      low: [(p) => `${p} ke tareeke me improvement ki zarurat hai.`],
    },
  },
  hi: {
    teach: {
      strong: [(p) => `${p} के पढ़ाने का तरीका अच्छा लगा।`, (p) => `${p} का पढ़ाने का अंदाज़ पसंद आया।`],
      good: [(p) => `${p} के पढ़ाने का तरीका अच्छा लगा।`, (p) => `${p} का पढ़ाने का अंदाज़ पसंद आया।`],
      mixed: [(p) => `${p} के पढ़ाने का तरीका ठीक-ठाक रहा।`],
      low: [(p) => `${p} के पढ़ाने के तरीके में सुधार की ज़रूरत है।`],
    },
    plain: {
      strong: [(p) => `${p} का तरीका अच्छा लगा।`, (p) => `${p} ने अच्छा प्रभाव छोड़ा।`],
      good: [(p) => `${p} का तरीका अच्छा लगा।`, (p) => `${p} ने अच्छा प्रभाव छोड़ा।`],
      mixed: [(p) => `${p} का तरीका ठीक-ठाक रहा।`],
      low: [(p) => `${p} के तरीके में सुधार की ज़रूरत है।`],
    },
  },
};

// Only for a good rating: the customer picked the person and a confidence chip, so the person helped.
const CONFIDENCE_LINES: Record<ReviewLanguage, Line[]> = {
  en: [(p) => `${p} really helped me build my confidence.`, (p) => `${p} helped me a lot in building my confidence.`],
  hinglish: [(p) => `${p} ne mera confidence build karne me kaafi help ki.`, (p) => `${p} ki wajah se mera confidence kaafi badha.`],
  hi: [(p) => `${p} ने मेरा आत्मविश्वास बढ़ाने में काफ़ी मदद की।`, (p) => `${p} की वजह से मेरा आत्मविश्वास काफ़ी बढ़ा।`],
};

const personLine = (person: string, rating: number, language: ReviewLanguage, category: string | undefined, random: () => number) => {
  const lines = PERSON_LINES[language][voiceFor(category)?.teaching ? "teach" : "plain"][toneFor(rating)];
  return lines[Math.floor(random() * lines.length)](person);
};

/** One sentence for a chip the customer adds after the draft was already written or edited. */
export function writeChipLine(chip: string, input: Omit<InstantDraftInput, "chips" | "shopName">, random: () => number = Math.random): string {
  const { rating, language, category } = input;
  if (isPerson(chip)) return personLine(chip, rating, language, category, random);
  const own = ownLines(chip, rating, language);
  if (own) return own[Math.floor(random() * own.length)];
  const topics = PHRASES[language][toneFor(rating)].topic;
  return topics[Math.floor(random() * topics.length)](topicFor(chip, language));
}

/** Writes a varied draft on the device, using only the rating, chips and business type, so the customer never waits. */
export function writeInstantDraft(input: InstantDraftInput, random: () => number = Math.random): string {
  const { shopName, rating, chips, language, category } = input;
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
  const phrases = PHRASES[language][toneFor(rating)];
  const open = pick(voiceFor(category)?.open[language] ?? phrases.open);
  const oneByOne = random() >= 0.5;
  // "Happy with my visit" is wrong for someone who studied or stayed, so a known business type skips those closings.
  const closings = voiceFor(category) ? phrases.close.filter((line) => !/visit|विज़िट/i.test(line)) : phrases.close;
  const close = pick(closings.length ? closings : phrases.close);

  let people = chips.filter(isPerson);
  const rest = chips.filter((chip) => !isPerson(chip));
  const lines: string[] = [];
  // A person picked with a chip like Confidence gets the credit for it in one sentence.
  const joint = rating >= 4 && people.length ? rest.findIndex((chip) => personLinesFor(chip, language)) : -1;
  if (joint >= 0) {
    lines.push(pick(personLinesFor(rest[joint], language)!)(people[0]));
    people = people.slice(1);
    rest.splice(joint, 1);
  }
  for (const person of people) lines.push(personLine(person, rating, language, category, random));

  const own = rest.filter((chip) => ownLines(chip, rating, language));
  const topics = rest
    .filter((chip) => !own.includes(chip))
    .map((chip) => ({ chip, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ chip }) => topicFor(chip, language));
  const topicLines: string[] = [];
  if (topics.length) {
    if (oneByOne && topics.length > 1) {
      const frames = [...phrases.topic].sort(() => random() - 0.5);
      topicLines.push(...topics.map((topic, index) => frames[index % frames.length](topic)));
    } else {
      topicLines.push(pick(phrases.topic)(joinTopics(topics, language)));
    }
  }
  if (own.length) {
    // Chips with their own sentences mix in with the template lines in any order.
    const mixed = [...own.map((chip) => pick(ownLines(chip, rating, language)!)), ...topicLines];
    lines.push(...mixed.map((line) => ({ line, key: random() })).sort((a, b) => a.key - b.key).map(({ line }) => line));
  } else lines.push(...topicLines);
  // A chip is lower-cased to fit mid-sentence, so a sentence that starts with one needs its capital back.
  const capital = (line: string) => (/^[a-z][a-z'-]*(?=[\s,])/.test(line) ? line.charAt(0).toUpperCase() + line.slice(1) : line);
  return [open(shopName), ...lines.map(capital), close].join(" ");
}
