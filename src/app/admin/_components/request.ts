export type AdminResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function adminRequest<T = unknown>(url: string, method: string, body?: unknown): Promise<AdminResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 401) {
      window.location.reload(); // The proxy sends an expired session to the login page.
      return { ok: false, error: "Sign in again to continue." };
    }
    const data = await res.json().catch(() => null);
    return res.ok ? { ok: true, data } : { ok: false, error: data?.error ?? "That did not save. Try again." };
  } catch {
    return { ok: false, error: "No connection. Check your internet and try again." };
  }
}
