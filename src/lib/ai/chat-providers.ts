import OpenAI from "openai";
import { buildReviewPrompts } from "./prompt-builder";
import { AIProvider, AIProviderId, GenerateReviewDraftInput, GenerateReviewDraftOutput, ReviewDraftOutputSchema } from "./provider.interface";

type Setup = { baseURL: string; key: string | undefined; model: string };

const env = (name: string) => process.env[name]?.trim() || undefined;

// Each of these speaks the OpenAI chat format, so one small class covers all of them. Models are env-overridable
// because free tiers retire them often (a retired model answers 404 or 410 and the next provider takes over).
const SETUPS: Record<string, () => Setup> = {
  cloudflare: () => ({
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${env("CLOUDFLARE_ACCOUNT_ID")}/ai/v1`,
    key: env("CLOUDFLARE_ACCOUNT_ID") && env("CLOUDFLARE_API_TOKEN"),
    model: env("CLOUDFLARE_MODEL") ?? "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  }),
  groq: () => ({ baseURL: "https://api.groq.com/openai/v1", key: env("GROQ_API_KEY"), model: env("GROQ_MODEL") ?? "openai/gpt-oss-120b" }),
  openrouter: () => ({ baseURL: "https://openrouter.ai/api/v1", key: env("OPENROUTER_API_KEY"), model: env("OPENROUTER_MODEL") ?? "meta-llama/llama-3.3-70b-instruct:free" }),
  openai: () => ({ baseURL: "https://api.openai.com/v1", key: env("OPENAI_API_KEY"), model: env("OPENAI_MODEL") ?? "gpt-4o-mini" }),
};

/** Models without a JSON mode still return JSON when asked, sometimes inside a code fence or with a sentence around it. */
export function parseDraftJson(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON in model reply");
  return ReviewDraftOutputSchema.parse(JSON.parse(raw.slice(start, end + 1)));
}

export function chatProvider(id: string): AIProvider | null {
  const setup = SETUPS[id]?.();
  if (!setup) return null;
  const client = setup.key ? new OpenAI({ apiKey: setup.key, baseURL: setup.baseURL }) : null;

  // gpt-oss thinks before it answers, so it needs a low effort and room for the thinking tokens.
  const thinking = /gpt-oss/.test(setup.model);

  return {
    id: id as AIProviderId,
    isConfigured: () => client !== null,
    getDefaultModel: () => setup.model,
    async generateReviewDraft(input: GenerateReviewDraftInput): Promise<GenerateReviewDraftOutput> {
      if (!client) throw new Error(`${id} is not configured`);
      const started = Date.now();
      const { systemPrompt, userPrompt } = buildReviewPrompts(input);
      const response = await client.chat.completions.create(
        {
          model: setup.model,
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
          temperature: input.temperature ?? 0.7,
          max_tokens: thinking ? 1500 : (input.maxTokens ?? 350),
          ...(thinking ? { reasoning_effort: "low" as const } : {}),
        },
        { signal: AbortSignal.timeout(input.timeoutMs ?? 15000) },
      );
      const draft = parseDraftJson(response.choices[0]?.message?.content ?? "");
      return {
        draftText: draft.draftText.trim(),
        headline: draft.headline?.trim(),
        provider: id as AIProviderId,
        model: setup.model,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        latencyMs: Date.now() - started,
        style: input.style,
        language: input.language,
        isFallback: false,
      };
    },
  };
}
