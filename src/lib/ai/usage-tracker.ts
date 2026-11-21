import { prisma } from "@/lib/prisma";
import { AIProviderId } from "./provider.interface";

export interface LogUsageParams {
  shopId: string;
  sessionId?: string;
  provider: AIProviderId | "fallback";
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  status: "SUCCESS" | "FAILED" | "FALLBACK";
  errorMessage?: string;
}

/**
 * Calculates estimated cost in USD based on standard published pricing.
 */
export function calculateEstimatedCost(
  provider: AIProviderId | "fallback",
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  if (provider === "fallback") {
    return 0.0;
  }

  // Cost per 1,000,000 tokens
  let inputCostPerM = 0.15;
  let outputCostPerM = 0.6;

  const normalizedModel = model.toLowerCase();

  if (provider === "gemini") {
    if (normalizedModel.includes("pro")) {
      inputCostPerM = 1.25;
      outputCostPerM = 5.0;
    } else {
      // Flash tier
      inputCostPerM = 0.075;
      outputCostPerM = 0.3;
    }
  } else if (provider === "openai") {
    if (normalizedModel.includes("gpt-4o-mini")) {
      inputCostPerM = 0.15;
      outputCostPerM = 0.6;
    } else if (normalizedModel.includes("gpt-4o")) {
      inputCostPerM = 2.5;
      outputCostPerM = 10.0;
    }
  }

  const cost = (inputTokens / 1_000_000) * inputCostPerM + (outputTokens / 1_000_000) * outputCostPerM;
  return Number(cost.toFixed(6));
}

/**
 * Persists an AI usage event into the database.
 */
export async function trackAiUsage(params: LogUsageParams): Promise<void> {
  const estimatedCost = calculateEstimatedCost(
    params.provider,
    params.model,
    params.inputTokens,
    params.outputTokens
  );

  try {
    await prisma.aiUsageLog.create({
      data: {
        shopId: params.shopId,
        sessionId: params.sessionId || null,
        provider: params.provider,
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        estimatedCost,
        status: params.status,
        errorMessage: params.errorMessage || null,
        latencyMs: params.latencyMs,
      },
    });
  } catch (error) {
    // Log error to console without failing the customer review flow
    console.error("[UsageTracker] Failed to record AI usage log:", error);
  }
}
