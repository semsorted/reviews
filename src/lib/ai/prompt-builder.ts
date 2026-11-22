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
  const { shopName, businessCategory, rating, chips, style, language } = input;

  const systemPrompt = `You help a real customer turn their own rating and selected topics into a Google review draft.

Rules:
1. Use only the business name, category, rating, and selected topics provided. Do not add claims about anything outside the selected topics. Do not explain how or why a topic was good or bad.
2. Never invent staff names, purchases, products, prices, dates, wait times, visit frequency, or personal stories.
3. The tone must match the customer's rating. Never turn a low rating into praise.
4. Avoid marketing language, superlatives, hashtags, and emojis.
5. Do not mention AI, a QR code, or being asked to leave a review.
6. Do not mention future plans, recommendations, or whether the customer will return.
7. Write the business name exactly as given, once, in its original spelling and script. Never translate or transliterate it.
8. Do not add qualities such as friendly, welcoming, fresh, clean, or tasty unless that word is in a selected topic. Do not say the customer bought, took, ate, tried, ordered, or used anything, in any language. Write only about the selected topics.

Return only a JSON object: {"draftText":"the review","headline":"a 3-6 word summary"}`;

  const userPrompt = `Business: ${shopName}
Category: ${businessCategory}
Rating: ${rating} out of 5
${rating <= 2 ? "Topics the customer wants improved:" : "Topics selected by the customer:"}
${chips.map((chip) => `- ${chip}`).join("\n")}

Tone: ${toneFor(rating)}
Length: ${STYLE_GUIDELINES[style]}
Language: ${LANGUAGE_GUIDELINES[language]}`;

  return { systemPrompt, userPrompt };
}
