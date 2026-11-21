import { NextRequest, NextResponse } from "next/server";
import { badRequest, isUuid, notFoundResponse, publicQrUrl } from "@/lib/admin/api";
import { adminErrorResponse, requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { generateQrPng, generateQrSvg } from "@/lib/qr/generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qrId: string }> }
) {
  try {
    await requireAdmin();
    const { id: shopId, qrId } = await params;
    if (!isUuid(shopId) || !isUuid(qrId)) return notFoundResponse();

    const format = request.nextUrl.searchParams.get("format");
    if (format !== "png" && format !== "svg") return badRequest();

    const qrCode = await prisma.qrCode.findFirst({
      where: { id: qrId, shopId },
      select: { name: true, publicToken: true },
    });
    if (!qrCode) return notFoundResponse();

    const url = publicQrUrl(qrCode.publicToken);
    const name = qrCode.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "review";
    const body =
      format === "png"
        ? new Uint8Array(Buffer.from((await generateQrPng({ url })).split(",")[1], "base64"))
        : await generateQrSvg({ url });

    return new NextResponse(body, {
      headers: {
        "Content-Type": format === "png" ? "image/png" : "image/svg+xml",
        "Content-Disposition": `attachment; filename="${name}-qr.${format}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
