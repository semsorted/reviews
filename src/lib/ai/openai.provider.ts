import OpenAI from "openai";
import {
  AIProvider,
  GenerateReviewDraftInput,
  GenerateReviewDraftOutput,
  ReviewDraftOutputSchema,
} from "./provider.interface";
import { buildReviewPrompts } from "./prompt-builder";

export class OpenAIProvider implements AIProvider {
  readonly id = "openai" as const;
  private client: OpenAI | null = null;
  private defaultModel: string;

  constructor() {
    this.defaultModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.trim() !== "" && !apiKey.includes("placeholder")) {
      this.client = new OpenAI({ apiKey });
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  async generateReviewDraft(
    input: GenerateReviewDraftInput
  ): Promise<GenerateReviewDraftOutput> {
    if (!this.client) {
      throw new Error("OpenAI API key is missing or not configured");
    }

    const startTime = Date.now();
    const { systemPrompt, userPrompt } = buildReviewPrompts(input);
    const model = process.env.OPENAI_MODEL || this.defaultModel;

    // 15s timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await this.client.chat.completions.create(
        {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: input.temperature ?? 0.7,
          max_tokens: input.maxTokens ?? 350,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      const choice = response.choices[0];
      const content = choice?.message?.content;

      if (!content) {
        throw new Error("OpenAI returned an empty response content");
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        throw new Error(`Failed to parse OpenAI JSON output: ${(parseError as Error).message}`);
      }

      const validated = ReviewDraftOutputSchema.parse(parsed);

      return {
        draftText: validated.draftText.trim(),
        headline: validated.headline?.trim(),
        provider: "openai",
        model,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        latencyMs,
        style: input.style,
        language: input.language,
        isFallback: false,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const err = error as Error;
      if (err.name === "AbortError") {
        throw new Error("OpenAI API request timed out after 15 seconds");
      }
      throw err;
    }
  }
}
