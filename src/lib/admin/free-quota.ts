import type { Last24Row } from "./ai-usage";

export type QuotaMeter = { provider: string; name: string; used: number; limit: number | null; unit: string; calls: number; note: string };

// ponytail: Groq's numbers were read from the account's console on 25 Nov 2026. Cloudflare's come from reports. Both can change,
// so check each dashboard and edit here. Gemini has no published daily limit, so it only shows calls.
const CLOUDFLARE_NEURONS_PER_INPUT_TOKEN = 0.026668;
const CLOUDFLARE_NEURONS_PER_OUTPUT_TOKEN = 0.204805;

export const neuronsFor = (input: number, output: number) => Math.round(input * CLOUDFLARE_NEURONS_PER_INPUT_TOKEN + output * CLOUDFLARE_NEURONS_PER_OUTPUT_TOKEN);

export function quotaMeters(rows: Last24Row[]): QuotaMeter[] {
  const find = (provider: string) => rows.find((row) => row.provider === provider) ?? { provider, calls: 0, input: 0, output: 0 };
  const [groq, cloudflare, gemini] = [find("groq"), find("cloudflare"), find("gemini")];
  return [
    { provider: "groq", name: "Groq", used: groq.input + groq.output, limit: 200_000, unit: "tokens", calls: groq.calls, note: "From your Groq console: 200,000 tokens and 1,000 requests a day, 30 requests and 8,000 tokens a minute. Counted over the last 24 hours." },
    { provider: "cloudflare", name: "Cloudflare", used: neuronsFor(cloudflare.input, cloudflare.output), limit: 10_000, unit: "neurons", calls: cloudflare.calls, note: "Free plan gives 10,000 neurons a day. Used is estimated from tokens." },
    { provider: "gemini", name: "Gemini", used: gemini.input + gemini.output, limit: null, unit: "tokens", calls: gemini.calls, note: "Google does not publish a daily limit for this model. Check AI Studio." },
  ];
}
