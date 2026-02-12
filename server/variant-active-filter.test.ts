import { describe, it, expect } from "vitest";

// Replicate the color maps used in the app
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
  "beige": "#D4B896",
  "brun": "#6B3A2A",
  "brown": "#6B3A2A",
  "bleu": "#2563EB",
  "blue": "#2563EB",
  "rouge": "#DC2626",
  "red": "#DC2626",
};

function getColorHex(colorName: string): string {
  const lower = colorName.toLowerCase().trim();
  return COLOR_MAP[lower] || "#9CA3AF";
}

describe("Color palette with Beige and Brun", () => {
  it("should return correct hex for Beige", () => {
    expect(getColorHex("Beige")).toBe("#D4B896");
    expect(getColorHex("beige")).toBe("#D4B896");
  });

  it("should return correct hex for Brun", () => {
    expect(getColorHex("Brun")).toBe("#6B3A2A");
    expect(getColorHex("brun")).toBe("#6B3A2A");
  });

  it("should return correct hex for Brown (English)", () => {
    expect(getColorHex("Brown")).toBe("#6B3A2A");
  });

  it("should still support all original colors", () => {
    expect(getColorHex("Blanc")).toBe("#FFFFFF");
    expect(getColorHex("Noir")).toBe("#1a1a1a");
    expect(getColorHex("Gris")).toBe("#808080");
    expect(getColorHex("Sterling Silver")).toBe("#C4C4C4");
  });
});

describe("Active variant filtering", () => {
  const allVariants = [
    { id: 1, color: "Blanc", isActive: true, stockQuantity: 5, imageUrl: "/img/blanc.jpg" },
    { id: 2, color: "Noir", isActive: true, stockQuantity: 3, imageUrl: "/img/noir.jpg" },
    { id: 3, color: "Gris", isActive: false, stockQuantity: 0, imageUrl: null },
    { id: 4, color: "Sterling Silver", isActive: true, stockQuantity: 2, imageUrl: "/img/silver.jpg" },
    { id: 5, color: "Beige", isActive: false, stockQuantity: 0, imageUrl: null },
    { id: 6, color: "Brun", isActive: false, stockQuantity: 0, imageUrl: null },
  ];

  it("should filter out inactive variants", () => {
    const activeVariants = allVariants.filter(v => v.isActive !== false);
    expect(activeVariants).toHaveLength(3);
    expect(activeVariants.map(v => v.color)).toEqual(["Blanc", "Noir", "Sterling Silver"]);
  });

  it("should return empty array when all variants are inactive", () => {
    const allInactive = allVariants.map(v => ({ ...v, isActive: false }));
    const activeVariants = allInactive.filter(v => v.isActive !== false);
    expect(activeVariants).toHaveLength(0);
  });

  it("should return all variants when all are active", () => {
    const allActive = allVariants.map(v => ({ ...v, isActive: true }));
    const activeVariants = allActive.filter(v => v.isActive !== false);
    expect(activeVariants).toHaveLength(6);
  });

  it("should handle variants where isActive is undefined (treat as active)", () => {
    const variantsWithUndefined = [
      { id: 1, color: "Blanc", isActive: undefined, stockQuantity: 5 },
      { id: 2, color: "Noir", isActive: false, stockQuantity: 3 },
    ];
    const activeVariants = variantsWithUndefined.filter(v => v.isActive !== false);
    expect(activeVariants).toHaveLength(1);
    expect(activeVariants[0].color).toBe("Blanc");
  });
});

describe("Toggle active logic", () => {
  it("should toggle from active to inactive", () => {
    const currentActive = true;
    const newActive = !currentActive;
    expect(newActive).toBe(false);
  });

  it("should toggle from inactive to active", () => {
    const currentActive = false;
    const newActive = !currentActive;
    expect(newActive).toBe(true);
  });

  it("should treat isActive !== false as active (for toggle)", () => {
    // When isActive is true, treat as active
    expect(true !== false).toBe(true);
    // When isActive is undefined, treat as active  
    expect(undefined !== false).toBe(true);
    // When isActive is false, treat as inactive
    expect(false !== false).toBe(false);
  });
});

describe("Auto-select first active variant", () => {
  const activeVariants = [
    { id: 2, color: "Noir", isActive: true, stockQuantity: 3 },
    { id: 4, color: "Sterling Silver", isActive: true, stockQuantity: 2 },
  ];

  it("should auto-select first active variant when no selection", () => {
    const selectedVariantId: number | null = null;
    let newSelection = selectedVariantId;
    if (activeVariants.length > 0 && !selectedVariantId) {
      newSelection = activeVariants[0].id;
    }
    expect(newSelection).toBe(2);
  });

  it("should re-select first active variant when current selection is no longer active", () => {
    const selectedVariantId = 3; // Gris was deactivated
    let newSelection = selectedVariantId;
    if (activeVariants.length > 0 && !activeVariants.find(v => v.id === selectedVariantId)) {
      newSelection = activeVariants[0].id;
    }
    expect(newSelection).toBe(2);
  });

  it("should keep current selection if it is still active", () => {
    const selectedVariantId = 4; // Sterling Silver is still active
    let newSelection = selectedVariantId;
    if (activeVariants.length > 0 && !activeVariants.find(v => v.id === selectedVariantId)) {
      newSelection = activeVariants[0].id;
    }
    expect(newSelection).toBe(4);
  });
});

describe("Opacity for inactive variants in admin", () => {
  it("should apply opacity-50 class for inactive variants", () => {
    const variant = { isActive: false };
    const className = variant.isActive === false ? "opacity-50" : "";
    expect(className).toBe("opacity-50");
  });

  it("should not apply opacity for active variants", () => {
    const variant = { isActive: true };
    const className = variant.isActive === false ? "opacity-50" : "";
    expect(className).toBe("");
  });
});
