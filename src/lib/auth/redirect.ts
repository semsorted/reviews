const BASE = "https://same-site.invalid";

export function safeRedirectPath(value: string | null | undefined, fallback = "/admin"): string {
  if (!value?.startsWith("/")) return fallback;
  try {
    // The URL parser normalizes the backslash and control-character tricks browsers accept.
    return new URL(value, BASE).origin === BASE ? value : fallback;
  } catch {
    return fallback;
  }
}
