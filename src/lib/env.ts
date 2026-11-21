const REQUIRED = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "DATABASE_URL",
] as const;

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function hostOf(value: string): string | null {
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function isPublicHttpsUrl(value: string): boolean {
  const host = hostOf(value);
  return value.startsWith("https://") && host !== null && !LOOPBACK_HOSTS.has(host);
}

function hasDatabaseTls(value: string): boolean {
  return LOOPBACK_HOSTS.has(hostOf(value) ?? "") || /[?&]sslmode=(require|verify-ca|verify-full)(&|$)/.test(value);
}

export function assertProductionEnv(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== "production") return;

  const missing: string[] = REQUIRED.filter((name) => !env[name]?.trim());
  if (!env.GEMINI_API_KEY?.trim() && !env.OPENAI_API_KEY?.trim()) {
    missing.push("GEMINI_API_KEY or OPENAI_API_KEY");
  }
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  if (!isPublicHttpsUrl(env.NEXT_PUBLIC_APP_URL!)) {
    throw new Error("NEXT_PUBLIC_APP_URL must be your public https domain, because it is printed in QR codes");
  }
  if (!hasDatabaseTls(env.DATABASE_URL!)) {
    throw new Error("DATABASE_URL must include sslmode=require, verify-ca, or verify-full");
  }
}
