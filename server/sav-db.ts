/**
 * SAV Database Functions - Fonctions de base de données pour le système SAV intelligent
 * Gère les tickets SAV, pièces détachées, règles de garantie et paiements
 */
import { eq, and, desc, asc, gte, lte, like, count, sql, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  afterSalesServices,
  afterSalesMedia,
  afterSalesNotes,
  afterSalesStatusHistory,
  warrantyRules,
  spareParts,
  sparePartsCompatibility,
  savSpareParts,
  partners,
  products,
  users,
} from "../drizzle/schema";

// ============================================
// TICKET SAV - CRUD
// ============================================

export async function createSavTicket(data: {
  partnerId: number;
  productId?: number;
  serialNumber: string;
  issueType: string;
  description: string;
  urgency?: string;
  // New fields
  brand?: string;
  productLine?: string;
  modelName?: string;
  component?: string;
  defectType?: string;
  purchaseDate?: string;
  deliveryDate?: string;
  usageType?: string;
  isOriginalBuyer?: boolean;
  isModified?: boolean;
  isMaintenanceConform?: boolean;
  isChemistryConform?: boolean;
  usesHydrogenPeroxide?: boolean;
  // Customer info
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  installationDate?: string;
  // Media
  media?: Array<{ url: string; key: string; type: "IMAGE" | "VIDEO"; description?: string }>;
  // Warranty analysis results
  warrantyStatus?: string;
  warrantyPercentage?: number;
  warrantyExpiryDate?: string;
  warrantyAnalysisDetails?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate unique ticket number: SAV-YYYYMM-XXXXX
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  const ticketNumber = `SAV-${yearMonth}-${random}`;

  const [result] = await db.insert(afterSalesServices).values({
    ticketNumber,
    partnerId: data.partnerId,
    productId: data.productId,
    serialNumber: data.serialNumber,
    issueType: data.issueType as any,
    description: data.description,
    urgency: (data.urgency || "NORMAL") as any,
    status: "NEW" as any,
    // Product identification
    brand: data.brand as any,
    productLine: data.productLine,
    modelName: data.modelName,
    component: data.component,
    defectType: data.defectType,
    // Dates
    purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
    deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
    // Usage
    usageType: (data.usageType || "PRIVATE") as any,
    isOriginalBuyer: data.isOriginalBuyer ?? true,
    isModified: data.isModified ?? false,
    isMaintenanceConform: data.isMaintenanceConform ?? true,
    isChemistryConform: data.isChemistryConform ?? true,
    usesHydrogenPeroxide: data.usesHydrogenPeroxide ?? false,
    // Warranty
    warrantyStatus: (data.warrantyStatus || "REVIEW_NEEDED") as any,
    warrantyPercentage: data.warrantyPercentage ?? 0,
    warrantyExpiryDate: data.warrantyExpiryDate ? new Date(data.warrantyExpiryDate) : undefined,
    warrantyAnalysisDetails: data.warrantyAnalysisDetails,
    // Customer
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    customerAddress: data.customerAddress,
    installationDate: data.installationDate ? new Date(data.installationDate) : undefined,
  });

  const serviceId = Number(result.insertId);

  // Create media entries
  if (data.media && data.media.length > 0) {
    await db.insert(afterSalesMedia).values(
      data.media.map((m) => ({
        serviceId,
        mediaUrl: m.url,
        mediaKey: m.key,
        mediaType: m.type,
        description: m.description,
      }))
    );
  }

  return { serviceId, ticketNumber };
}

export async function getSavTickets(filters?: {
  partnerId?: number;
  status?: string;
  urgency?: string;
  brand?: string;
  warrantyStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  customerName?: string;
  search?: string;
  orderBy?: string;
  orderDirection?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select({
      service: afterSalesServices,
      partner: partners,
      product: products,
    })
    .from(afterSalesServices)
    .leftJoin(partners, eq(afterSalesServices.partnerId, partners.id))
    .leftJoin(products, eq(afterSalesServices.productId, products.id));

  const conditions = [];
  if (filters?.partnerId) {
    conditions.push(eq(afterSalesServices.partnerId, filters.partnerId));
  }
  if (filters?.status) {
    conditions.push(eq(afterSalesServices.status, filters.status as any));
  }
  if (filters?.urgency) {
    conditions.push(eq(afterSalesServices.urgency, filters.urgency as any));
  }
  if (filters?.brand) {
    conditions.push(eq(afterSalesServices.brand, filters.brand as any));
  }
  if (filters?.warrantyStatus) {
    conditions.push(eq(afterSalesServices.warrantyStatus, filters.warrantyStatus as any));
  }
  if (filters?.dateFrom) {
    conditions.push(gte(afterSalesServices.createdAt, new Date(filters.dateFrom)));
  }
  if (filters?.dateTo) {
    const endDate = new Date(filters.dateTo);
    endDate.setHours(23, 59, 59, 999);
    conditions.push(lte(afterSalesServices.createdAt, endDate));
  }
  if (filters?.customerName) {
    conditions.push(like(afterSalesServices.customerName, `%${filters.customerName}%`));
  }
  if (filters?.search) {
    conditions.push(
      sql`(${afterSalesServices.ticketNumber} LIKE ${`%${filters.search}%`} OR ${afterSalesServices.customerName} LIKE ${`%${filters.search}%`} OR ${afterSalesServices.serialNumber} LIKE ${`%${filters.search}%`} OR ${afterSalesServices.modelName} LIKE ${`%${filters.search}%`})`
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  // Sorting
  if (filters?.orderBy && filters?.orderDirection) {
    const columnMap: Record<string, any> = {
      createdAt: afterSalesServices.createdAt,
      status: afterSalesServices.status,
      urgency: afterSalesServices.urgency,
      brand: afterSalesServices.brand,
      warrantyStatus: afterSalesServices.warrantyStatus,
    };
    const column = columnMap[filters.orderBy] || afterSalesServices.createdAt;
    query = (filters.orderDirection === "asc" ? query.orderBy(asc(column)) : query.orderBy(desc(column))) as any;
  } else {
    query = query.orderBy(desc(afterSalesServices.createdAt)) as any;
  }

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = (query as any).offset(filters.offset);
  }

  return await query;
}

export async function getSavTicketById(serviceId: number) {
  const db = await getDb();
  if (!db) return null;

  const [serviceData] = await db
    .select({
      service: afterSalesServices,
      partner: partners,
      product: products,
    })
    .from(afterSalesServices)
    .leftJoin(partners, eq(afterSalesServices.partnerId, partners.id))
    .leftJoin(products, eq(afterSalesServices.productId, products.id))
    .where(eq(afterSalesServices.id, serviceId));

  if (!serviceData) return null;

  // Get media
  const media = await db
    .select()
    .from(afterSalesMedia)
    .where(eq(afterSalesMedia.serviceId, serviceId));

  // Get notes with user info
  const notes = await db
    .select({
      note: afterSalesNotes,
      user: users,
    })
    .from(afterSalesNotes)
    .leftJoin(users, eq(afterSalesNotes.userId, users.id))
    .where(eq(afterSalesNotes.serviceId, serviceId))
    .orderBy(afterSalesNotes.createdAt);

  // Get linked spare parts
  const linkedParts = await db
    .select({
      savPart: savSpareParts,
      sparePart: spareParts,
    })
    .from(savSpareParts)
    .leftJoin(spareParts, eq(savSpareParts.sparePartId, spareParts.id))
    .where(eq(savSpareParts.serviceId, serviceId));

  // Get status history
  const history = await db
    .select({
      id: afterSalesStatusHistory.id,
      previousStatus: afterSalesStatusHistory.previousStatus,
      newStatus: afterSalesStatusHistory.newStatus,
      reason: afterSalesStatusHistory.reason,
      changedBy: afterSalesStatusHistory.changedBy,
      changedByName: users.name,
      createdAt: afterSalesStatusHistory.createdAt,
    })
    .from(afterSalesStatusHistory)
    .leftJoin(users, eq(afterSalesStatusHistory.changedBy, users.id))
    .where(eq(afterSalesStatusHistory.serviceId, serviceId))
    .orderBy(desc(afterSalesStatusHistory.createdAt));

  return {
    ...serviceData,
    media,
    notes,
    linkedParts,
    history,
  };
}

// ============================================
// TICKET SAV - UPDATE
// ============================================

export async function updateSavTicket(
  serviceId: number,
  updates: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Clean up date fields
  const cleanUpdates: Record<string, any> = { ...updates };
  const dateFields = ["purchaseDate", "deliveryDate", "installationDate", "warrantyExpiryDate"];
  for (const field of dateFields) {
    if (cleanUpdates[field]) {
      cleanUpdates[field] = new Date(cleanUpdates[field]);
    }
  }

  // Set timestamps based on status
  if (cleanUpdates.status === "RESOLVED") {
    cleanUpdates.resolvedAt = new Date();
  } else if (cleanUpdates.status === "CLOSED") {
    cleanUpdates.closedAt = new Date();
  } else if (cleanUpdates.status === "SHIPPED") {
    cleanUpdates.shippedAt = new Date();
  }

  cleanUpdates.updatedAt = new Date();

  await db
    .update(afterSalesServices)
    .set(cleanUpdates)
    .where(eq(afterSalesServices.id, serviceId));

  return true;
}

export async function updateSavWarrantyDecision(
  serviceId: number,
  warrantyStatus: string,
  warrantyPercentage: number,
  adminNotes: string,
  adminOverride: boolean = false
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(afterSalesServices)
    .set({
      warrantyStatus: warrantyStatus as any,
      warrantyPercentage,
      adminWarrantyOverride: adminOverride,
      adminWarrantyNotes: adminNotes,
      updatedAt: new Date(),
    })
    .where(eq(afterSalesServices.id, serviceId));

  return true;
}

export async function updateSavPayment(
  serviceId: number,
  data: {
    shippingCost?: string;
    totalAmount?: string;
    stripePaymentIntentId?: string;
    paidAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(afterSalesServices)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(afterSalesServices.id, serviceId));

  return true;
}

export async function updateSavTracking(
  serviceId: number,
  data: {
    trackingNumber: string;
    trackingCarrier?: string;
    trackingUrl?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(afterSalesServices)
    .set({
      trackingNumber: data.trackingNumber,
      trackingCarrier: data.trackingCarrier as any,
      trackingUrl: data.trackingUrl,
      shippedAt: new Date(),
      status: "SHIPPED" as any,
      updatedAt: new Date(),
    })
    .where(eq(afterSalesServices.id, serviceId));

  return true;
}

// ============================================
// SAV NOTES
// ============================================

export async function addSavNote(
  serviceId: number,
  userId: number,
  note: string,
  isInternal: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(afterSalesNotes).values({
    serviceId,
    userId,
    note,
    isInternal,
  });

  return true;
}

// ============================================
// SAV STATUS HISTORY
// ============================================

export async function addSavStatusHistory(
  serviceId: number,
  previousStatus: string | null,
  newStatus: string,
  changedBy: number,
  reason?: string
) {
  const db = await getDb();
  if (!db) return null;

  return await db.insert(afterSalesStatusHistory).values({
    serviceId,
    previousStatus: previousStatus as any,
    newStatus: newStatus as any,
    changedBy,
    reason,
  });
}

// ============================================
// SPARE PARTS - CRUD
// ============================================

export async function getSparePartsList(filters?: {
  category?: string;
  brand?: string;
  search?: string;
  isActive?: boolean;
  modelName?: string;
  component?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(spareParts);

  const conditions = [];
  if (filters?.category) {
    conditions.push(eq(spareParts.category, filters.category as any));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(spareParts.isActive, filters.isActive));
  }
  if (filters?.search) {
    conditions.push(
      sql`(${spareParts.name} LIKE ${`%${filters.search}%`} OR ${spareParts.reference} LIKE ${`%${filters.search}%`} OR ${spareParts.description} LIKE ${`%${filters.search}%`})`
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(spareParts.name) as any;

  const parts = await query;

  // If brand/model/component filters, get compatible parts
  if (filters?.brand || filters?.modelName || filters?.component) {
    const compatConditions = [];
    if (filters?.brand) {
      compatConditions.push(eq(sparePartsCompatibility.brand, filters.brand as any));
    }
    if (filters?.modelName) {
      compatConditions.push(eq(sparePartsCompatibility.modelName, filters.modelName));
    }
    if (filters?.component) {
      compatConditions.push(eq(sparePartsCompatibility.component, filters.component));
    }

    const compatParts = await db
      .select({ sparePartId: sparePartsCompatibility.sparePartId })
      .from(sparePartsCompatibility)
      .where(and(...compatConditions));

    const compatIds = compatParts.map((p) => p.sparePartId);
    if (compatIds.length > 0) {
      return parts.filter((p: any) => compatIds.includes(p.id));
    }
    return [];
  }

  return parts;
}

export async function getSparePartById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [part] = await db
    .select()
    .from(spareParts)
    .where(eq(spareParts.id, id));

  if (!part) return null;

  // Get compatibility info
  const compatibility = await db
    .select()
    .from(sparePartsCompatibility)
    .where(eq(sparePartsCompatibility.sparePartId, id));

  return { ...part, compatibility };
}

export async function createSparePart(data: {
  reference: string;
  name: string;
  description?: string;
  category: string;
  priceHT: string;
  vatRate?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  imageUrl?: string;
  weight?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(spareParts).values({
    reference: data.reference,
    name: data.name,
    description: data.description,
    category: data.category as any,
    priceHT: data.priceHT,
    vatRate: data.vatRate || "21",
    stockQuantity: data.stockQuantity ?? 0,
    lowStockThreshold: data.lowStockThreshold ?? 3,
    imageUrl: data.imageUrl,
    weight: data.weight,
  });

  return { id: Number(result.insertId) };
}

export async function updateSparePart(id: number, data: Record<string, any>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(spareParts).set(data).where(eq(spareParts.id, id));
  return true;
}

export async function deleteSparePart(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Soft delete
  await db.update(spareParts).set({ isActive: false }).where(eq(spareParts.id, id));
  return true;
}

// ============================================
// SPARE PARTS COMPATIBILITY
// ============================================

export async function addSparePartCompatibility(data: {
  sparePartId: number;
  brand: string;
  productLine?: string;
  modelName?: string;
  component: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(sparePartsCompatibility).values({
    sparePartId: data.sparePartId,
    brand: data.brand as any,
    productLine: data.productLine,
    modelName: data.modelName,
    component: data.component,
  });

  return { id: Number(result.insertId) };
}

export async function removeSparePartCompatibility(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(sparePartsCompatibility).where(eq(sparePartsCompatibility.id, id));
  return true;
}

export async function getCompatibleParts(brand: string, modelName?: string, component?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(sparePartsCompatibility.brand, brand as any)];
  if (modelName) {
    conditions.push(
      sql`(${sparePartsCompatibility.modelName} = ${modelName} OR ${sparePartsCompatibility.modelName} IS NULL)`
    );
  }
  if (component) {
    conditions.push(eq(sparePartsCompatibility.component, component));
  }

  const compatParts = await db
    .select({
      compatibility: sparePartsCompatibility,
      sparePart: spareParts,
    })
    .from(sparePartsCompatibility)
    .leftJoin(spareParts, eq(sparePartsCompatibility.sparePartId, spareParts.id))
    .where(and(...conditions));

  return compatParts.filter((p) => p.sparePart?.isActive);
}

// ============================================
// SAV SPARE PARTS (link parts to tickets)
// ============================================

export async function linkSparePartToSav(data: {
  serviceId: number;
  sparePartId: number;
  quantity: number;
  unitPrice: string;
  isCoveredByWarranty: boolean;
  coveragePercentage: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(savSpareParts).values({
    serviceId: data.serviceId,
    sparePartId: data.sparePartId,
    quantity: data.quantity,
    unitPrice: data.unitPrice,
    isCoveredByWarranty: data.isCoveredByWarranty,
    coveragePercentage: data.coveragePercentage,
  });

  return { id: Number(result.insertId) };
}

export async function unlinkSparePartFromSav(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(savSpareParts).where(eq(savSpareParts.id, id));
  return true;
}

export async function getSavSpareParts(serviceId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      savPart: savSpareParts,
      sparePart: spareParts,
    })
    .from(savSpareParts)
    .leftJoin(spareParts, eq(savSpareParts.sparePartId, spareParts.id))
    .where(eq(savSpareParts.serviceId, serviceId));
}

// ============================================
// WARRANTY RULES - CRUD
// ============================================

export async function getWarrantyRulesList(filters?: {
  brand?: string;
  component?: string;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.brand) {
    conditions.push(eq(warrantyRules.brand, filters.brand as any));
  }
  if (filters?.component) {
    conditions.push(eq(warrantyRules.component, filters.component));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(warrantyRules.isActive, filters.isActive));
  }

  let query = db.select().from(warrantyRules);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return await query.orderBy(warrantyRules.brand, warrantyRules.component);
}

export async function createWarrantyRule(data: {
  brand: string;
  productLine?: string;
  component: string;
  warrantyMonths: number;
  coveragePercentage: number;
  coverageRules?: string;
  exclusions?: string;
  warrantyStartType?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(warrantyRules).values({
    brand: data.brand as any,
    productLine: data.productLine,
    component: data.component,
    warrantyMonths: data.warrantyMonths,
    coveragePercentage: data.coveragePercentage,
    coverageRules: data.coverageRules,
    exclusions: data.exclusions,
    warrantyStartType: (data.warrantyStartType || "PURCHASE_DATE") as any,
    notes: data.notes,
  });

  return { id: Number(result.insertId) };
}

export async function updateWarrantyRule(id: number, data: Record<string, any>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(warrantyRules).set(data).where(eq(warrantyRules.id, id));
  return true;
}

export async function deleteWarrantyRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(warrantyRules).set({ isActive: false }).where(eq(warrantyRules.id, id));
  return true;
}

// ============================================
// SAV STATISTICS (enriched)
// ============================================

export async function getSavStats(period: string = "8weeks") {
  const db = await getDb();
  if (!db) return null;

  const intervalMap: Record<string, string> = {
    "4weeks": "4 WEEK",
    "8weeks": "8 WEEK",
    "3months": "3 MONTH",
    "1year": "1 YEAR",
  };
  const interval = intervalMap[period] || "8 WEEK";
  const dateFilter = sql`${afterSalesServices.createdAt} >= DATE_SUB(NOW(), INTERVAL ${sql.raw(interval)})`;

  const totalTickets = await db
    .select({ count: count() })
    .from(afterSalesServices)
    .where(dateFilter);

  const byStatus = await db
    .select({ status: afterSalesServices.status, count: count() })
    .from(afterSalesServices)
    .where(dateFilter)
    .groupBy(afterSalesServices.status);

  const byUrgency = await db
    .select({ urgency: afterSalesServices.urgency, count: count() })
    .from(afterSalesServices)
    .where(dateFilter)
    .groupBy(afterSalesServices.urgency);

  const byBrand = await db
    .select({ brand: afterSalesServices.brand, count: count() })
    .from(afterSalesServices)
    .where(dateFilter)
    .groupBy(afterSalesServices.brand);

  const byWarrantyStatus = await db
    .select({ warrantyStatus: afterSalesServices.warrantyStatus, count: count() })
    .from(afterSalesServices)
    .where(dateFilter)
    .groupBy(afterSalesServices.warrantyStatus);

  const byPartner = await db
    .select({ partnerId: afterSalesServices.partnerId, count: count() })
    .from(afterSalesServices)
    .where(dateFilter)
    .groupBy(afterSalesServices.partnerId);

  return {
    totalTickets: totalTickets[0]?.count || 0,
    byStatus,
    byUrgency,
    byBrand,
    byWarrantyStatus,
    byPartner,
  };
}

export async function getSavWeeklyStats(period: string = "8weeks") {
  const db = await getDb();
  if (!db) return null;

  const intervalMap: Record<string, string> = {
    "4weeks": "4 WEEK",
    "8weeks": "8 WEEK",
    "3months": "3 MONTH",
    "1year": "1 YEAR",
  };
  const interval = intervalMap[period] || "8 WEEK";

  const query = `
    SELECT 
      YEARWEEK(createdAt, 1) as week,
      COUNT(*) as count
    FROM after_sales_services
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${interval})
    GROUP BY YEARWEEK(createdAt, 1)
    ORDER BY YEARWEEK(createdAt, 1)
  `;

  const [rows] = (await db.execute(query)) as any;
  return rows as Array<{ week: string; count: number }>;
}

// ============================================
// CALCULATE SAV TOTALS (for payment)
// ============================================

export async function calculateSavTotal(serviceId: number) {
  const db = await getDb();
  if (!db) return null;

  const parts = await getSavSpareParts(serviceId);
  const [service] = await db
    .select()
    .from(afterSalesServices)
    .where(eq(afterSalesServices.id, serviceId));

  if (!service) return null;

  let partsTotal = 0;
  const partDetails: Array<{
    name: string;
    reference: string;
    quantity: number;
    unitPrice: number;
    coveragePercentage: number;
    customerPrice: number;
  }> = [];

  for (const p of parts) {
    if (p.sparePart) {
      const unitPrice = parseFloat(p.savPart.unitPrice);
      const qty = p.savPart.quantity;
      const coverage = p.savPart.coveragePercentage || 0;
      const customerPrice = unitPrice * qty * (1 - coverage / 100);
      partsTotal += customerPrice;
      partDetails.push({
        name: p.sparePart.name,
        reference: p.sparePart.reference,
        quantity: qty,
        unitPrice,
        coveragePercentage: coverage,
        customerPrice,
      });
    }
  }

  const shippingCost = service.shippingCost ? parseFloat(service.shippingCost) : 0;
  const vatRate = 0.21; // 21% TVA Belgique
  const subtotalHT = partsTotal + shippingCost;
  const vat = subtotalHT * vatRate;
  const totalTTC = subtotalHT + vat;

  return {
    parts: partDetails,
    partsTotal,
    shippingCost,
    subtotalHT,
    vat,
    totalTTC,
    warrantyStatus: service.warrantyStatus,
    warrantyPercentage: service.warrantyPercentage,
  };
}
