import { describe, it, expect } from "vitest";

/**
 * Tests for the lead distribution / postal code matching logic.
 * 
 * These tests validate the pure logic of postal code disambiguation
 * without hitting the database. The actual DB functions are tested
 * via integration in the audit script.
 */

// Replicate the getExpectedPostalCodeLength function from territories-db.ts
function getExpectedPostalCodeLength(countryCode: string): number {
  switch (countryCode) {
    case "BE": return 4;
    case "NL": return 4;
    case "CH": return 4;
    case "FR": return 5;
    case "DE": return 5;
    case "ES": return 5;
    default: return 0;
  }
}

// Replicate the country hint normalization
function normalizeCountryHint(hint: string): string {
  const hintNormalized = hint.toUpperCase().trim();
  const countryMap: Record<string, string> = {
    "BELGIUM": "BE", "BELGIQUE": "BE", "BELGIË": "BE", "BE": "BE",
    "FRANCE": "FR", "FR": "FR",
    "GERMANY": "DE", "ALLEMAGNE": "DE", "DEUTSCHLAND": "DE", "DE": "DE",
    "NETHERLANDS": "NL", "PAYS-BAS": "NL", "NEDERLAND": "NL", "NL": "NL",
    "SWITZERLAND": "CH", "SUISSE": "CH", "SCHWEIZ": "CH", "CH": "CH",
    "SPAIN": "ES", "ESPAGNE": "ES", "ESPAÑA": "ES", "ES": "ES",
    "LUXEMBOURG": "LU", "LU": "LU",
  };
  return countryMap[hintNormalized] || hintNormalized;
}

// Simulate the postal code range matching with length filtering
interface MockRange {
  countryCode: string;
  regionName: string;
  startCode: string;
  endCode: string;
}

function findMatchingRanges(postalCode: string, ranges: MockRange[]): MockRange[] {
  const normalized = postalCode.replace(/\s/g, "").toUpperCase();
  return ranges.filter(r => normalized >= r.startCode && normalized <= r.endCode);
}

function filterByCodeLength(postalCode: string, matches: MockRange[]): MockRange[] {
  const normalized = postalCode.replace(/\s/g, "").toUpperCase();
  const numericPart = normalized.replace(/[A-Z]+$/, "");
  const codeLength = numericPart.length;
  
  return matches.filter(m => {
    const expectedLength = getExpectedPostalCodeLength(m.countryCode);
    if (expectedLength === 0) return true;
    const rangeLength = m.startCode.replace(/[A-Z]+$/, "").length;
    return codeLength === rangeLength;
  });
}

function filterByCountryHint(matches: MockRange[], countryHint?: string): MockRange[] {
  if (!countryHint) return matches;
  const code = normalizeCountryHint(countryHint);
  const filtered = matches.filter(m => m.countryCode === code);
  return filtered.length > 0 ? filtered : matches;
}

// Sample postal code ranges (mimicking real data)
const sampleRanges: MockRange[] = [
  // Belgium
  { countryCode: "BE", regionName: "Bruxelles-Capitale", startCode: "1000", endCode: "1299" },
  { countryCode: "BE", regionName: "Brabant wallon", startCode: "1300", endCode: "1499" },
  { countryCode: "BE", regionName: "Brabant flamand", startCode: "1500", endCode: "1999" },
  { countryCode: "BE", regionName: "Anvers", startCode: "2000", endCode: "2999" },
  { countryCode: "BE", regionName: "Liège", startCode: "4000", endCode: "4999" },
  { countryCode: "BE", regionName: "Namur", startCode: "5000", endCode: "5999" },
  { countryCode: "BE", regionName: "Hainaut", startCode: "6000", endCode: "6599" },
  { countryCode: "BE", regionName: "Hainaut", startCode: "7000", endCode: "7999" },
  { countryCode: "BE", regionName: "Flandre occidentale", startCode: "8000", endCode: "8999" },
  { countryCode: "BE", regionName: "Flandre orientale", startCode: "9000", endCode: "9999" },
  
  // France (5-digit codes)
  { countryCode: "FR", regionName: "Essonne", startCode: "91000", endCode: "91999" },
  { countryCode: "FR", regionName: "Bouches-du-Rhône", startCode: "13000", endCode: "13999" },
  { countryCode: "FR", regionName: "Nord", startCode: "59000", endCode: "59999" },
  { countryCode: "FR", regionName: "Paris", startCode: "75000", endCode: "75999" },
  { countryCode: "FR", regionName: "Aube", startCode: "10000", endCode: "10999" },
  
  // Netherlands (4-digit codes)
  { countryCode: "NL", regionName: "Noord-Holland", startCode: "1000", endCode: "1499" },
  { countryCode: "NL", regionName: "Zuid-Holland", startCode: "2500", endCode: "2999" },
  { countryCode: "NL", regionName: "Noord-Brabant", startCode: "4600", endCode: "5999" },
  
  // Switzerland (4-digit codes)
  { countryCode: "CH", regionName: "Vaud", startCode: "1000", endCode: "1099" },
  { countryCode: "CH", regionName: "Genève", startCode: "1200", endCode: "1299" },
  
  // Germany (5-digit codes)
  { countryCode: "DE", regionName: "Berlin", startCode: "10000", endCode: "14999" },
  { countryCode: "DE", regionName: "Bayern", startCode: "80000", endCode: "87999" },
];

describe("Postal code length filtering", () => {
  it("should correctly identify postal code lengths by country", () => {
    expect(getExpectedPostalCodeLength("BE")).toBe(4);
    expect(getExpectedPostalCodeLength("FR")).toBe(5);
    expect(getExpectedPostalCodeLength("DE")).toBe(5);
    expect(getExpectedPostalCodeLength("NL")).toBe(4);
    expect(getExpectedPostalCodeLength("CH")).toBe(4);
    expect(getExpectedPostalCodeLength("ES")).toBe(5);
  });

  it("should NOT match French 91350 to Belgian 9000-9999 range (the critical bug)", () => {
    const postalCode = "91350";
    const allMatches = findMatchingRanges(postalCode, sampleRanges);
    
    // Without filtering, 91350 matches BE 9000-9999 (string comparison bug)
    const beMatches = allMatches.filter(m => m.countryCode === "BE");
    expect(beMatches.length).toBeGreaterThan(0); // Confirms the bug exists in raw matching
    
    // With length filtering, 91350 (5 digits) should NOT match BE ranges (4 digits)
    const filtered = filterByCodeLength(postalCode, allMatches);
    const beFiltered = filtered.filter(m => m.countryCode === "BE");
    expect(beFiltered.length).toBe(0); // Bug is fixed!
    
    // Should match French Essonne instead
    const frFiltered = filtered.filter(m => m.countryCode === "FR");
    expect(frFiltered.length).toBe(1);
    expect(frFiltered[0].regionName).toBe("Essonne");
  });

  it("should correctly match Belgian 4-digit codes to Belgian ranges", () => {
    const postalCode = "1000";
    const allMatches = findMatchingRanges(postalCode, sampleRanges);
    const filtered = filterByCodeLength(postalCode, allMatches);
    
    // 1000 (4 digits) should match BE, NL, CH but NOT FR or DE
    const countryCodes = [...new Set(filtered.map(m => m.countryCode))];
    expect(countryCodes).toContain("BE");
    expect(countryCodes).toContain("NL");
    expect(countryCodes).toContain("CH");
    expect(countryCodes).not.toContain("FR");
    expect(countryCodes).not.toContain("DE");
  });

  it("should correctly match French 5-digit codes to French ranges", () => {
    const postalCode = "75001";
    const allMatches = findMatchingRanges(postalCode, sampleRanges);
    const filtered = filterByCodeLength(postalCode, allMatches);
    
    // 75001 (5 digits) should match FR Paris
    expect(filtered.length).toBe(1);
    expect(filtered[0].countryCode).toBe("FR");
    expect(filtered[0].regionName).toBe("Paris");
  });

  it("should correctly match German 5-digit codes to German ranges", () => {
    const postalCode = "10115";
    const allMatches = findMatchingRanges(postalCode, sampleRanges);
    const filtered = filterByCodeLength(postalCode, allMatches);
    
    // 10115 (5 digits) should match DE Berlin and FR Aube (both 5-digit)
    const countryCodes = [...new Set(filtered.map(m => m.countryCode))];
    expect(countryCodes).toContain("DE");
    // Should NOT contain BE, NL, CH (4-digit countries)
    expect(countryCodes).not.toContain("BE");
    expect(countryCodes).not.toContain("NL");
    expect(countryCodes).not.toContain("CH");
  });
});

describe("Country hint filtering", () => {
  it("should prioritize Belgium when country hint is 'Belgium'", () => {
    const postalCode = "1000";
    const allMatches = findMatchingRanges(postalCode, sampleRanges);
    const lengthFiltered = filterByCodeLength(postalCode, allMatches);
    const result = filterByCountryHint(lengthFiltered, "Belgium");
    
    expect(result.length).toBe(1);
    expect(result[0].countryCode).toBe("BE");
    expect(result[0].regionName).toBe("Bruxelles-Capitale");
  });

  it("should prioritize Netherlands when country hint is 'Pays-Bas'", () => {
    const postalCode = "1000";
    const allMatches = findMatchingRanges(postalCode, sampleRanges);
    const lengthFiltered = filterByCodeLength(postalCode, allMatches);
    const result = filterByCountryHint(lengthFiltered, "Pays-Bas");
    
    expect(result.length).toBe(1);
    expect(result[0].countryCode).toBe("NL");
    expect(result[0].regionName).toBe("Noord-Holland");
  });

  it("should prioritize Switzerland when country hint is 'CH'", () => {
    const postalCode = "1000";
    const allMatches = findMatchingRanges(postalCode, sampleRanges);
    const lengthFiltered = filterByCodeLength(postalCode, allMatches);
    const result = filterByCountryHint(lengthFiltered, "CH");
    
    expect(result.length).toBe(1);
    expect(result[0].countryCode).toBe("CH");
    expect(result[0].regionName).toBe("Vaud");
  });

  it("should normalize country names correctly", () => {
    expect(normalizeCountryHint("Belgium")).toBe("BE");
    expect(normalizeCountryHint("Belgique")).toBe("BE");
    expect(normalizeCountryHint("België")).toBe("BE");
    expect(normalizeCountryHint("France")).toBe("FR");
    expect(normalizeCountryHint("Allemagne")).toBe("DE");
    expect(normalizeCountryHint("Deutschland")).toBe("DE");
    expect(normalizeCountryHint("Pays-Bas")).toBe("NL");
    expect(normalizeCountryHint("Suisse")).toBe("CH");
    expect(normalizeCountryHint("Espagne")).toBe("ES");
  });

  it("should fallback to all matches if country hint doesn't match", () => {
    const postalCode = "1000";
    const allMatches = findMatchingRanges(postalCode, sampleRanges);
    const lengthFiltered = filterByCodeLength(postalCode, allMatches);
    const result = filterByCountryHint(lengthFiltered, "Japan");
    
    // Should return all length-filtered matches since Japan doesn't match
    expect(result.length).toBe(lengthFiltered.length);
  });
});

describe("Cross-country disambiguation", () => {
  it("should distinguish Belgian 4000 (Liège) from Swiss 4000 (Bâle)", () => {
    const postalCode = "4000";
    const allMatches = findMatchingRanges(postalCode, sampleRanges);
    const lengthFiltered = filterByCodeLength(postalCode, allMatches);
    
    // Both BE and CH have 4-digit codes, so both should match
    const countryCodes = [...new Set(lengthFiltered.map(m => m.countryCode))];
    expect(countryCodes).toContain("BE");
    
    // With Belgium hint, should resolve to Liège
    const beResult = filterByCountryHint(lengthFiltered, "BE");
    expect(beResult[0].regionName).toBe("Liège");
  });

  it("should distinguish French 59000 (Nord) from German codes", () => {
    const postalCode = "59000";
    const allMatches = findMatchingRanges(postalCode, sampleRanges);
    const filtered = filterByCodeLength(postalCode, allMatches);
    
    // Should match FR Nord
    const frMatches = filtered.filter(m => m.countryCode === "FR");
    expect(frMatches.length).toBe(1);
    expect(frMatches[0].regionName).toBe("Nord");
  });

  it("should handle the specific case of lead 30008 (Fleur, CP 91350) correctly", () => {
    // This was the bug: 91350 was assigned to Belgian Flandre orientale (9000-9999)
    const postalCode = "91350";
    const allMatches = findMatchingRanges(postalCode, sampleRanges);
    const filtered = filterByCodeLength(postalCode, allMatches);
    
    // After fix: should match FR Essonne, NOT BE Flandre orientale
    expect(filtered.length).toBe(1);
    expect(filtered[0].countryCode).toBe("FR");
    expect(filtered[0].regionName).toBe("Essonne");
  });
});

describe("Edge cases", () => {
  it("should handle postal codes with spaces", () => {
    const postalCode = "1 000";
    const normalized = postalCode.replace(/\s/g, "").toUpperCase();
    expect(normalized).toBe("1000");
    
    const allMatches = findMatchingRanges(normalized, sampleRanges);
    expect(allMatches.length).toBeGreaterThan(0);
  });

  it("should handle Dutch-style postal codes with letters", () => {
    const postalCode = "1000AB";
    const numericPart = postalCode.replace(/[A-Z]+$/, "");
    expect(numericPart).toBe("1000");
    expect(numericPart.length).toBe(4);
  });

  it("should handle empty postal code gracefully", () => {
    const allMatches = findMatchingRanges("", sampleRanges);
    // Empty string comparison - should not match meaningful ranges
    const filtered = filterByCodeLength("", allMatches);
    expect(filtered.length).toBe(0);
  });
});
