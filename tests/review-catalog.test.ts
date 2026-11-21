import { describe, expect, it } from "vitest";
import { chipLabelSchema, hasDuplicateLabels } from "@/lib/admin/api";
import { chipsForShopType, GENERIC_CHIPS, isCatalogShopType, SHOP_TYPES } from "@/lib/reviews/catalog";
import { MAX_ACTIVE_CHIPS, MIN_CHIPS } from "@/lib/reviews/rules";

describe("shop type catalog", () => {
  it("covers a broad range of businesses", () => {
    expect(SHOP_TYPES.length).toBeGreaterThanOrEqual(100);
    expect(new Set(SHOP_TYPES.map((type) => type.label)).size).toBe(SHOP_TYPES.length);
  });

  it.each(SHOP_TYPES.map((type) => [type.label, type.chips] as const))("%s has valid neutral chips", (_label, chips) => {
    expect(chips.length).toBeGreaterThanOrEqual(Math.max(MIN_CHIPS, 7));
    expect(chips.length).toBeLessThanOrEqual(MAX_ACTIVE_CHIPS);
    expect(hasDuplicateLabels(chips)).toBe(false);
    for (const chip of chips) {
      expect(chipLabelSchema.safeParse(chip).success).toBe(true);
      expect(chip).not.toMatch(/\b(good|great|best|excellent|amazing|friendly staff|bad|poor)\b/i);
    }
  });

  it("returns chips for the selected shop type", () => {
    expect(chipsForShopType("Bakery")).toContain("Cakes");
    expect(chipsForShopType("Dental clinic")).toContain("Dentist");
    expect(isCatalogShopType("Bakery")).toBe(true);
  });

  it("uses general chips for a custom business", () => {
    expect(chipsForShopType("Antique restorer")).toEqual(GENERIC_CHIPS);
    expect(isCatalogShopType("Antique restorer")).toBe(false);
  });
});
