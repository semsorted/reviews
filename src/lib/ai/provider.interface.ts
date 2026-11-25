import { z } from "zod";

export type AIProviderId = "openai" | "gemini" | "cloudflare" | "groq" | "openrouter";
export type ReviewStyle = "short" | "natural" | "detailed";
export type ReviewLanguage = "en" | "hi" | "hinglish";

export const ReviewDraftOutputSchema = z.object({
  draftText: z
    .string()
    .min(5, "Draft text must be at least 5 characters")
    .max(2000, "Draft text exceeds allowable length"),
  headline: z.string().optional(),
});

export type ReviewDraftStructuredOutput = z.infer<typeof ReviewDraftOutputSchema>;

export interface GenerateReviewDraftInput {
  shopId: string;
  sessionId?: string;
  shopName: string;
  businessCategory: string;
  rating: number;
  chips: string[];
  /** Earlier reviews the new one must not repeat or closely copy. */
  avoid?: string[];
  style: ReviewStyle;
  language: ReviewLanguage;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface GenerateReviewDraftOutput {
  draftText: string;
  headline?: string;
  provider: AIProviderId | "fallback";
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  style: ReviewStyle;
  language: ReviewLanguage;
  isFallback: boolean;
}

export interface AIProvider {
  readonly id: AIProviderId;
  generateReviewDraft(input: GenerateReviewDraftInput): Promise<GenerateReviewDraftOutput>;
  isConfigured(): boolean;
  getDefaultModel(): string;
}
