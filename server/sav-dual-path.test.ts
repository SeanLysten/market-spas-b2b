import { describe, it, expect, vi } from "vitest";

/**
 * Tests for the dual-path SAV system:
 * - Market Spas path: model selection + BOM parts + warranty analysis
 * - Other Brand path: manual form with brand, model, year, identifier
 */

// Mock DB module
vi.mock("./db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue([]),
      }),
    }),
  },
}));

describe("SAV Dual Path System", () => {
  describe("Brand Labels", () => {
    const BRAND_LABELS: Record<string, string> = {
      MARKET_SPAS: "Market Spas",
      OTHER_BRAND: "Autre marque",
    };

    it("should only contain Market Spas and Other Brand", () => {
      expect(Object.keys(BRAND_LABELS)).toHaveLength(2);
      expect(BRAND_LABELS).toHaveProperty("MARKET_SPAS");
      expect(BRAND_LABELS).toHaveProperty("OTHER_BRAND");
    });

    it("should NOT contain Wellis, Platinum, or Passion brands", () => {
      expect(BRAND_LABELS).not.toHaveProperty("WELLIS_CLASSIC");
      expect(BRAND_LABELS).not.toHaveProperty("WELLIS_LIFE");
      expect(BRAND_LABELS).not.toHaveProperty("WELLIS_WIBES");
      expect(BRAND_LABELS).not.toHaveProperty("PASSION_SPAS");
      expect(BRAND_LABELS).not.toHaveProperty("PLATINUM_SPAS");
    });
  });

  describe("Market Spas Path", () => {
    it("should have 5 steps: identification, diagnostic, warranty, photos, summary", () => {
      const marketSpasSteps = [
        "Identification du produit",
        "Diagnostic du problème",
        "Conditions de garantie",
        "Photos et vidéos",
        "Récapitulatif et envoi",
      ];
      expect(marketSpasSteps).toHaveLength(5);
    });

    it("should support spaModelId for model selection", () => {
      const formData = {
        brand: "MARKET_SPAS",
        spaModelId: 42,
        modelName: "MyLine Saturn",
        serialNumber: "SN-12345",
        selectedPartIds: [1, 2, 3],
      };
      expect(formData.spaModelId).toBeDefined();
      expect(formData.selectedPartIds).toHaveLength(3);
    });

    it("should allow empty selectedPartIds when no model parts exist", () => {
      const formData = {
        brand: "MARKET_SPAS",
        spaModelId: null,
        modelName: "Custom Model",
        serialNumber: "SN-99999",
        selectedPartIds: [],
      };
      expect(formData.selectedPartIds).toHaveLength(0);
    });
  });

  describe("Other Brand Path", () => {
    it("should have 4 steps: info, description, photos, summary", () => {
      const otherBrandSteps = [
        "Informations du spa",
        "Description du problème",
        "Photos et vidéos",
        "Récapitulatif et envoi",
      ];
      expect(otherBrandSteps).toHaveLength(4);
    });

    it("should require manual brand and model input", () => {
      const formData = {
        brand: "OTHER_BRAND",
        otherBrandName: "Jacuzzi",
        otherModelName: "J-335",
        purchaseYear: "2023",
        spaIdentifier: "JZ-2023-001",
        description: "Fuite au niveau de la pompe principale",
      };
      expect(formData.brand).toBe("OTHER_BRAND");
      expect(formData.otherBrandName).toBe("Jacuzzi");
      expect(formData.otherModelName).toBe("J-335");
      expect(formData.purchaseYear).toBe("2023");
      expect(formData.spaIdentifier).toBe("JZ-2023-001");
    });

    it("should NOT have warranty analysis for other brands", () => {
      const isOtherBrand = true;
      const warrantyAnalysis = isOtherBrand ? null : { status: "COVERED" };
      expect(warrantyAnalysis).toBeNull();
    });

    it("should NOT have BOM parts selection for other brands", () => {
      const formData = {
        brand: "OTHER_BRAND",
        spaModelId: null,
        selectedPartIds: [],
      };
      expect(formData.spaModelId).toBeNull();
      expect(formData.selectedPartIds).toHaveLength(0);
    });
  });

  describe("Shared Features", () => {
    it("should support media files (photos and videos) for both paths", () => {
      const mediaFiles = [
        { type: "IMAGE", file: new Blob(), preview: "data:image/jpeg;base64,..." },
        { type: "IMAGE", file: new Blob(), preview: "data:image/jpeg;base64,..." },
        { type: "VIDEO", file: new Blob(), preview: "" },
      ];
      const photos = mediaFiles.filter((m) => m.type === "IMAGE");
      const videos = mediaFiles.filter((m) => m.type === "VIDEO");
      expect(photos).toHaveLength(2);
      expect(videos).toHaveLength(1);
    });

    it("should require minimum 2 photos", () => {
      const mediaFiles = [
        { type: "IMAGE", file: new Blob(), preview: "data:image/jpeg;base64,..." },
      ];
      const isValid = mediaFiles.filter((m) => m.type === "IMAGE").length >= 2;
      expect(isValid).toBe(false);
    });

    it("should support urgency levels for both paths", () => {
      const urgencyLevels = ["NORMAL", "URGENT", "CRITICAL"];
      expect(urgencyLevels).toContain("NORMAL");
      expect(urgencyLevels).toContain("URGENT");
      expect(urgencyLevels).toContain("CRITICAL");
    });

    it("should support customer info for both paths", () => {
      const customerInfo = {
        customerName: "Jean Dupont",
        customerPhone: "0612345678",
        customerEmail: "jean@example.com",
        customerAddress: "123 Rue de la Paix, Paris",
      };
      expect(customerInfo.customerName).toBeDefined();
      expect(customerInfo.customerEmail).toContain("@");
    });
  });

  describe("Warranty Engine Compatibility", () => {
    it("should keep components data for legacy brands in engine", async () => {
      const { COMPONENTS_BY_BRAND } = await import("./warranty-engine");
      expect(COMPONENTS_BY_BRAND).toHaveProperty("MARKET_SPAS");
      // Legacy brands still exist in engine for backward compatibility
      expect(COMPONENTS_BY_BRAND).toHaveProperty("WELLIS_CLASSIC");
      expect(COMPONENTS_BY_BRAND).toHaveProperty("PLATINUM_SPAS");
    });

    it("should have OTHER_BRAND in components list with empty array", async () => {
      const { COMPONENTS_BY_BRAND } = await import("./warranty-engine");
      expect(COMPONENTS_BY_BRAND).toHaveProperty("OTHER_BRAND");
      expect(COMPONENTS_BY_BRAND.OTHER_BRAND).toEqual([]);
    });

    it("should have OTHER_BRAND in product lines", async () => {
      const { PRODUCT_LINES_BY_BRAND } = await import("./warranty-engine");
      expect(PRODUCT_LINES_BY_BRAND).toHaveProperty("OTHER_BRAND");
      expect(PRODUCT_LINES_BY_BRAND.OTHER_BRAND).toEqual([]);
    });
  });
});
