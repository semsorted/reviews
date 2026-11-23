import { describe, expect, it } from "vitest";
import { upiPayee } from "@/lib/qr/generator";

describe("upiPayee", () => {
  it("reads the payee from a UPI payment link", () => {
    expect(upiPayee("upi://pay?pa=shop@test&pn=Test%20Owner&mc=0000&mode=02&purpose=00")).toBe("Test Owner");
  });

  it("keeps a valid link usable when the name is missing", () => {
    expect(upiPayee("upi://pay?pa=shop@test")).toBe("");
  });

  it.each([undefined, "", "https://example.test/pay?pa=shop@test", "upi://pay?pn=Test", "upi://collect?pa=shop@test"])("rejects %s", (value) => {
    expect(upiPayee(value)).toBeNull();
  });
});
