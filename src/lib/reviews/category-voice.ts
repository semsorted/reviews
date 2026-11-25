import type { ReviewLanguage } from "@/lib/ai/provider.interface";
import { SHOP_TYPES } from "./catalog";

type Line = (shop: string) => string;
export type Voice = {
  /** What customers normally do at this kind of business. Plain words only, no purchase details. */
  hint: string;
  /** Teachers and trainers are praised for their teaching, everyone else for their approach. */
  teaching?: boolean;
  open: Record<ReviewLanguage, Line[]>;
};

const voice = (hint: string, en: Line[], hinglish: Line[], hi: Line[], teaching = false): Voice => ({ hint, teaching, open: { en, hinglish, hi } });

const STUDY = voice(
  "studied or took classes here",
  [(s) => `I studied at ${s}.`, (s) => `I took classes at ${s}.`, (s) => `I learned at ${s}.`],
  [(s) => `Maine ${s} se padhai ki.`, (s) => `Maine ${s} me padhai ki.`, (s) => `${s} me padhai ka experience raha.`],
  [(s) => `मैंने ${s} से पढ़ाई की।`, (s) => `मैंने ${s} में पढ़ाई की।`, (s) => `${s} में पढ़ाई का अनुभव रहा।`],
  true,
);
const CLOTHES = voice(
  "shopped for clothes here",
  [(s) => `I bought clothes from ${s}.`, (s) => `I shopped for clothes at ${s}.`, (s) => `I did my clothes shopping at ${s}.`],
  [(s) => `Maine ${s} se kapde liye.`, (s) => `Maine ${s} se kapdon ki shopping ki.`, (s) => `${s} se kapde lene ka experience raha.`],
  [(s) => `मैंने ${s} से कपड़े खरीदे।`, (s) => `मैंने ${s} से कपड़ों की शॉपिंग की।`, (s) => `${s} से कपड़े लेने का अनुभव रहा।`],
);
const RETAIL = voice(
  "shopped here",
  [(s) => `I shopped at ${s}.`, (s) => `I did some shopping at ${s}.`, (s) => `I went shopping at ${s}.`],
  [(s) => `Maine ${s} se shopping ki.`, (s) => `Maine ${s} me shopping ki.`, (s) => `${s} se shopping ka experience raha.`],
  [(s) => `मैंने ${s} से शॉपिंग की।`, (s) => `मैंने ${s} में शॉपिंग की।`, (s) => `${s} से शॉपिंग का अनुभव रहा।`],
);
const FOOD = voice(
  "had a meal here",
  [(s) => `I had a meal at ${s}.`, (s) => `I went to ${s} for a meal.`, (s) => `I had food at ${s}.`],
  [(s) => `Maine ${s} me khana kiya.`, (s) => `Maine ${s} me meal kiya.`, (s) => `${s} me khane ka experience raha.`],
  [(s) => `मैंने ${s} में भोजन किया।`, (s) => `मैं ${s} में खाने के लिए गया था।`, (s) => `${s} में खाने का अनुभव रहा।`],
);
const BEAUTY = voice(
  "got a service done here",
  [(s) => `I got a service done at ${s}.`, (s) => `I visited ${s} for a service.`, (s) => `I went to ${s} for a session.`],
  [(s) => `Maine ${s} me service karwayi.`, (s) => `Maine ${s} me session kiya.`, (s) => `${s} me service ka experience raha.`],
  [(s) => `मैंने ${s} में सर्विस करवाई।`, (s) => `मैंने ${s} में सेशन किया।`, (s) => `${s} में सर्विस का अनुभव रहा।`],
);
const HEALTH = voice(
  "had a consultation here",
  [(s) => `I had a consultation at ${s}.`, (s) => `I visited ${s} for a consultation.`, (s) => `I consulted a doctor at ${s}.`],
  [(s) => `Maine ${s} me consultation karwayi.`, (s) => `Maine ${s} me doctor se consultation ki.`, (s) => `${s} me consultation ka experience raha.`],
  [(s) => `मैंने ${s} में परामर्श करवाया।`, (s) => `मैंने ${s} में डॉक्टर से परामर्श किया।`, (s) => `${s} में परामर्श का अनुभव रहा।`],
);
const AUTO = voice(
  "used their service here",
  [(s) => `I used the service at ${s}.`, (s) => `I visited ${s} for my vehicle.`, (s) => `I got my vehicle work done at ${s}.`],
  [(s) => `Maine ${s} ki service use ki.`, (s) => `Maine ${s} me gaadi ke liye visit kiya.`, (s) => `${s} ki service ka experience raha.`],
  [(s) => `मैंने ${s} की सर्विस इस्तेमाल की।`, (s) => `मैं अपनी गाड़ी के लिए ${s} गया था।`, (s) => `${s} की सर्विस का अनुभव रहा।`],
);
const HOME = voice(
  "had work done here",
  [(s) => `I hired ${s} for some work.`, (s) => `${s} did some work for me.`, (s) => `I had some work done by ${s}.`],
  [(s) => `Maine ${s} se kaam karwaya.`, (s) => `Maine ${s} ko kaam diya.`, (s) => `${s} se kaam karwane ka experience raha.`],
  [(s) => `मैंने ${s} से काम करवाया।`, (s) => `मैंने ${s} को काम दिया।`, (s) => `${s} से काम करवाने का अनुभव रहा।`],
);
const PRO = voice(
  "used their services",
  [(s) => `I used the services of ${s}.`, (s) => `I worked with ${s}.`, (s) => `I took help from ${s}.`],
  [(s) => `Maine ${s} ki services use ki.`, (s) => `Maine ${s} ke saath kaam kiya.`, (s) => `${s} ke saath kaam ka experience raha.`],
  [(s) => `मैंने ${s} की सेवाएँ इस्तेमाल कीं।`, (s) => `मैंने ${s} के साथ काम किया।`, (s) => `${s} के साथ काम का अनुभव रहा।`],
);
const EVENT = voice(
  "used them for an event",
  [(s) => `I used ${s} for an event.`, (s) => `${s} handled my event.`, (s) => `I had an event with ${s}.`],
  [(s) => `Maine apne event ke liye ${s} ko liya.`, (s) => `${s} ne mera event sambhala.`, (s) => `${s} ke saath event ka experience raha.`],
  [(s) => `मैंने अपने इवेंट के लिए ${s} को चुना।`, (s) => `${s} ने मेरा इवेंट संभाला।`, (s) => `${s} के साथ इवेंट का अनुभव रहा।`],
);
const STAY = voice(
  "stayed here",
  [(s) => `I stayed at ${s}.`, (s) => `I had a stay at ${s}.`, (s) => `I spent a few days at ${s}.`],
  [(s) => `Maine ${s} me stay kiya.`, (s) => `${s} me ruka tha.`, (s) => `${s} me stay ka experience raha.`],
  [(s) => `मैंने ${s} में ठहराव किया।`, (s) => `मैं ${s} में रुका था।`, (s) => `${s} में ठहरने का अनुभव रहा।`],
);
const TIME = voice(
  "spent time here",
  [(s) => `I spent some time at ${s}.`, (s) => `I went to ${s}.`, (s) => `I visited ${s}.`],
  [(s) => `Maine ${s} me time bitaya.`, (s) => `Maine ${s} visit kiya.`, (s) => `${s} me time bitane ka experience raha.`],
  [(s) => `मैंने ${s} में समय बिताया।`, (s) => `मैंने ${s} की विज़िट की।`, (s) => `${s} में समय बिताने का अनुभव रहा।`],
);

const GROUP_VOICE: Record<string, Voice> = {
  "Food and drink": FOOD,
  Retail: RETAIL,
  "Beauty and wellness": BEAUTY,
  Health: HEALTH,
  "Auto and transport": AUTO,
  Education: STUDY,
  "Home services": HOME,
  "Professional services": PRO,
  "Events and stays": EVENT,
};
const TYPE_VOICE = new Map<string, Voice>([
  ...["Clothing store", "Saree and ethnic wear", "Kids wear", "Boutique"].map((type) => [type, CLOTHES] as const),
  ...["Hotel", "Resort", "Homestay", "PG and hostel"].map((type) => [type, STAY] as const),
  ...["Cinema", "Gaming zone"].map((type) => [type, TIME] as const),
]);

/** Null for a category the catalog does not know, so the generic wording is used. */
export function voiceFor(category: string | undefined): Voice | null {
  if (!category) return null;
  const group = SHOP_TYPES.find((type) => type.label === category)?.group;
  return TYPE_VOICE.get(category) ?? (group ? GROUP_VOICE[group] : null) ?? null;
}

// A chip that is a person: "B.L. Sir", "Sharma Madam", "Dr. Mehta". "Doctor consultation" is a topic, not a person.
const PERSON = /^dr\.?\s+\S+|(?:^|\s)(?:sir|madam|ma'?am|mam|maam|bhaiya|didi)$/i;
export const isPerson = (chip: string) => PERSON.test(chip.trim());
export const isConfidence = (chip: string) => /confidence/i.test(chip);
