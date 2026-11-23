export type PosterDesign = "normal" | "custom";
export type PosterCoupon = { code: string; amountOff: number };

export const parseDesign = (value: unknown): PosterDesign => (value === "custom" ? "custom" : "normal");
export const couponCode = (value: string) => value.trim().toUpperCase();
export const formatInr = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

/** A coupon can lower the price to ₹1 at most, even if prices change after it was made. */
export function applyCoupon(price: number, typedCode: string, coupons: PosterCoupon[]) {
  const code = couponCode(typedCode);
  const coupon = coupons.find((item) => item.code === code);
  if (!coupon) return null;
  const discount = Math.min(coupon.amountOff, price - 1);
  return { code, discount, total: price - discount };
}
