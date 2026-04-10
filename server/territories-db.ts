/**
 * Database functions for territory management
 */

import { getDb } from "./db";
import { countries, regions, postalCodeRanges, partnerTerritories } from "../drizzle/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

/**
 * Get all countries
 */
export async function getAllCountries() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(countries).where(eq(countries.isActive, true));
}

/**
 * Get regions by country
 */
export async function getRegionsByCountry(countryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(regions)
    .where(and(eq(regions.countryId, countryId), eq(regions.isActive, true)));
}

/**
 * Get all regions with country info
 */
export async function getAllRegionsWithCountry() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select({
      id: regions.id,
      code: regions.code,
      name: regions.name,
      nameEn: regions.nameEn,
      nameFr: regions.nameFr,
      nameNl: regions.nameNl,
      countryId: regions.countryId,
      countryCode: countries.code,
      countryName: countries.name,
    })
    .from(regions)
    .innerJoin(countries, eq(countries.id, regions.countryId))
    .where(and(eq(regions.isActive, true), eq(countries.isActive, true)));
}

/**
 * Get postal code ranges by region
 */
export async function getPostalCodeRangesByRegion(regionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(postalCodeRanges)
    .where(eq(postalCodeRanges.regionId, regionId));
}

/**
 * Detect country from postal code format.
 * Belgian codes: 4 digits (1000-9999)
 * French codes: 5 digits (01000-99999)
 * German codes: 5 digits (01000-99999)
 * Dutch codes: 4 digits + 2 letters (e.g. 1234AB) or just 4 digits
 * Swiss codes: 4 digits (1000-9999)
 * Spanish codes: 5 digits (01000-52999)
 * 
 * Strategy: match by postal code length and filter by countries that have
 * a partner with assigned territory (to prioritize relevant countries).
 */
function detectCountryFromPostalCode(postalCode: string): string | null {
  const normalized = postalCode.replace(/\s/g, "").toUpperCase();
  
  // Remove trailing letters for Dutch-style codes (e.g., "1234AB" -> "1234")
  const numericPart = normalized.replace(/[A-Z]+$/, "");
  
  if (numericPart.length === 4) {
    // Could be BE, NL, CH - Belgian codes are most common in our context
    // We'll return null and let the smart matching handle it
    return null;
  }
  
  if (numericPart.length === 5) {
    // Could be FR, DE, ES
    const num = parseInt(numericPart, 10);
    if (num >= 1000 && num <= 52999) {
      // Could be ES (01000-52999) or FR (01000-99999) or DE (01000-99999)
      return null;
    }
    return null;
  }
  
  return null;
}

/**
 * Get the expected postal code length for a country
 */
function getExpectedPostalCodeLength(countryCode: string): number {
  switch (countryCode) {
    case "BE": return 4;
    case "NL": return 4; // 4 digits + optional 2 letters
    case "CH": return 4;
    case "FR": return 5;
    case "DE": return 5;
    case "ES": return 5;
    default: return 0;
  }
}

/**
 * Find region by postal code - with smart country disambiguation.
 * 
 * The key fix: instead of simple string comparison which causes cross-country
 * false positives (e.g., French "91350" matching Belgian range "9000-9999"),
 * we now:
 * 1. Fetch ALL matching ranges across countries
 * 2. Filter by matching postal code length (4-digit codes only match 4-digit ranges)
 * 3. Prioritize countries that have partner territories assigned
 * 4. Accept optional country hint for explicit filtering
 */
export async function findRegionByPostalCode(postalCode: string, countryHint?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Normalize postal code (remove spaces, uppercase)
  const normalized = postalCode.replace(/\s/g, "").toUpperCase();
  // Extract numeric part (for NL codes like "1234AB")
  const numericPart = normalized.replace(/[A-Z]+$/, "");
  const codeLength = numericPart.length;

  // Fetch ALL matching ranges (not just LIMIT 1)
  const allMatches = await db
    .select({
      regionId: regions.id,
      regionName: regions.name,
      regionCode: regions.code,
      countryId: countries.id,
      countryCode: countries.code,
      countryName: countries.name,
      startCode: postalCodeRanges.startCode,
      endCode: postalCodeRanges.endCode,
    })
    .from(postalCodeRanges)
    .innerJoin(regions, eq(regions.id, postalCodeRanges.regionId))
    .innerJoin(countries, eq(countries.id, regions.countryId))
    .where(
      and(
        sql`${normalized} >= ${postalCodeRanges.startCode}`,
        sql`${normalized} <= ${postalCodeRanges.endCode}`
      )
    );

  if (allMatches.length === 0) {
    return null;
  }

  // If country hint is provided, filter by it first
  if (countryHint) {
    const hintNormalized = countryHint.toUpperCase().trim();
    // Support country names and codes
    const countryMap: Record<string, string> = {
      "BELGIUM": "BE", "BELGIQUE": "BE", "BELGIË": "BE", "BE": "BE",
      "FRANCE": "FR", "FR": "FR",
      "GERMANY": "DE", "ALLEMAGNE": "DE", "DEUTSCHLAND": "DE", "DE": "DE",
      "NETHERLANDS": "NL", "PAYS-BAS": "NL", "NEDERLAND": "NL", "NL": "NL",
      "SWITZERLAND": "CH", "SUISSE": "CH", "SCHWEIZ": "CH", "CH": "CH",
      "SPAIN": "ES", "ESPAGNE": "ES", "ESPAÑA": "ES", "ES": "ES",
      "LUXEMBOURG": "LU", "LU": "LU",
    };
    const countryCode = countryMap[hintNormalized] || hintNormalized;
    const hintMatches = allMatches.filter(m => m.countryCode === countryCode);
    if (hintMatches.length > 0) {
      return hintMatches[0];
    }
  }

  // Filter by postal code length matching the country's expected format
  // This prevents French 5-digit codes from matching Belgian 4-digit ranges
  const lengthFilteredMatches = allMatches.filter(m => {
    const expectedLength = getExpectedPostalCodeLength(m.countryCode);
    if (expectedLength === 0) return true; // Unknown country, keep it
    
    // The range's start code length tells us what format this country uses
    const rangeLength = m.startCode.replace(/[A-Z]+$/, "").length;
    return codeLength === rangeLength;
  });

  if (lengthFilteredMatches.length === 0) {
    // Fallback: no length match, return first result
    return allMatches[0];
  }

  if (lengthFilteredMatches.length === 1) {
    return lengthFilteredMatches[0];
  }

  // Multiple countries with same postal code length (e.g., BE and NL both 4 digits, or FR and DE both 5 digits)
  // Prioritize countries that have partner territories assigned
  const countriesWithTerritories = await db
    .select({
      countryCode: countries.code,
    })
    .from(partnerTerritories)
    .innerJoin(regions, eq(regions.id, partnerTerritories.regionId))
    .innerJoin(countries, eq(countries.id, regions.countryId))
    .groupBy(countries.code);

  const activeCountryCodes = new Set(countriesWithTerritories.map(c => c.countryCode));

  // Sort: countries with active territories first
  const sorted = lengthFilteredMatches.sort((a, b) => {
    const aHasTerritory = activeCountryCodes.has(a.countryCode) ? 0 : 1;
    const bHasTerritory = activeCountryCodes.has(b.countryCode) ? 0 : 1;
    return aHasTerritory - bHasTerritory;
  });

  return sorted[0];
}

/**
 * Get partner territories
 */
export async function getPartnerTerritories(partnerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select({
      id: partnerTerritories.id,
      partnerId: partnerTerritories.partnerId,
      regionId: partnerTerritories.regionId,
      regionName: regions.name,
      regionCode: regions.code,
      countryCode: countries.code,
      countryName: countries.name,
      assignedAt: partnerTerritories.assignedAt,
      notes: partnerTerritories.notes,
    })
    .from(partnerTerritories)
    .innerJoin(regions, eq(regions.id, partnerTerritories.regionId))
    .innerJoin(countries, eq(countries.id, regions.countryId))
    .where(eq(partnerTerritories.partnerId, partnerId))
    .orderBy(desc(partnerTerritories.assignedAt));
}

/**
 * Get all partner territories (admin view)
 */
export async function getAllPartnerTerritories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select({
      id: partnerTerritories.id,
      partnerId: partnerTerritories.partnerId,
      partnerName: sql<string>`(SELECT companyName FROM partners WHERE id = ${partnerTerritories.partnerId})`,
      regionId: partnerTerritories.regionId,
      regionName: regions.name,
      regionCode: regions.code,
      countryCode: countries.code,
      countryName: countries.name,
      assignedAt: partnerTerritories.assignedAt,
    })
    .from(partnerTerritories)
    .innerJoin(regions, eq(regions.id, partnerTerritories.regionId))
    .innerJoin(countries, eq(countries.id, regions.countryId))
    .orderBy(desc(partnerTerritories.assignedAt));
}

/**
 * Assign territory to partner
 */
export async function assignTerritoryToPartner(
  partnerId: number,
  regionId: number,
  assignedBy: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(partnerTerritories).values({
    partnerId,
    regionId,
    assignedBy,
    notes,
  });

  return { id: result.insertId };
}

/**
 * Remove territory from partner
 */
export async function removeTerritoryFromPartner(territoryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(partnerTerritories).where(eq(partnerTerritories.id, territoryId));
}

/**
 * Update territory notes
 */
export async function updateTerritoryNotes(territoryId: number, notes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(partnerTerritories)
    .set({ notes })
    .where(eq(partnerTerritories.id, territoryId));
}

/**
 * Find partners covering a region
 */
export async function findPartnersByRegion(regionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select({
      partnerId: partnerTerritories.partnerId,
      partnerName: sql<string>`(SELECT companyName FROM partners WHERE id = ${partnerTerritories.partnerId})`,
    })
    .from(partnerTerritories)
    .where(eq(partnerTerritories.regionId, regionId))
    .limit(1);
}

/**
 * Find best partner for a postal code.
 * 
 * Routing priority:
 * 1. Resolve country (via phone prefix > country field) — done by callers
 * 2. Find postal code range filtered by country
 * 3. Find partner who owns that territory
 * 4. FALLBACK: if country hint is provided but no CP range matches,
 *    find any partner who covers ANY region in that country
 */
export async function findBestPartnerForPostalCode(postalCode: string, countryHint?: string) {
  // Find region (with smart country disambiguation)
  const region = await findRegionByPostalCode(postalCode, countryHint);
  
  if (region) {
    // Found a region matching the postal code — find partner covering it
    const partners = await findPartnersByRegion(region.regionId);
    if (partners.length > 0) {
      return {
        partnerId: partners[0].partnerId,
        partnerName: partners[0].partnerName,
        region: region.regionName,
        country: region.countryName,
      };
    }
  }

  // FALLBACK: if we have a country hint but no CP match in that country,
  // find any partner who covers ANY region in that country.
  // This handles cases where postal code ranges are incomplete or missing.
  if (countryHint) {
    const countryPartner = await findPartnerByCountry(countryHint);
    if (countryPartner) {
      return countryPartner;
    }
  }

  return null;
}

/**
 * Find a partner who covers any region in a given country.
 * Used as fallback when no postal code range matches.
 */
async function findPartnerByCountry(countryHint: string) {
  const db = await getDb();
  if (!db) return null;

  // Normalize country hint to country code
  const hintNormalized = countryHint.toUpperCase().trim();
  const countryMap: Record<string, string> = {
    "BELGIUM": "BE", "BELGIQUE": "BE", "BELGI\u00CB": "BE", "BE": "BE",
    "FRANCE": "FR", "FR": "FR",
    "GERMANY": "DE", "ALLEMAGNE": "DE", "DEUTSCHLAND": "DE", "DE": "DE",
    "NETHERLANDS": "NL", "PAYS-BAS": "NL", "NEDERLAND": "NL", "NL": "NL",
    "SWITZERLAND": "CH", "SUISSE": "CH", "SCHWEIZ": "CH", "CH": "CH",
    "SPAIN": "ES", "ESPAGNE": "ES", "ESPA\u00D1A": "ES", "ES": "ES",
    "LUXEMBOURG": "LU", "LU": "LU",
    "ITALY": "IT", "ITALIE": "IT", "ITALIA": "IT", "IT": "IT",
    "PORTUGAL": "PT", "PT": "PT",
    "AUSTRIA": "AT", "AUTRICHE": "AT", "\u00D6STERREICH": "AT", "AT": "AT",
    "UNITED KINGDOM": "GB", "ROYAUME-UNI": "GB", "GB": "GB", "UK": "GB",
  };
  const countryCode = countryMap[hintNormalized] || hintNormalized;

  // Find any partner who has a territory in this country
  const results = await db
    .select({
      partnerId: partnerTerritories.partnerId,
      partnerName: sql<string>`(SELECT companyName FROM partners WHERE id = ${partnerTerritories.partnerId})`,
      regionName: regions.name,
      countryName: countries.name,
    })
    .from(partnerTerritories)
    .innerJoin(regions, eq(regions.id, partnerTerritories.regionId))
    .innerJoin(countries, eq(countries.id, regions.countryId))
    .where(eq(countries.code, countryCode))
    .limit(1);

  if (results.length === 0) return null;

  return {
    partnerId: results[0].partnerId,
    partnerName: results[0].partnerName,
    region: results[0].regionName,
    country: results[0].countryName,
  };
}
