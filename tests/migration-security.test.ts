import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = () => readFileSync("supabase/migrations/20261121000000_chips_and_security.sql", "utf8");

describe("helper function lockdown", () => {
  it("removes public access to role-check functions", () => {
    const lockdown = readFileSync("supabase/migrations/20261122000000_lock_down_helpers.sql", "utf8");
    for (const fn of ["is_super_admin(uuid)", "has_shop_access(uuid, uuid)", "handle_new_user()"]) {
      expect(lockdown).toContain(`REVOKE EXECUTE ON FUNCTION public.${fn} FROM PUBLIC, anon, authenticated`);
    }
  });
});

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

describe("table ordering migration", () => {
  const ordering = () => readFileSync("supabase/migrations/20261127000000_table_ordering.sql", "utf8");
  const tables = ["ordering_settings", "menu_categories", "menu_items", "dining_tables", "table_sessions", "orders", "order_items", "restaurant_staff", "staff_sessions"];

  it.each(tables)("keeps %s behind RLS with no public access", (table) => {
    expect(ordering()).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    expect(ordering()).toMatch(new RegExp(`REVOKE ALL ON[\\s\\S]*public\\.${table}[\\s\\S]*FROM PUBLIC, anon, authenticated`));
  });

  it("allows only one open tab per table and unique bill numbers", () => {
    expect(ordering()).toContain("table_sessions_one_open_per_table ON public.table_sessions (table_id) WHERE status IN ('OPEN', 'BILL_REQUESTED')");
    expect(ordering()).toContain("UNIQUE (shop_id, bill_fy, bill_no)");
  });

  it("charges GST only with a GSTIN and has no service charge", () => {
    expect(ordering()).toContain("CHECK (gst_rate_bp = 0 OR gstin IS NOT NULL)");
    expect(ordering()).not.toMatch(/service_charge/i);
  });

  it("never stores staff secrets or cookies in plain text", () => {
    expect(ordering()).toMatch(/password_hash TEXT NOT NULL/);
    expect(ordering()).toContain("CHECK (role IN ('OWNER', 'MANAGER', 'KITCHEN', 'WAITER'))");
    expect(ordering()).toContain("id TEXT PRIMARY KEY CHECK (char_length(id) = 64)");
  });
});
