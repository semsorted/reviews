import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, findProfile, redirect, notFound } = vi.hoisted(() => ({
  getUser: vi.fn(),
  findProfile: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("not-found");
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { profile: { findUnique: findProfile } },
}));
vi.mock("next/navigation", () => ({ redirect, notFound }));

import { getCurrentUser } from "@/lib/auth/session";
import { adminErrorResponse, AuthError, requireAdmin, requireAdminPage } from "@/lib/auth/guard";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { assertProductionEnv } from "@/lib/env";

const signedIn = { data: { user: { id: "u1", email: "a@example.com" } }, error: null };
const anonymous = { data: { user: null }, error: { message: "Auth session missing" } };
const profile = (role: string) => ({ id: "u1", email: "a@example.com", role, fullName: null, avatarUrl: null });

describe("getCurrentUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null without a Supabase user", async () => {
    getUser.mockResolvedValue(anonymous);
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("treats a signed-in user with no profile as forbidden", async () => {
    getUser.mockResolvedValue(signedIn);
    findProfile.mockResolvedValue(null);
    await expect(getCurrentUser()).rejects.toMatchObject({ name: "AuthError", status: 403 });
  });

  it("fails with 503 when the profile lookup fails", async () => {
    getUser.mockResolvedValue(signedIn);
    findProfile.mockRejectedValue(new Error("db down"));
    await expect(getCurrentUser()).rejects.toMatchObject({ name: "AuthError", status: 503 });
  });
});

describe("requireAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects anonymous visitors with 401", async () => {
    getUser.mockResolvedValue(anonymous);
    await expect(requireAdmin()).rejects.toMatchObject({ status: 401 });
  });

  it("rejects a shop owner with 403", async () => {
    getUser.mockResolvedValue(signedIn);
    findProfile.mockResolvedValue(profile("SHOP_OWNER"));
    const error = await requireAdmin().catch((e) => e);
    expect(error).toBeInstanceOf(AuthError);
    expect(error.status).toBe(403);
  });

  it("returns the super admin", async () => {
    getUser.mockResolvedValue(signedIn);
    findProfile.mockResolvedValue(profile("SUPER_ADMIN"));
    await expect(requireAdmin()).resolves.toMatchObject({ id: "u1", role: "SUPER_ADMIN" });
  });
});

describe("requireAdminPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends anonymous visitors to login", async () => {
    getUser.mockResolvedValue(anonymous);
    await expect(requireAdminPage()).rejects.toThrow("redirect:/login");
  });

  it("hides admin pages from non-admins", async () => {
    getUser.mockResolvedValue(signedIn);
    findProfile.mockResolvedValue(profile("SHOP_OWNER"));
    await expect(requireAdminPage()).rejects.toThrow("not-found");
  });
});

describe("adminErrorResponse", () => {
  it("keeps the auth status", async () => {
    const response = adminErrorResponse(new AuthError("Admin access required", 403));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Admin access required" });
  });

  it("hides unexpected error details", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = adminErrorResponse(new Error("password=secret"));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
    spy.mockRestore();
  });
});

describe("safeRedirectPath", () => {
  it("keeps a same-site path", () => {
    expect(safeRedirectPath("/admin/shops/1")).toBe("/admin/shops/1");
  });

  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "/\t/evil.com", "admin", "", null, undefined])(
    "falls back for %s",
    (value) => {
      expect(safeRedirectPath(value)).toBe("/admin");
    }
  );
});

describe("assertProductionEnv", () => {
  const complete = {
    NODE_ENV: "production",
    NEXT_PUBLIC_APP_URL: "https://reviews.example.com",
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    DATABASE_URL: "postgresql://user:pass@db.example.com:6543/postgres?sslmode=require",
    GEMINI_API_KEY: "key",
  } as unknown as NodeJS.ProcessEnv;

  it("accepts a complete production environment", () => {
    expect(() => assertProductionEnv(complete)).not.toThrow();
  });

  it("names a missing variable", () => {
    expect(() => assertProductionEnv({ ...complete, DATABASE_URL: "" })).toThrow("DATABASE_URL");
  });

  it("requires at least one AI key", () => {
    expect(() => assertProductionEnv({ ...complete, GEMINI_API_KEY: undefined })).toThrow("GEMINI_API_KEY");
  });

  it.each(["http://reviews.example.com", "https://localhost:3000", "https://127.0.0.1", "not a url"])(
    "rejects %s as the public QR URL",
    (url) => {
      expect(() => assertProductionEnv({ ...complete, NEXT_PUBLIC_APP_URL: url })).toThrow("NEXT_PUBLIC_APP_URL");
    }
  );

  it("requires TLS for a remote database", () => {
    expect(() =>
      assertProductionEnv({ ...complete, DATABASE_URL: "postgresql://user:pass@db.example.com/postgres" })
    ).toThrow("sslmode");
    expect(() =>
      assertProductionEnv({ ...complete, DATABASE_URL: "postgresql://user:pass@db.example.com/postgres?sslmode=disable" })
    ).toThrow("sslmode");
  });

  it("allows a local database without TLS", () => {
    expect(() =>
      assertProductionEnv({ ...complete, DATABASE_URL: "postgresql://postgres@127.0.0.1:5432/postgres" })
    ).not.toThrow();
  });

  it("does nothing outside production", () => {
    expect(() => assertProductionEnv({ NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv)).not.toThrow();
  });
});
