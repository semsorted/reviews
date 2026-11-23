import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isUuid, notFoundResponse, readBody } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { normalizeWebsite, readWebsiteBrand } from "@/lib/brand/fetch";

const BrandSchema = z.object({ url: z.string().max(2048) });
const unreadable = () => NextResponse.json({ error: "This website could not be read. Pick the colors below or upload the logo yourself." }, { status: 422 });

/** Reads a website's colors and logo for preview. Nothing is saved until the admin applies it. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    if (!isUuid((await params).id)) return notFoundResponse();
    const body = await readBody(request, BrandSchema);
    const url = body && normalizeWebsite(body.url);
    if (!url) return NextResponse.json({ error: "Enter a public website link that starts with https://" }, { status: 400 });
    const brand = await readWebsiteBrand(url).catch((error: unknown) => {
      console.warn("[API:Admin:Brand] Website could not be read", error instanceof Error ? error.message : "unknown");
      return null;
    });
    return brand ? NextResponse.json({ brand }) : unreadable();
  } catch (error) {
    return adminErrorResponse(error);
  }
}
