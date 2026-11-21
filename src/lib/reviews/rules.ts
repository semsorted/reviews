export const MIN_CHIPS = 2;
export const MAX_CHIPS = 4;
export const MAX_ACTIVE_CHIPS = 12;
export const MAX_DRAFTS_PER_SESSION = 5;

const GOOGLE_REVIEW_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "search.google.com",
  "maps.google.com",
  "g.page",
  "maps.app.goo.gl",
  "g.co",
  "google.co.in",
  "www.google.co.in",
  "maps.google.co.in",
]);

export function isAllowedGoogleReviewUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && GOOGLE_REVIEW_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}
