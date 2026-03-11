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
} from "../drizzle/schema";

// ============================================
// SPA MODELS - CRUD
// ============================================

export async function listSpaModels(filters?: {
  brand?: string;
  search?: string;
  isActive?: boolean;
}) {
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
  const [result] = await db.insert(spaModels).values(data as any);
  return { id: result.insertId };
}

export async function updateSpaModel(id: number, data: Record<string, any>) {
  const db = getDb();
  await db.update(spaModels).set({ ...data, updatedAt: new Date() } as any).where(eq(spaModels.id, id));
  return { success: true };
}

export async function deleteSpaModel(id: number) {
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
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
  const db = getDb();
  await db.delete(spaModelSpareParts).where(eq(spaModelSpareParts.id, linkId));
  return { success: true };
}

export async function removePartFromModelByIds(spaModelId: number, sparePartId: number) {
  const db = getDb();
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
// USER-FACING: Modèles avec compteur de pièces
// ============================================

export async function listSpaModelsWithPartCount(brand?: string) {
  const db = getDb();
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
      partCount: sql<number>`(SELECT COUNT(*) FROM spa_model_spare_parts WHERE spaModelId = ${spaModels.id})`,
    })
    .from(spaModels)
    .where(and(...conditions))
    .orderBy(asc(spaModels.brand), asc(spaModels.sortOrder), asc(spaModels.name));

  return rows;
}
