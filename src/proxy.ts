import { NextResponse, type NextRequest } from "next/server";
import { isRetiredPath } from "@/lib/site";
import { updateSession } from "@/lib/supabase/middleware";

const RETIRED_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page removed</title></head><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:20vh auto;padding:0 20px;color:#202124"><h1>This page has been removed</h1><p>Semsorted now helps local shops collect honest Google reviews.</p><p><a href="/" style="color:#1a73e8">Go to the home page</a></p></body></html>`;

export function proxy(request: NextRequest) {
  if (isRetiredPath(request.nextUrl.pathname)) {
    return new NextResponse(RETIRED_PAGE, {
      status: 410,
      headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
    });
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/why-semsorted/:path*",
    "/universities/:path*",
    "/request/:path*",
    "/prices/:path*",
    "/how-it-works/:path*",
    "/faq/:path*",
  ],
};
