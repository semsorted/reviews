import { describe, expect, it } from "vitest";
import { applyCoupon, couponCode, formatInr, parseDesign } from "@/lib/poster-pricing";

const coupons = [{ code: "SEM251", amountOff: 251 }, { code: "BIG", amountOff: 5000 }];

describe("poster pricing", () => {
  it("takes 251 off the custom price", () => {
    expect(applyCoupon(2250, "SEM251", coupons)).toEqual({ code: "SEM251", discount: 251, total: 1999 });
  });

  it("ignores case and spaces in a typed code", () => {
    expect(applyCoupon(2250, "  sem251 ", coupons)?.total).toBe(1999);
    expect(couponCode(" sem251 ")).toBe("SEM251");
  });

  it("rejects an unknown or empty code", () => {
    expect(applyCoupon(2250, "NOPE", coupons)).toBeNull();
    expect(applyCoupon(2250, "", coupons)).toBeNull();
  });

  it("never lets a coupon make the poster free", () => {
    expect(applyCoupon(2250, "BIG", coupons)).toEqual({ code: "BIG", discount: 2249, total: 1 });
  });

  it("formats rupees the Indian way", () => {
    expect(formatInr(1999)).toBe("₹1,999");
    expect(formatInr(125000)).toBe("₹1,25,000");
  });

  it("defaults to the normal design", () => {
    expect(parseDesign("custom")).toBe("custom");
    expect(parseDesign("normal")).toBe("normal");
    expect(parseDesign(undefined)).toBe("normal");
    expect(parseDesign(["custom"])).toBe("normal");
  });
});
