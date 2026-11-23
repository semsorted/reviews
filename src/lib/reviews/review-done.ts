export type ReviewDone = { kind: "google" | "private"; text: string; at: number };
type SavedStore = Pick<Storage, "getItem" | "setItem">;

const KEEP_MS = 30 * 60_000;
const keyFor = (token: string) => `semsorted-review-done:${token}`;

export function saveReviewDone(storage: SavedStore | null, token: string, done: ReviewDone) {
  try {
    storage?.setItem(keyFor(token), JSON.stringify(done));
  } catch {}
}

/** Returns the saved text unchanged, so React can compare it between renders. */
export function readReviewDone(storage: SavedStore | null, token: string, now = Date.now()): string | null {
  try {
    const raw = storage?.getItem(keyFor(token));
    if (!raw) return null;
    const done = JSON.parse(raw);
    const isValid = (done?.kind === "google" || done?.kind === "private") && typeof done.text === "string" && typeof done.at === "number";
    return isValid && now >= done.at && now - done.at < KEEP_MS ? raw : null;
  } catch {
    return null;
  }
}
