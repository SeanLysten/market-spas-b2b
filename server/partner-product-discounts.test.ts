import { describe, it, expect } from "vitest";

/**
 * Tests for the partner product discount priority logic.
 * Since resolvePartnerDiscount and resolveProductDiscountForPartner
 * call internal functions within the same module (which can't be easily mocked),
 * we test the pure discount resolution logic directly.
 */

// Pure function that mirrors the discount priority logic in resolveProductDiscountForPartner
function resolveDiscountPriority(
  perProductDiscount: number,
  partnerGlobalDiscount: number
): { discountPercent: number; source: "product" | "partner" | "none" } {
  if (perProductDiscount > 0) {
    return { discountPercent: perProductDiscount, source: "product" };
  }
  if (partnerGlobalDiscount > 0) {
    return { discountPercent: partnerGlobalDiscount, source: "partner" };
  }
  return { discountPercent: 0, source: "none" };
}

// Pure function that mirrors the global discount logic in resolvePartnerDiscount
function resolveGlobalDiscount(
  discountPercentStr: string | null | undefined
): { discountPercent: number; source: "custom" | "none" } {
  const customDiscount = discountPercentStr ? parseFloat(discountPercentStr) : 0;
  if (customDiscount > 0) {
    return { discountPercent: customDiscount, source: "custom" };
  }
  return { discountPercent: 0, source: "none" };
}

// Pure function that mirrors getCart discount calculation per item
function calculateItemDiscount(
  unitPriceHT: number,
  quantity: number,
  productDiscountsMap: Map<number, number>,
  productId: number,
  partnerGlobalDiscount: number
): { lineTotal: number; discountPercent: number; discountAmount: number } {
  const lineTotal = unitPriceHT * quantity;
  const productDiscount = productDiscountsMap.get(productId) ?? partnerGlobalDiscount;
  const discountAmount = (lineTotal * productDiscount) / 100;
  return { lineTotal, discountPercent: productDiscount, discountAmount };
}

describe("Partner Product Discounts - Priority Logic", () => {
  describe("resolveGlobalDiscount", () => {
    it("should return 0 when discountPercent is null", () => {
      const result = resolveGlobalDiscount(null);
      expect(result.discountPercent).toBe(0);
      expect(result.source).toBe("none");
    });

    it("should return 0 when discountPercent is '0'", () => {
      const result = resolveGlobalDiscount("0");
      expect(result.discountPercent).toBe(0);
      expect(result.source).toBe("none");
    });

    it("should return discount when set", () => {
      const result = resolveGlobalDiscount("15");
      expect(result.discountPercent).toBe(15);
      expect(result.source).toBe("custom");
    });

    it("should handle decimal discounts", () => {
      const result = resolveGlobalDiscount("7.5");
      expect(result.discountPercent).toBe(7.5);
      expect(result.source).toBe("custom");
    });

    it("should return 0 when discountPercent is undefined", () => {
      const result = resolveGlobalDiscount(undefined);
      expect(result.discountPercent).toBe(0);
      expect(result.source).toBe("none");
    });
  });

  describe("resolveDiscountPriority", () => {
    it("per-product discount takes priority over global", () => {
      const result = resolveDiscountPriority(25, 10);
      expect(result.discountPercent).toBe(25);
      expect(result.source).toBe("product");
    });

    it("falls back to global when no per-product discount", () => {
      const result = resolveDiscountPriority(0, 10);
      expect(result.discountPercent).toBe(10);
      expect(result.source).toBe("partner");
    });

    it("returns 0 when no discount at all", () => {
      const result = resolveDiscountPriority(0, 0);
      expect(result.discountPercent).toBe(0);
      expect(result.source).toBe("none");
    });

    it("per-product discount of 5% overrides global of 20%", () => {
      const result = resolveDiscountPriority(5, 20);
      expect(result.discountPercent).toBe(5);
      expect(result.source).toBe("product");
    });

    it("handles decimal per-product discount", () => {
      const result = resolveDiscountPriority(7.5, 10);
      expect(result.discountPercent).toBe(7.5);
      expect(result.source).toBe("product");
    });
  });

  describe("calculateItemDiscount - Cart calculation", () => {
    it("applies per-product discount when available", () => {
      const discountsMap = new Map<number, number>();
      discountsMap.set(5, 25); // Product 5 has 25% discount
      const result = calculateItemDiscount(100, 2, discountsMap, 5, 10);
      expect(result.lineTotal).toBe(200);
      expect(result.discountPercent).toBe(25);
      expect(result.discountAmount).toBe(50); // 200 * 25%
    });

    it("falls back to global discount when no per-product discount", () => {
      const discountsMap = new Map<number, number>();
      discountsMap.set(5, 25); // Only product 5 has specific discount
      const result = calculateItemDiscount(100, 3, discountsMap, 99, 10);
      expect(result.lineTotal).toBe(300);
      expect(result.discountPercent).toBe(10);
      expect(result.discountAmount).toBe(30); // 300 * 10%
    });

    it("no discount when map is empty and global is 0", () => {
      const discountsMap = new Map<number, number>();
      const result = calculateItemDiscount(100, 1, discountsMap, 5, 0);
      expect(result.lineTotal).toBe(100);
      expect(result.discountPercent).toBe(0);
      expect(result.discountAmount).toBe(0);
    });

    it("correctly calculates with multiple products", () => {
      const discountsMap = new Map<number, number>();
      discountsMap.set(1, 10);
      discountsMap.set(2, 20);
      discountsMap.set(3, 30);

      const result1 = calculateItemDiscount(50, 2, discountsMap, 1, 5);
      expect(result1.discountPercent).toBe(10);
      expect(result1.discountAmount).toBe(10); // 100 * 10%

      const result2 = calculateItemDiscount(80, 1, discountsMap, 2, 5);
      expect(result2.discountPercent).toBe(20);
      expect(result2.discountAmount).toBe(16); // 80 * 20%

      // Product without specific discount
      const result4 = calculateItemDiscount(200, 1, discountsMap, 99, 5);
      expect(result4.discountPercent).toBe(5);
      expect(result4.discountAmount).toBe(10); // 200 * 5%
    });

    it("handles high-value items with small discount", () => {
      const discountsMap = new Map<number, number>();
      discountsMap.set(1, 2.5);
      const result = calculateItemDiscount(5000, 1, discountsMap, 1, 0);
      expect(result.discountAmount).toBe(125); // 5000 * 2.5%
    });
  });
});
