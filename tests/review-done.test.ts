import { describe, expect, it } from "vitest";
import { readReviewDone, saveReviewDone, type ReviewDone } from "@/lib/reviews/review-done";

const memory = () => {
  const items = new Map<string, string>();
  return { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => void items.set(key, value) };
};
const done: ReviewDone = { kind: "google", text: "Good service.", at: 1_000 };

describe("finished review memory", () => {
  it("keeps a finished review for this QR so Back shows the thank you screen", () => {
    const storage = memory();
    saveReviewDone(storage, "token-a", done);
    expect(JSON.parse(readReviewDone(storage, "token-a", 2_000)!)).toEqual(done);
    expect(readReviewDone(storage, "token-b", 2_000)).toBeNull();
  });

  it("lets the same phone review again after 30 minutes", () => {
    const storage = memory();
    saveReviewDone(storage, "token-a", done);
    expect(readReviewDone(storage, "token-a", 1_000 + 29 * 60_000)).not.toBeNull();
    expect(readReviewDone(storage, "token-a", 1_000 + 30 * 60_000)).toBeNull();
  });

  it("ignores broken saved data", () => {
    const storage = memory();
    storage.setItem("semsorted-review-done:token-a", "{bad");
    expect(readReviewDone(storage, "token-a", 2_000)).toBeNull();
    storage.setItem("semsorted-review-done:token-a", JSON.stringify({ kind: "other", text: "x", at: 1_000 }));
    expect(readReviewDone(storage, "token-a", 2_000)).toBeNull();
  });

  it("still works when the browser blocks storage", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(() => saveReviewDone(blocked, "token-a", done)).not.toThrow();
    expect(readReviewDone(blocked, "token-a", 2_000)).toBeNull();
    expect(readReviewDone(null, "token-a", 2_000)).toBeNull();
  });
});
