import { isPerson, voiceFor } from "@/lib/reviews/category-voice";
import { GenerateReviewDraftInput, ReviewLanguage, ReviewStyle } from "./provider.interface";

export interface PromptPayload {
  systemPrompt: string;
  userPrompt: string;
}

const STYLE_GUIDELINES: Record<ReviewStyle, string> = {
  short: "Write 1 to 2 concise sentences.",
  natural: "Write 2 to 3 natural sentences, like a real customer typing on a phone.",
  detailed: "Write 4 to 5 sentences without adding any detail that was not provided.",
};

const LANGUAGE_GUIDELINES: Record<ReviewLanguage, string> = {
  en: "Write in fluent, natural English.",
  hi: "Write in natural Hindi using the Devanagari script.",
  hinglish: "Write in conversational Hinglish: Hindi written in Roman script.",
};

function toneFor(rating: number): string {
  if (rating <= 2) {
    return "Do not praise the business. Do not describe any topic as good. Read each label as a neutral topic, so 'Friendly staff' means staff friendliness, and say these topics could be better. Never call a topic fast, friendly, fresh, fine, or okay. Do not claim a specific failure or state the opposite of a topic, such as calling friendly staff rude.";
  }
  if (rating === 3) {
    return "Keep a balanced, mixed tone. Do not exaggerate in either direction.";
  }
  return "Keep a warm, positive tone without hype or superlatives.";
}

export function buildReviewPrompts(input: GenerateReviewDraftInput): PromptPayload {
  const { shopName, businessCategory, rating, chips, style, language, avoid } = input;

  const systemPrompt = `You help a real customer turn their own rating and selected topics into a Google review draft.

Rules:
1. Use only the business name, category, rating, and selected topics provided. Do not add claims about anything outside the selected topics. Do not explain how or why a topic was good or bad.
2. Never invent staff names, purchases, products, prices, dates, wait times, visit frequency, or personal stories.
3. The tone must match the customer's rating. Never turn a low rating into praise.
4. Avoid marketing language, superlatives, hashtags, and emojis.
5. Do not mention AI, a QR code, or being asked to leave a review.
6. Do not mention future plans, recommendations, or whether the customer will return.
7. Write the business name exactly as given, once, in its original spelling and script. Never translate or transliterate it.
8. Do not add qualities such as friendly, welcoming, fresh, clean, or tasty unless that word is in a selected topic. You may say the one ordinary thing a customer does at this kind of business (the "Activity" line) in simple words such as studied, shopped, had a meal, had a consultation, stayed. Never say bought, ate, tried, ordered, or used a product, and add no item, price, name, or date.
9. Some topics are a person's name or title, such as "B.L. Sir" or "Dr. Mehta". Write about that person naturally, with the exact name, for example their teaching or approach. If a person and a confidence topic are both selected and the rating is 4 or 5, you may say that person helped build the customer's confidence. Never invent what the person said or did.
10. Say only that a selected topic was good, stood out, or could be better. Never describe what a person or the business did or how well (explained, guided, taught, helped, clearly, quickly, easily, useful, smoothly), and never write "us" or "we". The one exception is rule 9's confidence line.
11. In Hindi and Hinglish, never reveal the customer's gender: use "maine", "raha", "achha laga", and avoid endings such as tha/thi, gaya/gayi, leta/leti.
12. Sound like one real person typing a short review. Vary how sentences start and avoid stock lines such as "Overall, a good experience".

Return only a JSON object: {"draftText":"the review","headline":"a 3-6 word summary"}`;

  const activity = voiceFor(businessCategory)?.hint;
  const userPrompt = `Business: ${shopName}
Category: ${businessCategory}
${activity ? `Activity: the customer ${activity}\n` : ""}Rating: ${rating} out of 5
${rating <= 2 ? "Topics the customer wants improved:" : "Topics selected by the customer:"}
${chips.map((chip) => `- ${chip}${isPerson(chip) ? " (a person)" : ""}`).join("\n")}

${avoid?.length ? `Earlier reviews. Write something clearly different in structure and wording, and do not copy any of them:\n${avoid.map((text) => `- ${text}`).join("\n")}\n\n` : ""}Tone: ${toneFor(rating)}
Length: ${STYLE_GUIDELINES[style]}
Language: ${LANGUAGE_GUIDELINES[language]}`;

  return { systemPrompt, userPrompt };
}
