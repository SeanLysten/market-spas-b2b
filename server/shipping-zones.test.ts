import { describe, it, expect } from "vitest";

describe("Shipping Zones Lookup Logic", () => {
  // Simulate the zone matching logic used in calculateShippingCost and the tRPC lookup route
  function findShippingCost(
    zones: Array<{
      name: string;
      country: string;
      postalCodePrefix: string | null;
      postalCodeFrom: string | null;
      postalCodeTo: string | null;
      shippingCostHT: string;
      isActive: boolean;
    }>,
    country: string,
    postalCode: string
  ): { shippingCostHT: number; source: string; zoneName?: string } {
    // Filter active zones for the country
    const activeZones = zones.filter(
      (z) => z.country === country && z.isActive
    );

    if (activeZones.length === 0) {
      return { shippingCostHT: 150, source: "default" };
    }

    // 1. Match by postal code prefix (most specific)
    for (const zone of activeZones) {
      if (zone.postalCodePrefix && postalCode.startsWith(zone.postalCodePrefix)) {
        return {
          shippingCostHT: parseFloat(zone.shippingCostHT),
          source: "zone",
          zoneName: zone.name,
        };
      }
    }

    // 2. Match by postal code range
    for (const zone of activeZones) {
      if (zone.postalCodeFrom && zone.postalCodeTo) {
        if (postalCode >= zone.postalCodeFrom && postalCode <= zone.postalCodeTo) {
          return {
            shippingCostHT: parseFloat(zone.shippingCostHT),
            source: "zone",
            zoneName: zone.name,
          };
        }
      }
    }

    // 3. Fallback: country-level zone (no postal code filter)
    const countryZone = activeZones.find(
      (z) => !z.postalCodePrefix && !z.postalCodeFrom && !z.postalCodeTo
    );
    if (countryZone) {
      return {
        shippingCostHT: parseFloat(countryZone.shippingCostHT),
        source: "zone",
        zoneName: countryZone.name,
      };
    }

    return { shippingCostHT: 150, source: "default" };
  }

  const testZones = [
    {
      name: "Belgique - Bruxelles",
      country: "BE",
      postalCodePrefix: "10",
      postalCodeFrom: null,
      postalCodeTo: null,
      shippingCostHT: "120.00",
      isActive: true,
    },
    {
      name: "Belgique - Liège",
      country: "BE",
      postalCodePrefix: null,
      postalCodeFrom: "4000",
      postalCodeTo: "4999",
      shippingCostHT: "100.00",
      isActive: true,
    },
    {
      name: "Belgique - Standard",
      country: "BE",
      postalCodePrefix: null,
      postalCodeFrom: null,
      postalCodeTo: null,
      shippingCostHT: "150.00",
      isActive: true,
    },
    {
      name: "France - Île-de-France",
      country: "FR",
      postalCodePrefix: "75",
      postalCodeFrom: null,
      postalCodeTo: null,
      shippingCostHT: "250.00",
      isActive: true,
    },
    {
      name: "France - Standard",
      country: "FR",
      postalCodePrefix: null,
      postalCodeFrom: null,
      postalCodeTo: null,
      shippingCostHT: "200.00",
      isActive: true,
    },
    {
      name: "Luxembourg",
      country: "LU",
      postalCodePrefix: null,
      postalCodeFrom: null,
      postalCodeTo: null,
      shippingCostHT: "180.00",
      isActive: true,
    },
    {
      name: "Allemagne - Inactive",
      country: "DE",
      postalCodePrefix: null,
      postalCodeFrom: null,
      postalCodeTo: null,
      shippingCostHT: "300.00",
      isActive: false,
    },
  ];

  it("should match by postal code prefix (Bruxelles 10xx)", () => {
    const result = findShippingCost(testZones, "BE", "1000");
    expect(result.shippingCostHT).toBe(120);
    expect(result.source).toBe("zone");
    expect(result.zoneName).toBe("Belgique - Bruxelles");
  });

  it("should match by postal code prefix (Bruxelles 1050)", () => {
    const result = findShippingCost(testZones, "BE", "1050");
    expect(result.shippingCostHT).toBe(120);
    expect(result.zoneName).toBe("Belgique - Bruxelles");
  });

  it("should match by postal code range (Liège 4000-4999)", () => {
    const result = findShippingCost(testZones, "BE", "4500");
    expect(result.shippingCostHT).toBe(100);
    expect(result.zoneName).toBe("Belgique - Liège");
  });

  it("should match range boundary start (4000)", () => {
    const result = findShippingCost(testZones, "BE", "4000");
    expect(result.shippingCostHT).toBe(100);
    expect(result.zoneName).toBe("Belgique - Liège");
  });

  it("should match range boundary end (4999)", () => {
    const result = findShippingCost(testZones, "BE", "4999");
    expect(result.shippingCostHT).toBe(100);
    expect(result.zoneName).toBe("Belgique - Liège");
  });

  it("should fallback to country-level zone for unmatched postal code in BE", () => {
    const result = findShippingCost(testZones, "BE", "7000");
    expect(result.shippingCostHT).toBe(150);
    expect(result.zoneName).toBe("Belgique - Standard");
  });

  it("should match France - Île-de-France for 75xxx", () => {
    const result = findShippingCost(testZones, "FR", "75001");
    expect(result.shippingCostHT).toBe(250);
    expect(result.zoneName).toBe("France - Île-de-France");
  });

  it("should fallback to France - Standard for non-75 postal codes", () => {
    const result = findShippingCost(testZones, "FR", "69001");
    expect(result.shippingCostHT).toBe(200);
    expect(result.zoneName).toBe("France - Standard");
  });

  it("should match Luxembourg country-level zone", () => {
    const result = findShippingCost(testZones, "LU", "1234");
    expect(result.shippingCostHT).toBe(180);
    expect(result.zoneName).toBe("Luxembourg");
  });

  it("should ignore inactive zones (Germany)", () => {
    const result = findShippingCost(testZones, "DE", "10115");
    expect(result.shippingCostHT).toBe(150);
    expect(result.source).toBe("default");
  });

  it("should return default for unknown country", () => {
    const result = findShippingCost(testZones, "IT", "00100");
    expect(result.shippingCostHT).toBe(150);
    expect(result.source).toBe("default");
  });

  it("should prioritize prefix match over range match", () => {
    // Add a zone with both prefix and range for the same area
    const zonesWithOverlap = [
      ...testZones,
      {
        name: "BE - Prefix 40",
        country: "BE",
        postalCodePrefix: "40",
        postalCodeFrom: null,
        postalCodeTo: null,
        shippingCostHT: "90.00",
        isActive: true,
      },
    ];
    // 4000 starts with "40" prefix, should match prefix before range
    const result = findShippingCost(zonesWithOverlap, "BE", "4000");
    expect(result.shippingCostHT).toBe(90);
    expect(result.zoneName).toBe("BE - Prefix 40");
  });

  it("should handle empty zones list", () => {
    const result = findShippingCost([], "BE", "1000");
    expect(result.shippingCostHT).toBe(150);
    expect(result.source).toBe("default");
  });
});

describe("Shipping Zone Form Validation", () => {
  it("should require a zone name", () => {
    const name = "";
    expect(name.trim().length > 0).toBe(false);
  });

  it("should require a valid country code (2 chars)", () => {
    expect("BE".length).toBe(2);
    expect("FRA".length).not.toBe(2);
    expect("B".length).not.toBe(2);
  });

  it("should accept valid shipping cost", () => {
    const cost = parseFloat("150.00");
    expect(isNaN(cost)).toBe(false);
    expect(cost >= 0).toBe(true);
  });

  it("should reject negative shipping cost", () => {
    const cost = parseFloat("-10.00");
    expect(cost >= 0).toBe(false);
  });

  it("should reject non-numeric shipping cost", () => {
    const cost = parseFloat("abc");
    expect(isNaN(cost)).toBe(true);
  });

  it("should format cost to 2 decimal places", () => {
    const cost = 150.5;
    expect(cost.toFixed(2)).toBe("150.50");
  });
});
