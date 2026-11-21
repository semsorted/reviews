const BASE = "https://same-site.invalid";

export function safeRedirectPath(value: string | null | undefined, fallback = "/admin"): string {
  if (!value?.startsWith("/")) return fallback;
  try {
    // The URL parser normalizes the backslash and control-character tricks browsers accept.
    const url = new URL(value, BASE);
    return url.origin === BASE && !url.pathname.startsWith("//") ? value : fallback;
  } catch {
    return fallback;
  }
}
