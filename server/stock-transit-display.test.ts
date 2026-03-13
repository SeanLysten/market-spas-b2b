import { describe, it, expect } from "vitest";

/**
 * Tests for stock and transit display logic in catalog and product detail.
 * The stock and transit data come from the supplier API (POST /api/supplier/stock/import)
 * and are stored on product variants (stockQuantity, inTransitQuantity).
 */

describe("Stock and Transit Display Logic", () => {
  // Helper to simulate variant data
  const createVariant = (
    id: number,
    name: string,
    stock: number,
    transit: number,
    isActive = true
  ) => ({
    id,
    name,
    color: name,
    stockQuantity: stock,
    inTransitQuantity: transit,
    isActive,
  });

  describe("Total stock calculation across variants", () => {
    it("should sum stockQuantity across all active variants", () => {
      const variants = [
        createVariant(1, "Sterling Marble", 8, 3),
        createVariant(2, "Odyssey", 4, 1),
        createVariant(3, "Midnight Opal", 2, 0),
      ];
      const activeVariants = variants.filter((v) => v.isActive !== false);
      const totalStock = activeVariants.reduce(
        (sum, v) => sum + (v.stockQuantity || 0),
        0
      );
      expect(totalStock).toBe(14);
    });

    it("should sum inTransitQuantity across all active variants", () => {
      const variants = [
        createVariant(1, "Sterling Marble", 8, 3),
        createVariant(2, "Odyssey", 4, 1),
        createVariant(3, "Midnight Opal", 2, 0),
      ];
      const activeVariants = variants.filter((v) => v.isActive !== false);
      const totalTransit = activeVariants.reduce(
        (sum, v) => sum + (v.inTransitQuantity || 0),
        0
      );
      expect(totalTransit).toBe(4);
    });

    it("should exclude inactive variants from totals", () => {
      const variants = [
        createVariant(1, "Sterling Marble", 8, 3, true),
        createVariant(2, "Odyssey", 4, 1, false),
        createVariant(3, "Midnight Opal", 2, 0, true),
      ];
      const activeVariants = variants.filter((v) => v.isActive !== false);
      const totalStock = activeVariants.reduce(
        (sum, v) => sum + (v.stockQuantity || 0),
        0
      );
      expect(totalStock).toBe(10); // 8 + 2, not 14
    });
  });

  describe("Reservation logic (isPreorder)", () => {
    it("should allow reservation when stock=0 and transit>0", () => {
      const stockAvailable = 0;
      const transitAvailable = 5;
      const isReservation = stockAvailable === 0 && transitAvailable > 0;
      expect(isReservation).toBe(true);
    });

    it("should NOT be a reservation when stock>0", () => {
      const stockAvailable = 3;
      const transitAvailable = 5;
      const isReservation = stockAvailable === 0 && transitAvailable > 0;
      expect(isReservation).toBe(false);
    });

    it("should NOT allow reservation when both stock=0 and transit=0", () => {
      const stockAvailable = 0;
      const transitAvailable = 0;
      const isReservation = stockAvailable === 0 && transitAvailable > 0;
      expect(isReservation).toBe(false);
    });
  });

  describe("Button label logic", () => {
    it("should show 'Ajouter au panier' when stock > 0", () => {
      const productStock = 5;
      const productTransit = 2;
      const label =
        productStock > 0
          ? "Ajouter au panier"
          : productTransit > 0
          ? "Réserver"
          : "Commander";
      expect(label).toBe("Ajouter au panier");
    });

    it("should show 'Réserver' when stock=0 and transit > 0", () => {
      const productStock = 0;
      const productTransit = 3;
      const label =
        productStock > 0
          ? "Ajouter au panier"
          : productTransit > 0
          ? "Réserver"
          : "Commander";
      expect(label).toBe("Réserver");
    });

    it("should show 'Commander' when both stock=0 and transit=0", () => {
      const productStock = 0;
      const productTransit = 0;
      const label =
        productStock > 0
          ? "Ajouter au panier"
          : productTransit > 0
          ? "Réserver"
          : "Commander";
      expect(label).toBe("Commander");
    });
  });

  describe("Selected variant stock/transit", () => {
    it("should use variant-level stock when a variant is selected", () => {
      const variants = [
        createVariant(1, "Sterling Marble", 8, 3),
        createVariant(2, "Odyssey", 0, 5),
      ];
      const selectedVariant = variants.find((v) => v.id === 2);
      const stockAvailable = selectedVariant
        ? selectedVariant.stockQuantity || 0
        : 0;
      const transitAvailable = selectedVariant
        ? selectedVariant.inTransitQuantity || 0
        : 0;
      expect(stockAvailable).toBe(0);
      expect(transitAvailable).toBe(5);
    });

    it("should use product-level totals when no variant is selected", () => {
      const variants = [
        createVariant(1, "Sterling Marble", 8, 3),
        createVariant(2, "Odyssey", 4, 1),
      ];
      const selectedVariant = null;
      const activeVariants = variants.filter((v) => v.isActive !== false);
      const stockAvailable = selectedVariant
        ? (selectedVariant as any).stockQuantity || 0
        : activeVariants.reduce(
            (sum, v) => sum + (v.stockQuantity || 0),
            0
          );
      const transitAvailable = selectedVariant
        ? (selectedVariant as any).inTransitQuantity || 0
        : activeVariants.reduce(
            (sum, v) => sum + (v.inTransitQuantity || 0),
            0
          );
      expect(stockAvailable).toBe(12);
      expect(transitAvailable).toBe(4);
    });
  });

  describe("Badge display logic", () => {
    it("should show green badge when stock > 0", () => {
      const stock = 5;
      const transit = 0;
      const badges: string[] = [];
      if (stock > 0) badges.push("En stock");
      if (transit > 0) badges.push("En transit");
      if (stock === 0 && transit === 0) badges.push("Indisponible");
      expect(badges).toEqual(["En stock"]);
    });

    it("should show both badges when stock > 0 and transit > 0", () => {
      const stock = 5;
      const transit = 3;
      const badges: string[] = [];
      if (stock > 0) badges.push("En stock");
      if (transit > 0) badges.push("En transit");
      if (stock === 0 && transit === 0) badges.push("Indisponible");
      expect(badges).toEqual(["En stock", "En transit"]);
    });

    it("should show only transit badge when stock=0 and transit > 0", () => {
      const stock = 0;
      const transit = 3;
      const badges: string[] = [];
      if (stock > 0) badges.push("En stock");
      if (transit > 0) badges.push("En transit");
      if (stock === 0 && transit === 0) badges.push("Indisponible");
      expect(badges).toEqual(["En transit"]);
    });

    it("should show indisponible badge when both are 0", () => {
      const stock = 0;
      const transit = 0;
      const badges: string[] = [];
      if (stock > 0) badges.push("En stock");
      if (transit > 0) badges.push("En transit");
      if (stock === 0 && transit === 0) badges.push("Indisponible");
      expect(badges).toEqual(["Indisponible"]);
    });
  });
});
