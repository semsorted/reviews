import { seededRandom, writeInstantDraft, type InstantDraftInput } from "./instant-draft";

const LOCAL_CANDIDATES = 40;
const BLOCKED_TEXT = /https?:|www\.|#|artificial intelligence|\bqr\b|[\u{1F300}-\u{1FAFF}]/iu;
const LOW_RATING_PRAISE = /\b(great|excellent|amazing|awesome|loved|best|perfect|wonderful|fantastic|badhiya|mast|zabardast|shandaar)\b|शानदार|बढ़िया|बहुत अच्छा|लाजवाब|बेहतरीन/i;
const INVENTED_DETAIL = /\b(bought|ate|tried|ordered|purchased|kharida|kharidi|khaya|khayi|liya|mangaya)\b|\bli thi\b|\border kiya\b|खरीदा|ख़रीदा|खरीदी|ख़रीदी|खाया|ऑर्डर किया|मंगाया|(?:^|\s)(?:लिया|ली|लीं)(?=[\s।]|$)/i;

/** The first candidate is always the draft already on the customer's screen. */
export function localCandidates(input: InstantDraftInput, sessionId: string, variant: number): string[] {
  const seeds = Array.from({ length: LOCAL_CANDIDATES }, (_, index) => (index === 0 ? `${sessionId}:${variant}` : `${sessionId}:${variant}:${index}`));
  return [...new Set(seeds.map((seed) => writeInstantDraft(input, seededRandom(seed))))];
}

export function firstUnused(candidates: string[], used: Iterable<string>): string | undefined {
  const taken = new Set(used);
  return candidates.find((text) => !taken.has(text));
}

export function isSafeAiDraft(text: string, rating: number, shopName: string): boolean {
  if (text.length < 20 || text.length > 420 || !text.includes(shopName)) return false;
  if (BLOCKED_TEXT.test(text) || INVENTED_DETAIL.test(text) || /\bAI\b/.test(text)) return false;
  return rating > 2 || !LOW_RATING_PRAISE.test(text);
}
