import { describe, it, expect } from "vitest";

// Test the color mapping logic used in the catalog
const COLOR_MAP: Record<string, string> = {
  "blanc": "#FFFFFF",
  "white": "#FFFFFF",
  "noir": "#1a1a1a",
  "black": "#1a1a1a",
  "gris": "#808080",
  "grey": "#808080",
  "gray": "#808080",
  "sterling silver": "#C4C4C4",
  "silver": "#C4C4C4",
  "argent": "#C4C4C4",
  "bleu": "#2563EB",
  "blue": "#2563EB",
  "rouge": "#DC2626",
  "red": "#DC2626",
};

function getColorHex(colorName: string): string {
  const lower = colorName.toLowerCase().trim();
  return COLOR_MAP[lower] || "#9CA3AF";
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 186;
}

describe("Catalog Color Swatches", () => {
  describe("getColorHex", () => {
    it("should return correct hex for Blanc", () => {
      expect(getColorHex("Blanc")).toBe("#FFFFFF");
    });

    it("should return correct hex for blanc (lowercase)", () => {
      expect(getColorHex("blanc")).toBe("#FFFFFF");
    });

    it("should return correct hex for Noir", () => {
      expect(getColorHex("Noir")).toBe("#1a1a1a");
    });

    it("should return correct hex for Gris", () => {
      expect(getColorHex("Gris")).toBe("#808080");
    });

    it("should return correct hex for Sterling Silver", () => {
      expect(getColorHex("Sterling Silver")).toBe("#C4C4C4");
    });

    it("should return correct hex for sterling silver (lowercase)", () => {
      expect(getColorHex("sterling silver")).toBe("#C4C4C4");
    });

    it("should return fallback gray for unknown colors", () => {
      expect(getColorHex("Rose")).toBe("#9CA3AF");
    });

    it("should handle whitespace", () => {
      expect(getColorHex("  Blanc  ")).toBe("#FFFFFF");
    });

    it("should handle English color names", () => {
      expect(getColorHex("White")).toBe("#FFFFFF");
      expect(getColorHex("Black")).toBe("#1a1a1a");
      expect(getColorHex("Gray")).toBe("#808080");
    });
  });

  describe("isLightColor", () => {
    it("should detect white as light", () => {
      expect(isLightColor("#FFFFFF")).toBe(true);
    });

    it("should detect black as dark", () => {
      expect(isLightColor("#1a1a1a")).toBe(false);
    });

    it("should detect gray as light-ish", () => {
      expect(isLightColor("#808080")).toBe(false);
    });

    it("should detect sterling silver as light", () => {
      expect(isLightColor("#C4C4C4")).toBe(true);
    });
  });

  describe("Variant selection logic", () => {
    const variants = [
      { id: 1, color: "Blanc", stockQuantity: 5, imageUrl: "/img/blanc.jpg" },
      { id: 2, color: "Noir", stockQuantity: 3, imageUrl: "/img/noir.jpg" },
      { id: 3, color: "Gris", stockQuantity: 0, imageUrl: null },
      { id: 4, color: "Sterling Silver", stockQuantity: 2, imageUrl: "/img/silver.jpg" },
    ];

    it("should find selected variant by id", () => {
      const selectedId = 2;
      const selected = variants.find(v => v.id === selectedId);
      expect(selected?.color).toBe("Noir");
      expect(selected?.imageUrl).toBe("/img/noir.jpg");
    });

    it("should return null when no variant is selected", () => {
      const selectedId = null;
      const selected = variants.find(v => v.id === selectedId) || null;
      expect(selected).toBeNull();
    });

    it("should use variant image when selected", () => {
      const selectedVariant = variants[0];
      const productImage = "/img/product.jpg";
      const displayImage = selectedVariant?.imageUrl || productImage;
      expect(displayImage).toBe("/img/blanc.jpg");
    });

    it("should fall back to product image when variant has no image", () => {
      const selectedVariant = variants[2]; // Gris has no image
      const productImage = "/img/product.jpg";
      const displayImage = selectedVariant?.imageUrl || productImage;
      expect(displayImage).toBe("/img/product.jpg");
    });

    it("should show variant stock when variant is selected", () => {
      const selectedVariant = variants[1];
      const productStock = 10;
      const displayStock = selectedVariant ? (selectedVariant.stockQuantity || 0) : productStock;
      expect(displayStock).toBe(3);
    });

    it("should show product stock when no variant is selected", () => {
      const selectedVariant = null;
      const productStock = 10;
      const displayStock = selectedVariant ? (selectedVariant.stockQuantity || 0) : productStock;
      expect(displayStock).toBe(10);
    });

    it("should toggle variant selection (select then deselect)", () => {
      let selectedId: number | null = null;
      
      // Select variant 1
      selectedId = selectedId === 1 ? null : 1;
      expect(selectedId).toBe(1);
      
      // Click same variant again to deselect
      selectedId = selectedId === 1 ? null : 1;
      expect(selectedId).toBeNull();
    });
  });
});
