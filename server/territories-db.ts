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
 * Find region by postal code
 */
export async function findRegionByPostalCode(postalCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Normalize postal code (remove spaces, uppercase)
  const normalized = postalCode.replace(/\s/g, "").toUpperCase();

  const result = await db
    .select({
      regionId: regions.id,
      regionName: regions.name,
      regionCode: regions.code,
      countryId: countries.id,
      countryCode: countries.code,
      countryName: countries.name,
    })
    .from(postalCodeRanges)
    .innerJoin(regions, eq(regions.id, postalCodeRanges.regionId))
    .innerJoin(countries, eq(countries.id, regions.countryId))
    .where(
      and(
        sql`${normalized} >= ${postalCodeRanges.startCode}`,
        sql`${normalized} <= ${postalCodeRanges.endCode}`
      )
    )
    .limit(1);

  return result[0] || null;
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
      priority: partnerTerritories.priority,
      isExclusive: partnerTerritories.isExclusive,
      assignedAt: partnerTerritories.assignedAt,
      notes: partnerTerritories.notes,
    })
    .from(partnerTerritories)
    .innerJoin(regions, eq(regions.id, partnerTerritories.regionId))
    .innerJoin(countries, eq(countries.id, regions.countryId))
    .where(eq(partnerTerritories.partnerId, partnerId))
    .orderBy(desc(partnerTerritories.priority));
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
      priority: partnerTerritories.priority,
      isExclusive: partnerTerritories.isExclusive,
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
  priority: number = 1,
  isExclusive: boolean = false,
  assignedBy: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(partnerTerritories).values({
    partnerId,
    regionId,
    priority,
    isExclusive,
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
 * Update territory priority
 */
export async function updateTerritoryPriority(territoryId: number, priority: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(partnerTerritories)
    .set({ priority })
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
      priority: partnerTerritories.priority,
      isExclusive: partnerTerritories.isExclusive,
    })
    .from(partnerTerritories)
    .where(eq(partnerTerritories.regionId, regionId))
    .orderBy(desc(partnerTerritories.priority));
}

/**
 * Find best partner for a postal code
 */
export async function findBestPartnerForPostalCode(postalCode: string) {
  // Find region
  const region = await findRegionByPostalCode(postalCode);
  if (!region) {
    return null;
  }

  // Find partners covering this region
  const partners = await findPartnersByRegion(region.regionId);
  if (partners.length === 0) {
    return null;
  }

  // Return highest priority partner
  return {
    partnerId: partners[0].partnerId,
    partnerName: partners[0].partnerName,
    region: region.regionName,
    country: region.countryName,
  };
}
