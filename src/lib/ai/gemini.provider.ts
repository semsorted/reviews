import { GoogleGenAI } from "@google/genai";
import {
  AIProvider,
  GenerateReviewDraftInput,
  GenerateReviewDraftOutput,
  ReviewDraftOutputSchema,
} from "./provider.interface";
import { buildReviewPrompts } from "./prompt-builder";

export class GeminiProvider implements AIProvider {
  readonly id = "gemini" as const;
  private client: GoogleGenAI | null = null;
  private defaultModel: string;

  constructor() {
    this.defaultModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== "" && !apiKey.includes("placeholder")) {
      this.client = new GoogleGenAI({ apiKey });
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
      throw new Error("Gemini API key is missing or not configured");
    }

    const startTime = Date.now();
    const { systemPrompt, userPrompt } = buildReviewPrompts(input);
    const model = process.env.GEMINI_MODEL || this.defaultModel;

    // Timeout via Promise.race
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API request timed out after 15 seconds")), 15000)
    );

    const generatePromise = (async () => {
      const response = await this.client!.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }],
          },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: input.temperature ?? 0.7,
          maxOutputTokens: input.maxTokens ?? 350,
        },
      });

      const latencyMs = Date.now() - startTime;
      const rawText = response.text?.trim() || "";

      if (!rawText) {
        throw new Error("Gemini returned empty text response");
      }

      // Clean markdown code fence if returned
      const cleanJson = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (parseErr) {
        throw new Error(`Failed to parse Gemini JSON output: ${(parseErr as Error).message}`);
      }

      const validated = ReviewDraftOutputSchema.parse(parsed);

      // Usage token counts if provided by SDK
      const usage = response.usageMetadata;
      const inputTokens = usage?.promptTokenCount ?? 0;
      const outputTokens = usage?.candidatesTokenCount ?? 0;

      return {
        draftText: validated.draftText.trim(),
        headline: validated.headline?.trim(),
        provider: "gemini" as const,
        model,
        inputTokens,
        outputTokens,
        latencyMs,
        style: input.style,
        language: input.language,
        isFallback: false,
      };
    })();

    return await Promise.race([generatePromise, timeoutPromise]);
  }
}
