import { describe, expect, it, beforeAll } from "vitest";
import {
  getDiscountForPartnerLevel,
  getShippingConfig,
  calculateShippingCost,
  getTaxConfig,
  resolvePartnerDiscount,
  upsertSystemSetting,
  getSystemSetting,
} from "./db";

// ─── Test: getDiscountForPartnerLevel ──────────────────────────────────────

describe("getDiscountForPartnerLevel", () => {
  it("returns 0 for BRONZE by default", async () => {
    const discount = await getDiscountForPartnerLevel("BRONZE");
    expect(discount).toBe(0);
  });

  it("returns 5 for SILVER by default", async () => {
    const discount = await getDiscountForPartnerLevel("SILVER");
    expect(discount).toBe(5);
  });

  it("returns 10 for GOLD by default", async () => {
    const discount = await getDiscountForPartnerLevel("GOLD");
    expect(discount).toBe(10);
  });

  it("returns 15 for PLATINUM by default", async () => {
    const discount = await getDiscountForPartnerLevel("PLATINUM");
    expect(discount).toBe(15);
  });

  it("returns 20 for VIP by default", async () => {
    const discount = await getDiscountForPartnerLevel("VIP");
    expect(discount).toBe(20);
  });

  it("returns 0 for unknown level", async () => {
    const discount = await getDiscountForPartnerLevel("UNKNOWN_LEVEL");
    expect(discount).toBe(0);
  });

  it("uses custom levels from system settings when available", async () => {
    // Save custom levels
    const customLevels = [
      { level: "BRONZE", discount: 2, minOrders: 0 },
      { level: "SILVER", discount: 8, minOrders: 3 },
      { level: "GOLD", discount: 15, minOrders: 10 },
    ];
    await upsertSystemSetting("partner_levels", JSON.stringify(customLevels));

    const bronzeDiscount = await getDiscountForPartnerLevel("BRONZE");
    expect(bronzeDiscount).toBe(2);

    const silverDiscount = await getDiscountForPartnerLevel("SILVER");
    expect(silverDiscount).toBe(8);

    const goldDiscount = await getDiscountForPartnerLevel("GOLD");
    expect(goldDiscount).toBe(15);

    // Restore default
    const defaultLevels = [
      { level: "BRONZE", discount: 0, minOrders: 0 },
      { level: "SILVER", discount: 5, minOrders: 5 },
      { level: "GOLD", discount: 10, minOrders: 15 },
      { level: "PLATINUM", discount: 15, minOrders: 30 },
      { level: "VIP", discount: 20, minOrders: 50 },
    ];
    await upsertSystemSetting("partner_levels", JSON.stringify(defaultLevels));
  });
});

// ─── Test: getShippingConfig ───────────────────────────────────────────────

describe("getShippingConfig", () => {
  it("returns default config when no setting exists", async () => {
    const config = await getShippingConfig();
    expect(config).toBeDefined();
    expect(typeof config.defaultShippingCost).toBe("number");
    expect(typeof config.expressShippingCost).toBe("number");
    expect(typeof config.estimatedDeliveryDays).toBe("number");
    expect(config.defaultShippingCost).toBeGreaterThan(0);
  });

  it("uses custom shipping config from system settings", async () => {
    const customShipping = {
      defaultShippingCost: 100,
      expressShippingCost: 250,
      estimatedDeliveryDays: 7,
    };
    await upsertSystemSetting("shipping", JSON.stringify(customShipping));

    const config = await getShippingConfig();
    expect(config.defaultShippingCost).toBe(100);
    expect(config.expressShippingCost).toBe(250);
    expect(config.estimatedDeliveryDays).toBe(7);

    // Restore default
    const defaultShipping = {
      defaultShippingCost: 150,
      expressShippingCost: 300,
      estimatedDeliveryDays: 14,
    };
    await upsertSystemSetting("shipping", JSON.stringify(defaultShipping));
  });
});

// ─── Test: calculateShippingCost ───────────────────────────────────────────

describe("calculateShippingCost", () => {
  it("always returns shipping cost regardless of subtotal (no free shipping)", async () => {
    const result = await calculateShippingCost(6000, "standard");
    expect(result.shippingHT).toBeGreaterThan(0);
  });

  it("returns standard shipping cost", async () => {
    const result = await calculateShippingCost(1000, "standard");
    expect(result.shippingHT).toBeGreaterThan(0);
  });

  it("returns express shipping cost (higher than standard)", async () => {
    const standardResult = await calculateShippingCost(1000, "standard");
    const expressResult = await calculateShippingCost(1000, "express");
    expect(expressResult.shippingHT).toBeGreaterThan(standardResult.shippingHT);
  });

  it("returns shipping cost even for very large orders", async () => {
    const result = await calculateShippingCost(100000, "standard");
    expect(result.shippingHT).toBeGreaterThan(0);
  });

  it("includes the config in the result", async () => {
    const result = await calculateShippingCost(1000, "standard");
    expect(result.config).toBeDefined();
    expect(result.config.defaultShippingCost).toBeGreaterThan(0);
  });
});

// ─── Test: getTaxConfig ──────────────────────────────────────────────────

describe("getTaxConfig", () => {
  it("returns default tax config (0% VAT) when no setting exists", async () => {
    const config = await getTaxConfig();
    expect(config).toBeDefined();
    expect(config.vatRate).toBe(0);
    expect(config.vatLabel).toBe("TVA");
  });

  it("uses custom tax config from system settings", async () => {
    const customTax = {
      vatRate: 21,
      vatLabel: "BTW",
    };
    await upsertSystemSetting("tax", JSON.stringify(customTax));

    const config = await getTaxConfig();
    expect(config.vatRate).toBe(21);
    expect(config.vatLabel).toBe("BTW");

    // Restore default (0%)
    const defaultTax = {
      vatRate: 0,
      vatLabel: "TVA",
    };
    await upsertSystemSetting("tax", JSON.stringify(defaultTax));
  });

  it("handles partial tax config (merges with defaults)", async () => {
    await upsertSystemSetting("tax", JSON.stringify({ vatRate: 10 }));

    const config = await getTaxConfig();
    expect(config.vatRate).toBe(10);
    expect(config.vatLabel).toBe("TVA"); // Default label preserved

    // Restore default
    await upsertSystemSetting("tax", JSON.stringify({ vatRate: 0, vatLabel: "TVA" }));
  });

  it("handles invalid JSON gracefully", async () => {
    await upsertSystemSetting("tax", "not-valid-json");

    const config = await getTaxConfig();
    expect(config.vatRate).toBe(0);
    expect(config.vatLabel).toBe("TVA");

    // Restore default
    await upsertSystemSetting("tax", JSON.stringify({ vatRate: 0, vatLabel: "TVA" }));
  });
});

// ─── Test: resolvePartnerDiscount ──────────────────────────────────────────

describe("resolvePartnerDiscount", () => {
  it("returns 0 discount for non-existent partner", async () => {
    const result = await resolvePartnerDiscount(999999);
    expect(result.discountPercent).toBe(0);
    expect(result.source).toBe("none");
  });

  it("returns a valid result structure", async () => {
    const result = await resolvePartnerDiscount(999999);
    expect(result).toHaveProperty("discountPercent");
    expect(result).toHaveProperty("partnerLevel");
    expect(result).toHaveProperty("source");
    expect(typeof result.discountPercent).toBe("number");
    expect(typeof result.partnerLevel).toBe("string");
    expect(["level", "custom", "none"]).toContain(result.source);
  });
});
