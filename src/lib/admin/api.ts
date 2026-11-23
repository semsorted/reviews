import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isLogoImage } from "@/lib/admin/logo";
import { isAllowedGoogleReviewUrl, MAX_ACTIVE_CHIPS, MIN_CHIPS } from "@/lib/reviews/rules";

export const chipLabelSchema = z.string().trim().min(1).max(40);
const nameSchema = z.string().trim().min(2).max(80);
const categorySchema = z.string().trim().min(2).max(60);
const googleUrlSchema = z.string().trim().refine(isAllowedGoogleReviewUrl);
const logoUrlSchema = z.union([z.literal(""), z.url({ protocol: /^https$/ }).max(2048), z.string().refine(isLogoImage)]);
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const websiteSchema = z.union([z.literal(""), z.url({ protocol: /^https$/ }).max(2048)]);
const languageSchema = z.enum(["en", "hi", "hinglish"]);

export const ShopCreateSchema = z.object({
  name: nameSchema,
  businessCategory: categorySchema,
  googleReviewUrl: googleUrlSchema,
  defaultLanguage: languageSchema.default("en"),
  logoUrl: logoUrlSchema.optional(),
  primaryColor: colorSchema.default("#1A73E8"),
  chips: z.array(chipLabelSchema).min(MIN_CHIPS).max(MAX_ACTIVE_CHIPS),
});

export const ShopUpdateSchema = z
  .object({
    name: nameSchema,
    businessCategory: categorySchema,
    googleReviewUrl: googleUrlSchema,
    defaultLanguage: languageSchema,
    logoUrl: logoUrlSchema,
    primaryColor: colorSchema,
    websiteUrl: websiteSchema,
    surfaceColor: colorSchema.nullable(),
    accentColor: colorSchema.nullable(),
    isActive: z.boolean(),
  })
  .partial();

export function isUuid(value: string): boolean {
  return z.uuid().safeParse(value).success;
}

export function hasDuplicateLabels(labels: string[]): boolean {
  return new Set(labels.map((label) => label.toLowerCase())).size !== labels.length;
}

export function publicQrUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/r/${token}`;
}

export async function readBody<T extends z.ZodType>(request: NextRequest, schema: T): Promise<z.output<T> | null> {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  return parsed.success ? parsed.data : null;
}

export const badRequest = () => NextResponse.json({ error: "Please check the details and try again." }, { status: 400 });
export const notFoundResponse = () => NextResponse.json({ error: "Not found" }, { status: 404 });
export const conflict = (error: string) => NextResponse.json({ error }, { status: 409 });
