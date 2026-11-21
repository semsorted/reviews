import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const signIn = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signInWithPassword: signIn } }),
}));

import { POST } from "@/app/api/auth/login/route";

const login = () =>
  POST(new NextRequest("http://localhost/api/auth/login", { method: "POST", body: JSON.stringify({ email: "a@example.com", password: "secret-pass" }) }));

describe("POST /api/auth/login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports wrong credentials", async () => {
    signIn.mockResolvedValue({ error: { code: "invalid_credentials", status: 400 } });
    const response = await login();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Incorrect email or password" });
  });

  it("does not call an outage a wrong password", async () => {
    signIn.mockResolvedValue({ error: { code: "unexpected_failure", status: 500 } });
    const response = await login();
    expect(response.status).toBe(503);
    expect((await response.json()).error).not.toContain("Incorrect");
  });

  it("reports login rate limiting", async () => {
    signIn.mockResolvedValue({ error: { code: "over_request_rate_limit", status: 429 } });
    expect((await login()).status).toBe(429);
  });
});
