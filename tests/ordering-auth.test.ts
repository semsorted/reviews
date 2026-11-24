import { describe, expect, it } from "vitest";
import { CAN, hashSecret, normalizeLogin, passwordProblem, sessionIdFor, verifySecret } from "@/lib/ordering/staff-auth";

describe("restaurant staff auth", () => {
  it("hashes secrets with a salt and verifies them", async () => {
    const one = await hashSecret("5839");
    const two = await hashSecret("5839");
    expect(one).not.toBe(two);
    expect(one).not.toContain("5839");
    expect(await verifySecret("5839", one)).toBe(true);
    expect(await verifySecret("5838", one)).toBe(false);
    expect(await verifySecret("5839", null)).toBe(false);
    expect(await verifySecret("5839", "broken")).toBe(false);
  });

  it("accepts an email, an Indian mobile number or a username as the login", () => {
    expect(normalizeLogin(" Owner@Balaji.IN ")).toBe("owner@balaji.in");
    expect(normalizeLogin("+91 98290 12345")).toBe("9829012345");
    expect(normalizeLogin("919829012345")).toBe("9829012345");
    expect(normalizeLogin("09829012345")).toBe("9829012345");
    expect(normalizeLogin("Balaji.Kitchen")).toBe("balaji.kitchen");
    for (const bad of ["", "12345", "5829012345", "not a login", "a@b", "ab", "1balaji", "waiter one"]) expect(normalizeLogin(bad)).toBeNull();
  });

  it("asks for passwords of 8 to 72 characters", () => {
    expect(passwordProblem("dhaba-123")).toBeNull();
    expect(passwordProblem("short")).toBeTruthy();
    expect(passwordProblem("x".repeat(73))).toBeTruthy();
  });

  it("keeps money and staff changes away from kitchen and waiters", () => {
    expect(CAN.markPaid).not.toContain("KITCHEN");
    expect(CAN.markPaid).not.toContain("WAITER");
    expect(CAN.manageStaff).toEqual(["OWNER"]);
    expect(CAN.billSettings).toEqual(["OWNER"]);
    expect(CAN.takeOrder).toContain("WAITER");
    expect(CAN.cook).not.toContain("WAITER");
    expect(CAN.toggleDish).toContain("KITCHEN");
  });

  it("stores only a hash of the session cookie", () => {
    const id = sessionIdFor("cookie-value");
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(id).not.toContain("cookie-value");
    expect(sessionIdFor("cookie-value")).toBe(id);
  });
});
