/**
 * Spa Models Database Functions
 * Gère les modèles de spa et leur liaison avec les pièces détachées
 */
import { eq, and, desc, asc, like, sql, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  spaModels,
  spaModelSpareParts,
  spareParts,
  spaModelLayers,
  spaModelZones,
  spaModelHotspots,
} from "../drizzle/schema";

// ============================================
// SPA MODELS - CRUD
// ============================================

export async function listSpaModels(filters?: {
  brand?: string;
  search?: string;
  isActive?: boolean;
}) {
  const db = await getDb();
  const conditions: any[] = [];

  if (filters?.brand) {
    conditions.push(eq(spaModels.brand, filters.brand as any));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(spaModels.isActive, filters.isActive));
  }
  if (filters?.search) {
    conditions.push(like(spaModels.name, `%${filters.search}%`));
  }

  const rows = await db
    .select()
    .from(spaModels)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(spaModels.brand), asc(spaModels.sortOrder), asc(spaModels.name));

  return rows;
}

export async function getSpaModelById(id: number) {
  const db = await getDb();
  const [model] = await db.select().from(spaModels).where(eq(spaModels.id, id));
  return model || null;
}

export async function createSpaModel(data: {
  name: string;
  brand: string;
  series?: string;
  imageUrl?: string;
  description?: string;
  seats?: number;
  dimensions?: string;
  sortOrder?: number;
}) {
  const db = await getDb();
  const [result] = await db.insert(spaModels).values(data as any);
  return { id: result.insertId };
}

export async function updateSpaModel(id: number, data: Record<string, any>) {
  const db = await getDb();
  await db.update(spaModels).set({ ...data, updatedAt: new Date() } as any).where(eq(spaModels.id, id));
  return { success: true };
}

export async function deleteSpaModel(id: number) {
  const db = await getDb();
  // Supprimer les liaisons pièces d'abord
  await db.delete(spaModelSpareParts).where(eq(spaModelSpareParts.spaModelId, id));
  // Supprimer le modèle
  await db.delete(spaModels).where(eq(spaModels.id, id));
  return { success: true };
}

// ============================================
// SPA MODEL ↔ SPARE PARTS LIAISON
// ============================================

export async function getModelParts(spaModelId: number) {
  const db = await getDb();
  const rows = await db
    .select({
      linkId: spaModelSpareParts.id,
      notes: spaModelSpareParts.notes,
      sparePartId: spareParts.id,
      reference: spareParts.reference,
      name: spareParts.name,
      description: spareParts.description,
      category: spareParts.category,
      priceHT: spareParts.priceHT,
      vatRate: spareParts.vatRate,
      stockQuantity: spareParts.stockQuantity,
      imageUrl: spareParts.imageUrl,
      isActive: spareParts.isActive,
    })
    .from(spaModelSpareParts)
    .innerJoin(spareParts, eq(spaModelSpareParts.sparePartId, spareParts.id))
    .where(eq(spaModelSpareParts.spaModelId, spaModelId))
    .orderBy(asc(spareParts.category), asc(spareParts.name));

  return rows;
}

export async function addPartToModel(data: {
  spaModelId: number;
  sparePartId: number;
  notes?: string;
}) {
  const db = await getDb();
  // Vérifier si la liaison existe déjà
  const [existing] = await db
    .select()
    .from(spaModelSpareParts)
    .where(
      and(
        eq(spaModelSpareParts.spaModelId, data.spaModelId),
        eq(spaModelSpareParts.sparePartId, data.sparePartId)
      )
    );
  if (existing) {
    return { id: existing.id, alreadyExists: true };
  }
  const [result] = await db.insert(spaModelSpareParts).values(data as any);
  return { id: result.insertId, alreadyExists: false };
}

export async function addMultiplePartsToModel(spaModelId: number, sparePartIds: number[]) {
  const db = await getDb();
  // Récupérer les liaisons existantes
  const existing = await db
    .select({ sparePartId: spaModelSpareParts.sparePartId })
    .from(spaModelSpareParts)
    .where(eq(spaModelSpareParts.spaModelId, spaModelId));

  const existingIds = new Set(existing.map((e) => e.sparePartId));
  const newIds = sparePartIds.filter((id) => !existingIds.has(id));

  if (newIds.length > 0) {
    await db.insert(spaModelSpareParts).values(
      newIds.map((sparePartId) => ({ spaModelId, sparePartId }))
    );
  }

  return { added: newIds.length, skipped: sparePartIds.length - newIds.length };
}

export async function removePartFromModel(linkId: number) {
  const db = await getDb();
  await db.delete(spaModelSpareParts).where(eq(spaModelSpareParts.id, linkId));
  return { success: true };
}

export async function removePartFromModelByIds(spaModelId: number, sparePartId: number) {
  const db = await getDb();
  await db
    .delete(spaModelSpareParts)
    .where(
      and(
        eq(spaModelSpareParts.spaModelId, spaModelId),
        eq(spaModelSpareParts.sparePartId, sparePartId)
      )
    );
  return { success: true };
}

// ============================================
// EXPLORATEUR VISUEL - LAYERS
// ============================================

export async function getModelLayers(spaModelId: number) {
  const db = await getDb();
  return db
    .select()
    .from(spaModelLayers)
    .where(eq(spaModelLayers.spaModelId, spaModelId))
    .orderBy(asc(spaModelLayers.sortOrder));
}

export async function createLayer(data: {
  spaModelId: number;
  layerType: string;
  label: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}) {
  const db = await getDb();
  const [result] = await db.insert(spaModelLayers).values(data as any);
  return { id: result.insertId };
}

export async function updateLayer(id: number, data: Record<string, any>) {
  const db = await getDb();
  await db.update(spaModelLayers).set({ ...data, updatedAt: new Date() } as any).where(eq(spaModelLayers.id, id));
  return { success: true };
}

export async function deleteLayer(id: number) {
  const db = await getDb();
  // Supprimer les hotspots des zones de cette couche
  const zones = await db.select({ id: spaModelZones.id }).from(spaModelZones).where(eq(spaModelZones.layerId, id));
  if (zones.length > 0) {
    const zoneIds = zones.map(z => z.id);
    await db.delete(spaModelHotspots).where(inArray(spaModelHotspots.zoneId, zoneIds));
  }
  // Supprimer les zones
  await db.delete(spaModelZones).where(eq(spaModelZones.layerId, id));
  // Supprimer la couche
  await db.delete(spaModelLayers).where(eq(spaModelLayers.id, id));
  return { success: true };
}

// ============================================
// EXPLORATEUR VISUEL - ZONES
// ============================================

export async function getLayerZones(layerId: number) {
  const db = await getDb();
  return db
    .select()
    .from(spaModelZones)
    .where(eq(spaModelZones.layerId, layerId))
    .orderBy(asc(spaModelZones.sortOrder));
}

export async function createZone(data: {
  layerId: number;
  name: string;
  label: string;
  description?: string;
  imageUrl?: string;
  posX?: string;
  posY?: string;
  width?: string;
  height?: string;
  sortOrder?: number;
}) {
  const db = await getDb();
  const [result] = await db.insert(spaModelZones).values(data as any);
  return { id: result.insertId };
}

export async function updateZone(id: number, data: Record<string, any>) {
  const db = await getDb();
  await db.update(spaModelZones).set({ ...data, updatedAt: new Date() } as any).where(eq(spaModelZones.id, id));
  return { success: true };
}

export async function deleteZone(id: number) {
  const db = await getDb();
  // Supprimer les hotspots de cette zone
  await db.delete(spaModelHotspots).where(eq(spaModelHotspots.zoneId, id));
  // Supprimer la zone
  await db.delete(spaModelZones).where(eq(spaModelZones.id, id));
  return { success: true };
}

// ============================================
// EXPLORATEUR VISUEL - HOTSPOTS
// ============================================

export async function getZoneHotspots(zoneId: number) {
  const db = await getDb();
  return db
    .select({
      id: spaModelHotspots.id,
      zoneId: spaModelHotspots.zoneId,
      sparePartId: spaModelHotspots.sparePartId,
      label: spaModelHotspots.label,
      posX: spaModelHotspots.posX,
      posY: spaModelHotspots.posY,
      sortOrder: spaModelHotspots.sortOrder,
      // Joindre les infos de la pièce
      partName: spareParts.name,
      partReference: spareParts.reference,
      partCategory: spareParts.category,
      partPriceHT: spareParts.priceHT,
      partImageUrl: spareParts.imageUrl,
      partDescription: spareParts.description,
    })
    .from(spaModelHotspots)
    .innerJoin(spareParts, eq(spaModelHotspots.sparePartId, spareParts.id))
    .where(eq(spaModelHotspots.zoneId, zoneId))
    .orderBy(asc(spaModelHotspots.sortOrder));
}

export async function createHotspot(data: {
  zoneId: number;
  sparePartId: number;
  label?: string;
  posX: string;
  posY: string;
  sortOrder?: number;
}) {
  const db = await getDb();
  const [result] = await db.insert(spaModelHotspots).values(data as any);
  return { id: result.insertId };
}

export async function updateHotspot(id: number, data: Record<string, any>) {
  const db = await getDb();
  await db.update(spaModelHotspots).set({ ...data, updatedAt: new Date() } as any).where(eq(spaModelHotspots.id, id));
  return { success: true };
}

export async function deleteHotspot(id: number) {
  const db = await getDb();
  await db.delete(spaModelHotspots).where(eq(spaModelHotspots.id, id));
  return { success: true };
}

// ============================================
// EXPLORATEUR VISUEL - LECTURE COMPLÈTE
// ============================================

export async function getExplorerData(spaModelId: number) {
  const db = await getDb();

  // Récupérer les couches
  const layers = await db
    .select()
    .from(spaModelLayers)
    .where(and(eq(spaModelLayers.spaModelId, spaModelId), eq(spaModelLayers.isActive, true)))
    .orderBy(asc(spaModelLayers.sortOrder));

  if (layers.length === 0) return null; // Pas configuré → fallback

  // Pour chaque couche, récupérer les zones et hotspots
  const result = await Promise.all(
    layers.map(async (layer) => {
      const zones = await db
        .select()
        .from(spaModelZones)
        .where(and(eq(spaModelZones.layerId, layer.id), eq(spaModelZones.isActive, true)))
        .orderBy(asc(spaModelZones.sortOrder));

      const zonesWithHotspots = await Promise.all(
        zones.map(async (zone) => {
          const hotspots = await db
            .select({
              id: spaModelHotspots.id,
              zoneId: spaModelHotspots.zoneId,
              sparePartId: spaModelHotspots.sparePartId,
              label: spaModelHotspots.label,
              posX: spaModelHotspots.posX,
              posY: spaModelHotspots.posY,
              sortOrder: spaModelHotspots.sortOrder,
              partName: spareParts.name,
              partReference: spareParts.reference,
              partCategory: spareParts.category,
              partPriceHT: spareParts.priceHT,
              partImageUrl: spareParts.imageUrl,
              partDescription: spareParts.description,
            })
            .from(spaModelHotspots)
            .innerJoin(spareParts, eq(spaModelHotspots.sparePartId, spareParts.id))
            .where(eq(spaModelHotspots.zoneId, zone.id))
            .orderBy(asc(spaModelHotspots.sortOrder));

          return { ...zone, hotspots };
        })
      );

      return { ...layer, zones: zonesWithHotspots };
    })
  );

  return result;
}

// ============================================
// USER-FACING: Modèles avec compteur de pièces
// ============================================

export async function listSpaModelsWithPartCount(brand?: string) {
  const db = await getDb();
  const conditions: any[] = [eq(spaModels.isActive, true)];
  if (brand) {
    conditions.push(eq(spaModels.brand, brand as any));
  }

  const rows = await db
    .select({
      id: spaModels.id,
      name: spaModels.name,
      brand: spaModels.brand,
      series: spaModels.series,
      imageUrl: spaModels.imageUrl,
      description: spaModels.description,
      seats: spaModels.seats,
      dimensions: spaModels.dimensions,
      sortOrder: spaModels.sortOrder,
      schemaImageUrl: spaModels.schemaImageUrl,
      partCount: sql<number>`COUNT(${spaModelSpareParts.id})`,
    })
    .from(spaModels)
    .leftJoin(spaModelSpareParts, eq(spaModels.id, spaModelSpareParts.spaModelId))
    .where(and(...conditions))
    .groupBy(spaModels.id, spaModels.name, spaModels.brand, spaModels.series, spaModels.imageUrl, spaModels.description, spaModels.seats, spaModels.dimensions, spaModels.sortOrder, spaModels.schemaImageUrl)
    .orderBy(asc(spaModels.brand), asc(spaModels.sortOrder), asc(spaModels.name));

  return rows;
}
