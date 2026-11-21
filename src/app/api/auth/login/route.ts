import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = LoginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error?.status === 429) {
      return NextResponse.json({ error: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
    }
    if (error?.code === "invalid_credentials" || (error?.status && error.status >= 400 && error.status < 500)) {
      return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
    }
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Auth:Login]", error);
    return NextResponse.json({ error: "Sign in is unavailable right now" }, { status: 503 });
  }
}
