import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = () => readFileSync("supabase/migrations/20261121000000_chips_and_security.sql", "utf8");

describe("chips and security migration", () => {
  it("creates review chips behind RLS", () => {
    expect(sql()).toContain("CREATE TABLE IF NOT EXISTS public.review_chips");
    expect(sql()).toContain("ALTER TABLE public.review_chips ENABLE ROW LEVEL SECURITY");
  });

  it("fixes the member check", () => {
    expect(sql()).toContain("shop_members.user_id = has_shop_access.user_id");
  });

  it("never reads a role from signup metadata", () => {
    expect(sql()).toContain("CREATE OR REPLACE FUNCTION public.handle_new_user()");
    expect(sql()).not.toContain("raw_user_meta_data->>'role'");
  });

  it("keeps shops when an admin auth user is deleted", () => {
    expect(sql()).toContain("REFERENCES public.profiles(id) ON DELETE RESTRICT");
    expect(readFileSync("prisma/schema.prisma", "utf8")).toMatch(/owner\s+Profile\s+@relation\("ShopOwner".*onDelete: Restrict/);
  });

  it("maps the draft session as a UUID", () => {
    expect(readFileSync("prisma/schema.prisma", "utf8")).toMatch(/sessionId\s+String\s+@map\("session_id"\) @db\.Uuid/);
  });

  it.each([
    "Anyone can create review sessions",
    "Sessions can create review drafts",
    "Anyone can record analytics events",
    "Shop members can view QR codes",
  ])("drops public policy: %s", (policy) => {
    expect(sql()).toContain(`DROP POLICY IF EXISTS "${policy}"`);
  });
});
