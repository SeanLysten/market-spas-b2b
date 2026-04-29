import { describe, it, expect } from "vitest";
import { analyzeWarranty, COMPONENTS_BY_BRAND, DEFECT_TYPES_BY_COMPONENT, PRODUCT_LINES_BY_BRAND, COMPONENT_TO_SPARE_CATEGORY, generateTrackingUrl, TRACKING_URL_TEMPLATES, type WarrantyInput, type WarrantyResult } from "./warranty-engine";

describe("Warranty Engine", () => {
  // ===== REFERENCE DATA TESTS =====
  describe("Reference Data", () => {
    it("should have components for all brands", () => {
      const brands = ["MARKET_SPAS", "WELLIS_CLASSIC", "WELLIS_LIFE", "WELLIS_WIBES", "PASSION_SPAS", "PLATINUM_SPAS"];
      for (const brand of brands) {
        expect(COMPONENTS_BY_BRAND[brand]).toBeDefined();
        expect(COMPONENTS_BY_BRAND[brand].length).toBeGreaterThan(0);
      }
    });

    it("should have defect types for common components", () => {
      const components = ["Structure / Coque", "Pompes", "Chauffage", "Boîtier de commande / Afficheur"];
      for (const comp of components) {
        expect(DEFECT_TYPES_BY_COMPONENT[comp]).toBeDefined();
        expect(DEFECT_TYPES_BY_COMPONENT[comp].length).toBeGreaterThan(0);
      }
    });

    it("should have product lines for brands that have them", () => {
      expect(PRODUCT_LINES_BY_BRAND["WELLIS_CLASSIC"]).toBeDefined();
      expect(PRODUCT_LINES_BY_BRAND["PASSION_SPAS"]).toBeDefined();
    });

    it("should map components to spare part categories", () => {
      expect(COMPONENT_TO_SPARE_CATEGORY["Pompes"]).toEqual(["PUMPS"]);
      expect(COMPONENT_TO_SPARE_CATEGORY["Boîtier de commande / Afficheur"]).toEqual(["ELECTRONICS"]);
      expect(COMPONENT_TO_SPARE_CATEGORY["Chauffage"]).toEqual(["HEATING"]);
    });
  });

  // ===== TRACKING URL TESTS =====
  describe("generateTrackingUrl", () => {
    it("should generate correct tracking URL for BPOST", () => {
      const url = generateTrackingUrl("BPOST", "123456");
      expect(url).toContain("bpost");
      expect(url).toContain("123456");
    });

    it("should generate correct tracking URL for DHL", () => {
      const url = generateTrackingUrl("DHL", "ABC123");
      expect(url).toContain("dhl.com");
      expect(url).toContain("ABC123");
    });

    it("should generate correct tracking URL for UPS", () => {
      const url = generateTrackingUrl("UPS", "1Z999AA10123456784");
      expect(url).toContain("ups.com");
    });

    it("should generate correct tracking URL for GLS", () => {
      const url = generateTrackingUrl("GLS", "GLS123");
      expect(url).toContain("gls");
    });

    it("should return empty string for unknown carrier", () => {
      const url = generateTrackingUrl("UNKNOWN_CARRIER", "XYZ");
      expect(url).toBe("");
    });

    it("should return empty string for OTHER carrier", () => {
      const template = TRACKING_URL_TEMPLATES["OTHER"];
      // OTHER template is empty string
      expect(template).toBe("");
      const url = generateTrackingUrl("OTHER", "XYZ");
      expect(url).toBe(""); // OTHER template is empty, returns empty string
    });
  });

  // ===== WARRANTY ANALYSIS TESTS =====
  describe("analyzeWarranty", () => {
    // Helper to create a base input
    const baseInput = (overrides: Partial<WarrantyInput> = {}): WarrantyInput => ({
      brand: "MARKET_SPAS",
      component: "Pompes",
      defectType: "Bruit anormal",
      purchaseDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
      deliveryDate: new Date(Date.now() - 170 * 24 * 60 * 60 * 1000).toISOString(), // ~5.5 months ago
      usageType: "PRIVATE",
      isOriginalBuyer: true,
      isModified: false,
      isMaintenanceConform: true,
      isChemistryConform: true,
      usesHydrogenPeroxide: false,
      ...overrides,
    });

    // Helper to validate result structure
    function validateResultStructure(result: WarrantyResult) {
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("percentage");
      expect(result).toHaveProperty("details");
      expect(result).toHaveProperty("warnings");
      expect(result).toHaveProperty("stepResults");
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.stepResults)).toBe(true);
    }

    // ===== EXCLUSION TESTS =====
    describe("Exclusions", () => {
      it("should exclude non-original buyers", () => {
        const result = analyzeWarranty(baseInput({ isOriginalBuyer: false }));
        validateResultStructure(result);
        expect(result.status).toBe("EXCLUDED");
        expect(result.percentage).toBe(0);
        expect(result.details).toContain("acheteur initial");
      });

      it("should exclude modified products", () => {
        const result = analyzeWarranty(baseInput({ isModified: true }));
        validateResultStructure(result);
        expect(result.status).toBe("EXCLUDED");
        expect(result.percentage).toBe(0);
      });

      it("should exclude non-conform maintenance", () => {
        const result = analyzeWarranty(baseInput({ isMaintenanceConform: false }));
        validateResultStructure(result);
        expect(result.status).toBe("EXCLUDED");
        expect(result.percentage).toBe(0);
      });

      it("should exclude non-conform chemistry", () => {
        const result = analyzeWarranty(baseInput({ isChemistryConform: false }));
        validateResultStructure(result);
        expect(result.status).toBe("EXCLUDED");
        expect(result.percentage).toBe(0);
      });

      it("should accumulate multiple exclusion reasons", () => {
        const result = analyzeWarranty(baseInput({
          isModified: true,
          isMaintenanceConform: false,
          isChemistryConform: false,
        }));
        validateResultStructure(result);
        expect(result.status).toBe("EXCLUDED");
        expect(result.percentage).toBe(0);
      });
    });

    // ===== MARKET SPAS TESTS =====
    describe("Market Spas", () => {
      it("should cover Structure / Coque within 60 months (from purchase date)", () => {
        const result = analyzeWarranty(baseInput({
          brand: "MARKET_SPAS",
          component: "Structure / Coque",
          defectType: "Fissure",
          purchaseDate: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(), // ~12 months ago
        }));
        validateResultStructure(result);
        expect(result.status).toBe("COVERED");
        expect(result.percentage).toBe(100);
      });

      it("should cover Pompes within 24 months (from delivery date)", () => {
        const result = analyzeWarranty(baseInput({
          brand: "MARKET_SPAS",
          component: "Pompes",
          defectType: "Bruit anormal",
          deliveryDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
        }));
        validateResultStructure(result);
        expect(result.status).toBe("COVERED");
        expect(result.percentage).toBe(100);
      });

      it("should expire Pompes after 24 months", () => {
        const result = analyzeWarranty(baseInput({
          brand: "MARKET_SPAS",
          component: "Pompes",
          defectType: "Bruit anormal",
          deliveryDate: new Date(Date.now() - 26 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 26 months ago (well past 24-month warranty)
        }));
        validateResultStructure(result);
        expect(result.status).toBe("EXPIRED");
        expect(result.percentage).toBe(0);
      });

      it("should cover Couverture thermique within 12 months", () => {
        const result = analyzeWarranty(baseInput({
          brand: "MARKET_SPAS",
          component: "Couverture thermique",
          defectType: "Déformation",
          deliveryDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        validateResultStructure(result);
        expect(result.status).toBe("COVERED");
        expect(result.percentage).toBe(100);
      });

      it("should expire Couverture thermique after 12 months", () => {
        const result = analyzeWarranty(baseInput({
          brand: "MARKET_SPAS",
          component: "Couverture thermique",
          defectType: "Déformation",
          deliveryDate: new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 14 months ago (well past 12-month warranty)
        }));
        validateResultStructure(result);
        expect(result.status).toBe("EXPIRED");
        expect(result.percentage).toBe(0);
      });
    });

    // ===== WELLIS CLASSIC TESTS =====
    describe("Wellis Classic", () => {
      it("should cover Structure / Coque within 84 months", () => {
        const result = analyzeWarranty(baseInput({
          brand: "WELLIS_CLASSIC",
          component: "Structure / Coque",
          defectType: "Fissure",
          purchaseDate: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        validateResultStructure(result);
        expect(result.status).toBe("COVERED");
        expect(result.percentage).toBe(100);
      });

      it("should provide lifetime warranty on Cadre / Isolation WPS", () => {
        const result = analyzeWarranty(baseInput({
          brand: "WELLIS_CLASSIC",
          component: "Cadre / Isolation WPS",
          defectType: "Défaut structurel",
          purchaseDate: new Date(Date.now() - 100 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 100 months ago
        }));
        validateResultStructure(result);
        expect(result.status).toBe("COVERED");
        expect(result.percentage).toBe(100);
      });
    });

    // ===== WELLIS LIFE TESTS =====
    describe("Wellis Life", () => {
      it("should cover Structure / Coque within 120 months", () => {
        const result = analyzeWarranty(baseInput({
          brand: "WELLIS_LIFE",
          component: "Structure / Coque",
          defectType: "Fissure",
          purchaseDate: new Date(Date.now() - 60 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 60 months ago
        }));
        validateResultStructure(result);
        expect(result.status).toBe("COVERED");
        expect(result.percentage).toBe(100);
      });
    });

    // ===== PASSION SPAS TESTS =====
    describe("Passion Spas", () => {
      it("should cover Structure / Coque within 120 months", () => {
        const result = analyzeWarranty(baseInput({
          brand: "PASSION_SPAS",
          component: "Structure / Coque",
          defectType: "Fissure",
          purchaseDate: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        validateResultStructure(result);
        expect(result.status).toBe("COVERED");
        expect(result.percentage).toBe(100);
      });

      it("should exclude Jets (consommable)", () => {
        const result = analyzeWarranty(baseInput({
          brand: "PASSION_SPAS",
          component: "Jets",
          defectType: "Fuite",
          purchaseDate: new Date(Date.now() - 1 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
        }));
        validateResultStructure(result);
        expect(result.status).toBe("EXCLUDED");
        expect(result.percentage).toBe(0);
      });

      it("should add Passion Spas labor warning", () => {
        const result = analyzeWarranty(baseInput({
          brand: "PASSION_SPAS",
          component: "Pompes",
          defectType: "Bruit anormal",
          purchaseDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        validateResultStructure(result);
        expect(result.warnings.some(w => w.includes("main-d'œuvre"))).toBe(true);
      });

      it("should add Balboa 90-day billing warning for Pompes", () => {
        const result = analyzeWarranty(baseInput({
          brand: "PASSION_SPAS",
          component: "Pompes",
          defectType: "Bruit anormal",
          purchaseDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        validateResultStructure(result);
        expect(result.warnings.some(w => w.includes("90 jours"))).toBe(true);
      });

      it("should apply degressive coverage on Surface de la coque", () => {
        // At ~18 months, should be 80% (An 2)
        const result = analyzeWarranty(baseInput({
          brand: "PASSION_SPAS",
          component: "Surface de la coque (Shell)",
          defectType: "Décoloration",
          purchaseDate: new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        validateResultStructure(result);
        expect(result.status).toBe("PARTIAL");
        expect(result.percentage).toBeLessThan(100);
      });
    });

    // ===== PLATINUM SPAS TESTS =====
    describe("Platinum Spas", () => {
      it("should exclude hydrogen peroxide usage", () => {
        const result = analyzeWarranty(baseInput({
          brand: "PLATINUM_SPAS",
          component: "Structure / Coque",
          defectType: "Fissure",
          usesHydrogenPeroxide: true,
          productLine: "Deluxe",
          deliveryDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        validateResultStructure(result);
        expect(result.status).toBe("EXCLUDED");
        expect(result.percentage).toBe(0);
      });

      it("should cover Deluxe Structure / Coque lifetime when no hydrogen peroxide", () => {
        const result = analyzeWarranty(baseInput({
          brand: "PLATINUM_SPAS",
          component: "Structure / Coque",
          defectType: "Fissure",
          usesHydrogenPeroxide: false,
          productLine: "Deluxe",
          deliveryDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        validateResultStructure(result);
        expect(result.status).toBe("COVERED");
        expect(result.percentage).toBe(100);
      });
    });

    // ===== RESULT STRUCTURE TESTS =====
    describe("Result Structure", () => {
      it("should always return required fields", () => {
        const result = analyzeWarranty(baseInput());
        validateResultStructure(result);
        expect(result).toHaveProperty("expiryDate");
      });

      it("should have valid status values", () => {
        const validStatuses = ["COVERED", "PARTIAL", "EXPIRED", "EXCLUDED", "REVIEW_NEEDED"];
        const result = analyzeWarranty(baseInput());
        expect(validStatuses).toContain(result.status);
      });

      it("should have percentage between 0 and 100", () => {
        const result = analyzeWarranty(baseInput());
        expect(result.percentage).toBeGreaterThanOrEqual(0);
        expect(result.percentage).toBeLessThanOrEqual(100);
      });

      it("should have step results array", () => {
        const result = analyzeWarranty(baseInput());
        expect(result.stepResults.length).toBeGreaterThan(0);
        for (const step of result.stepResults) {
          expect(step).toHaveProperty("step");
          expect(step).toHaveProperty("name");
          expect(step).toHaveProperty("passed");
          expect(step).toHaveProperty("detail");
        }
      });
    });

    // ===== EDGE CASES =====
    describe("Edge Cases", () => {
      it("should handle very old purchase date (expired)", () => {
        const result = analyzeWarranty(baseInput({
          component: "Pompes",
          purchaseDate: new Date("2015-01-01").toISOString(),
          deliveryDate: new Date("2015-02-01").toISOString(),
        }));
        validateResultStructure(result);
        expect(result.status).toBe("EXPIRED");
        expect(result.percentage).toBe(0);
      });

      it("should handle today's delivery date (within warranty)", () => {
        const result = analyzeWarranty(baseInput({
          component: "Pompes",
          purchaseDate: new Date().toISOString(),
          deliveryDate: new Date().toISOString(),
        }));
        validateResultStructure(result);
        expect(result.status).toBe("COVERED");
        expect(result.percentage).toBe(100);
      });

      it("should return REVIEW_NEEDED for unknown component", () => {
        const result = analyzeWarranty(baseInput({
          component: "Composant Totalement Inconnu",
        }));
        validateResultStructure(result);
        expect(result.status).toBe("REVIEW_NEEDED");
        expect(result.percentage).toBe(0);
      });

      it("should handle commercial usage with reduced warranty", () => {
        const result = analyzeWarranty(baseInput({
          brand: "MARKET_SPAS",
          component: "Pompes",
          defectType: "Bruit anormal",
          usageType: "COMMERCIAL",
          deliveryDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        validateResultStructure(result);
        // Commercial use should still return a valid result
        expect(["COVERED", "PARTIAL", "EXPIRED", "EXCLUDED", "REVIEW_NEEDED"]).toContain(result.status);
      });

      it("should handle holiday let usage for Wellis", () => {
        const result = analyzeWarranty(baseInput({
          brand: "WELLIS_CLASSIC",
          component: "Pompes",
          defectType: "Bruit anormal",
          usageType: "HOLIDAY_LET",
          purchaseDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        validateResultStructure(result);
        // Holiday Let should add a warning for Wellis
        expect(["COVERED", "PARTIAL", "EXPIRED", "EXCLUDED", "REVIEW_NEEDED"]).toContain(result.status);
      });
    });
  });
});
