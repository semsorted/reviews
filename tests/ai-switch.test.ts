import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ gemini: vi.fn(), groq: vi.fn(), usage: vi.fn() }));
const reply = (text: string, model = "m") => ({ draftText: text, model, inputTokens: 1, outputTokens: 1, latencyMs: 1 });

vi.mock("@/lib/ai/gemini.provider", () => ({ GeminiProvider: class { isConfigured = () => true; getDefaultModel = () => "g"; generateReviewDraft = mocks.gemini; } }));
vi.mock("@/lib/ai/chat-providers", async (original) => ({
  ...(await original<typeof import("@/lib/ai/chat-providers")>()),
  chatProvider: (id: string) => (id === "groq" ? { isConfigured: () => true, getDefaultModel: () => "q", generateReviewDraft: mocks.groq } : null),
}));
vi.mock("@/lib/ai/usage-tracker", () => ({ trackAiUsage: mocks.usage }));
vi.mock("@/lib/prisma", () => ({ prisma: { aiUsageLog: { count: vi.fn().mockResolvedValue(0) } } }));

import { parseDraftJson } from "@/lib/ai/chat-providers";
import { resetPausedProviders, writeAiDraft } from "@/lib/reviews/ai-draft";

const input = { shopId: "s", sessionId: "x", shopName: "Sunset Cafe", businessCategory: "Cafe", rating: 5, chips: ["Taste", "Service"], language: "en" as const };
const good = "I had a meal at Sunset Cafe. The taste and service were nice.";

beforeEach(() => {
  vi.clearAllMocks();
  resetPausedProviders();
  process.env.AI_PROVIDERS = "gemini,groq";
});

describe("writeAiDraft switching", () => {
  it("uses the first provider when it works", async () => {
    mocks.gemini.mockResolvedValue(reply(good));
    expect(await writeAiDraft(input)).toMatchObject({ text: good, provider: "gemini" });
    expect(mocks.groq).not.toHaveBeenCalled();
  });

  it("switches to the next provider when the first fails", async () => {
    mocks.gemini.mockRejectedValue(new Error("503 high demand"));
    mocks.groq.mockResolvedValue(reply(good, "llama"));
    expect(await writeAiDraft(input)).toMatchObject({ text: good, provider: "groq", model: "llama" });
    expect(mocks.gemini).toHaveBeenCalledTimes(1);
  });

  it("skips a provider whose quota ran out on the next call", async () => {
    mocks.gemini.mockRejectedValue(new Error("429 RESOURCE_EXHAUSTED"));
    mocks.groq.mockResolvedValue(reply(good));
    await writeAiDraft(input);
    await writeAiDraft(input);
    expect(mocks.gemini).toHaveBeenCalledTimes(1);
    expect(mocks.groq).toHaveBeenCalledTimes(2);
  });

  it("moves on when a draft fails the safety check", async () => {
    mocks.gemini.mockResolvedValue(reply("I bought a cake at Sunset Cafe and it was nice."));
    mocks.groq.mockResolvedValue(reply(good));
    expect(await writeAiDraft(input)).toMatchObject({ provider: "groq" });
  });

  it("returns null when every provider fails", async () => {
    mocks.gemini.mockRejectedValue(new Error("boom"));
    mocks.groq.mockRejectedValue(new Error("boom"));
    expect(await writeAiDraft(input)).toBeNull();
  });

  it("follows AI_PROVIDERS order and skips unknown names", async () => {
    process.env.AI_PROVIDERS = "nope,groq,gemini";
    mocks.groq.mockResolvedValue(reply(good));
    expect(await writeAiDraft(input)).toMatchObject({ provider: "groq" });
    expect(mocks.gemini).not.toHaveBeenCalled();
  });
});

describe("parseDraftJson", () => {
  it("reads JSON inside a code fence or after a sentence", () => {
    expect(parseDraftJson('```json\n{"draftText":"A fine review text"}\n```').draftText).toBe("A fine review text");
    expect(parseDraftJson('Here you go: {"draftText":"Another fine review"} Thanks').draftText).toBe("Another fine review");
  });
  it("recovers the review when a quote inside it breaks the JSON", () => {
    expect(parseDraftJson('{"draftText":"He said "great" teaching at Sunset Cafe, really.","headline":"Great"}').draftText).toBe('He said "great" teaching at Sunset Cafe, really.');
  });
  it("rejects a reply without JSON", () => {
    expect(() => parseDraftJson("just words")).toThrow();
  });
});
