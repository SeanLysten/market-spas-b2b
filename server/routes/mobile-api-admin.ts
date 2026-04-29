/**
 * Mobile API - Admin Endpoints (compléments)
 * Utilisateurs, Produits CRUD, Événements, Ressources, Paiements,
 * Commandes actions, SAV admin, Territoires, Candidats, Newsletter,
 * Settings, Logs, Zones livraison, Garantie, Pièces/Modèles, Forecast, Analytics
 */
import { Router, Response, NextFunction } from "express";
import type { Request } from "express";
import { verifyMobileAccessToken } from "./mobile-auth";

interface AuthenticatedRequest extends Request {
  mobileUser?: {
    sub: string;
    openId: string;
    name: string;
    role: string;
    partnerId: number | null;
  };
}

async function requireMobileAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Token d'acc\u00e8s requis" });
  }
  const token = authHeader.slice(7);
  const payload = await verifyMobileAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: "INVALID_TOKEN", message: "Token invalide ou expir\u00e9" });
  }
  req.mobileUser = payload;
  next();
}

async function requireAdminRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const role = req.mobileUser?.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return res.status(403).json({ error: "FORBIDDEN", message: "Acc\u00e8s r\u00e9serv\u00e9 aux administrateurs" });
  }
  next();
}

const router = Router();

// Apply auth + admin middleware to all admin routes
router.use("/api/mobile/admin", requireMobileAuth, requireAdminRole);

// ============================================
// ADMIN USERS
// ============================================

// GET /api/mobile/admin/users
router.get("/api/mobile/admin/users", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getAllUsers } = await import("../db");
    const users = await getAllUsers();
    return res.json({ users });
  } catch (err: any) {
    console.error("[Mobile Admin] Users list error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/users/:id/toggle-active
router.put("/api/mobile/admin/users/:id/toggle-active", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { isActive } = req.body;
    const { updateUserStatus } = await import("../db");
    await updateUserStatus(userId, isActive);
    return res.json({ success: true, message: `Utilisateur ${isActive ? "activé" : "désactivé"}` });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN PRODUCTS
// ============================================

// GET /api/mobile/admin/products
router.get("/api/mobile/admin/products", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const offset = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const { getAllProducts } = await import("../db");
    const { products, total } = await getAllProducts({ search, category, limit, offset });
    return res.json({ products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/products
router.post("/api/mobile/admin/products", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { createProduct } = await import("../db");
    const product = await createProduct(req.body);
    return res.json({ success: true, product });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/products/:id
router.put("/api/mobile/admin/products/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const { updateProduct } = await import("../db");
    await updateProduct(productId, req.body);
    return res.json({ success: true, message: "Produit mis à jour" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/products/:id
router.delete("/api/mobile/admin/products/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const { deleteProduct } = await import("../db");
    await deleteProduct(productId);
    return res.json({ success: true, message: "Produit supprimé" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/products/:id/variants
router.get("/api/mobile/admin/products/:id/variants", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { productVariants } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, productId));
    return res.json({ variants });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN EVENTS
// ============================================

// GET /api/mobile/admin/events
router.get("/api/mobile/admin/events", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { events } = await import("../../drizzle/schema");
    const { desc } = await import("drizzle-orm");
    const db = await getDb();
    const rows = await db.select().from(events).orderBy(desc(events.startDate));
    return res.json({ events: rows });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/events
router.post("/api/mobile/admin/events", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, type, startDate, endDate, location, imageUrl, isPublished } = req.body;
    if (!title || !startDate) return res.status(400).json({ error: "MISSING_FIELDS", message: "Titre et date de début requis" });
    const { getDb } = await import("../db");
    const { events } = await import("../../drizzle/schema");
    const db = await getDb();
    const userId = parseInt(req.mobileUser!.sub);
    const [inserted] = await db.insert(events).values({
      title, description, type: type || "EVENT", startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null, location, imageUrl,
      isPublished: isPublished ?? true, createdByUserId: userId,
    }).$returningId();
    return res.json({ success: true, eventId: inserted.id });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/events/:id
router.put("/api/mobile/admin/events/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const { updateEvent } = await import("../db");
    await updateEvent(eventId, req.body);
    return res.json({ success: true, message: "Événement mis à jour" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/events/:id
router.delete("/api/mobile/admin/events/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { events } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(events).where(eq(events.id, eventId));
    return res.json({ success: true, message: "Événement supprimé" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN RESOURCES
// ============================================

// DELETE /api/mobile/admin/resources/:id
router.delete("/api/mobile/admin/resources/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resourceId = parseInt(req.params.id);
    const { deleteResource } = await import("../db");
    await deleteResource(resourceId);
    return res.json({ success: true, message: "Ressource supprimée" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN PAYMENTS
// ============================================

// GET /api/mobile/admin/payments
router.get("/api/mobile/admin/payments", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const { getDb } = await import("../db");
    const { payments, orders, partners } = await import("../../drizzle/schema");
    const { desc, sql, eq } = await import("drizzle-orm");
    const db = await getDb();
    const [rows, countResult] = await Promise.all([
      db.select({
        id: payments.id,
        orderId: payments.orderId,
        orderNumber: orders.orderNumber,
        amount: payments.amount,
        method: payments.method,
        status: payments.status,
        type: payments.type,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
        partnerCompany: partners.companyName,
      }).from(payments)
        .leftJoin(orders, eq(payments.orderId, orders.id))
        .leftJoin(partners, eq(orders.partnerId, partners.id))
        .orderBy(desc(payments.createdAt))
        .limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(payments),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return res.json({ payments: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN ORDERS - ACTIONS
// ============================================

// PUT /api/mobile/admin/orders/:id/status
router.put("/api/mobile/admin/orders/:id/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status, note } = req.body;
    if (!status) return res.status(400).json({ error: "MISSING_FIELDS", message: "Statut requis" });
    const userId = parseInt(req.mobileUser!.sub);
    const { getDb } = await import("../db");
    const { orders, orderStatusHistory } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return res.status(404).json({ error: "NOT_FOUND", message: "Commande introuvable" });
    const oldStatus = order.status as string;
    await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId));
    await db.insert(orderStatusHistory).values({
      orderId, oldStatus, newStatus: status,
      note: note || `Statut changé de ${oldStatus} à ${status}`,
      changedByUserId: userId,
    });
    // Trigger notifications
    try {
      const { notifyOrderStatusChange } = await import("../alerts");
      await notifyOrderStatusChange(orderId, oldStatus, status, userId, { skipHistory: true });
    } catch (e) { console.error("[Mobile Admin] Notification error:", e); }
    return res.json({ success: true, oldStatus, newStatus: status });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/orders/today
router.get("/api/mobile/admin/orders/today", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { orders, partners } = await import("../../drizzle/schema");
    const { gte, eq, desc } = await import("drizzle-orm");
    const db = await getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rows = await db.select({
      id: orders.id, orderNumber: orders.orderNumber, status: orders.status,
      totalHT: orders.totalHT, totalTTC: orders.totalTTC, createdAt: orders.createdAt,
      partnerCompany: partners.companyName,
    }).from(orders)
      .leftJoin(partners, eq(orders.partnerId, partners.id))
      .where(gte(orders.createdAt, today))
      .orderBy(desc(orders.createdAt));
    return res.json({ orders: rows, total: rows.length });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/orders/:id/validate
router.post("/api/mobile/admin/orders/:id/validate", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = parseInt(req.mobileUser!.sub);
    const { getDb } = await import("../db");
    const { orders, orderStatusHistory } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return res.status(404).json({ error: "NOT_FOUND", message: "Commande introuvable" });
    if (order.status !== "PENDING_APPROVAL") {
      return res.status(400).json({ error: "INVALID_STATUS", message: "La commande n'est pas en attente de validation" });
    }
    await db.update(orders).set({ status: "PENDING_DEPOSIT", updatedAt: new Date() }).where(eq(orders.id, orderId));
    await db.insert(orderStatusHistory).values({
      orderId, oldStatus: "PENDING_APPROVAL", newStatus: "PENDING_DEPOSIT",
      note: "Commande validée par admin", changedByUserId: userId,
    });
    try {
      const { notifyOrderStatusChange } = await import("../alerts");
      await notifyOrderStatusChange(orderId, "PENDING_APPROVAL", "PENDING_DEPOSIT", userId, { skipHistory: true });
    } catch (e) { console.error("[Mobile Admin] Notification error:", e); }
    return res.json({ success: true, message: "Commande validée" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN PARTNERS - CREATE/UPDATE
// ============================================

// POST /api/mobile/admin/partners
router.post("/api/mobile/admin/partners", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { createPartner } = await import("../db");
    const partner = await createPartner(req.body);
    return res.json({ success: true, partner });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/partners/:id
router.put("/api/mobile/admin/partners/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = parseInt(req.params.id);
    const { updatePartner } = await import("../db");
    await updatePartner(partnerId, req.body);
    return res.json({ success: true, message: "Partenaire mis à jour" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN SAV
// ============================================

// PUT /api/mobile/admin/sav/:id/status
router.put("/api/mobile/admin/sav/:id/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const savId = parseInt(req.params.id);
    const { status, note } = req.body;
    if (!status) return res.status(400).json({ error: "MISSING_FIELDS", message: "Statut requis" });
    const userId = parseInt(req.mobileUser!.sub);
    const { getDb } = await import("../db");
    const { afterSalesServices, afterSalesStatusHistory } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [sav] = await db.select().from(afterSalesServices).where(eq(afterSalesServices.id, savId)).limit(1);
    if (!sav) return res.status(404).json({ error: "NOT_FOUND", message: "Dossier SAV introuvable" });
    const oldStatus = sav.status as string;
    await db.update(afterSalesServices).set({ status: status as any, updatedAt: new Date() }).where(eq(afterSalesServices.id, savId));
    await db.insert(afterSalesStatusHistory).values({
      afterSalesId: savId, oldStatus, newStatus: status,
      note: note || `Statut changé de ${oldStatus} à ${status}`, changedByUserId: userId,
    });
    return res.json({ success: true, oldStatus, newStatus: status });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/sav/:id/warranty
router.put("/api/mobile/admin/sav/:id/warranty", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const savId = parseInt(req.params.id);
    const { warrantyStatus, warrantyNotes } = req.body;
    const { getDb } = await import("../db");
    const { afterSalesServices } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (warrantyStatus) updateData.warrantyStatus = warrantyStatus;
    if (warrantyNotes !== undefined) updateData.warrantyNotes = warrantyNotes;
    await db.update(afterSalesServices).set(updateData).where(eq(afterSalesServices.id, savId));
    return res.json({ success: true, message: "Décision de garantie mise à jour" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/sav/:id/spare-part
router.post("/api/mobile/admin/sav/:id/spare-part", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const savId = parseInt(req.params.id);
    const { sparePartId, quantity, unitPrice } = req.body;
    if (!sparePartId) return res.status(400).json({ error: "MISSING_FIELDS", message: "sparePartId requis" });
    const { getDb } = await import("../db");
    const { savSpareParts } = await import("../../drizzle/schema");
    const db = await getDb();
    await db.insert(savSpareParts).values({
      afterSalesId: savId, sparePartId, quantity: quantity || 1, unitPrice: unitPrice || "0",
    });
    return res.json({ success: true, message: "Pièce liée au dossier SAV" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/sav/:savId/spare-part/:partId
router.delete("/api/mobile/admin/sav/:savId/spare-part/:partId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const linkId = parseInt(req.params.partId);
    const { getDb } = await import("../db");
    const { savSpareParts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(savSpareParts).where(eq(savSpareParts.id, linkId));
    return res.json({ success: true, message: "Pièce retirée" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/sav/:id/tracking
router.post("/api/mobile/admin/sav/:id/tracking", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const savId = parseInt(req.params.id);
    const { trackingNumber, trackingCarrier, trackingUrl } = req.body;
    if (!trackingNumber) return res.status(400).json({ error: "MISSING_FIELDS", message: "Numéro de suivi requis" });
    const { getDb } = await import("../db");
    const { afterSalesServices } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(afterSalesServices).set({
      trackingNumber, trackingCarrier: trackingCarrier || null,
      trackingUrl: trackingUrl || null, updatedAt: new Date(),
    }).where(eq(afterSalesServices.id, savId));
    return res.json({ success: true, message: "Suivi ajouté" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/sav/stats
router.get("/api/mobile/admin/sav/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { afterSalesServices } = await import("../../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    const db = await getDb();
    const stats = await db.select({
      status: afterSalesServices.status,
      count: sql<number>`COUNT(*)`,
    }).from(afterSalesServices).groupBy(afterSalesServices.status);
    const total = stats.reduce((sum, s) => sum + Number(s.count), 0);
    return res.json({ stats, total });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/sav
router.get("/api/mobile/admin/sav", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status as string | undefined;
    const { getDb } = await import("../db");
    const { afterSalesServices, partners } = await import("../../drizzle/schema");
    const { eq, and, desc, sql } = await import("drizzle-orm");
    const db = await getDb();
    const conditions: any[] = [];
    if (statusFilter) conditions.push(eq(afterSalesServices.status, statusFilter as any));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [rows, countResult] = await Promise.all([
      db.select({
        id: afterSalesServices.id,
        ticketNumber: afterSalesServices.ticketNumber,
        status: afterSalesServices.status,
        urgency: afterSalesServices.urgency,
        brand: afterSalesServices.brand,
        issueType: afterSalesServices.issueType,
        component: afterSalesServices.component,
        warrantyStatus: afterSalesServices.warrantyStatus,
        partnerId: afterSalesServices.partnerId,
        partnerCompany: partners.companyName,
        createdAt: afterSalesServices.createdAt,
      }).from(afterSalesServices)
        .leftJoin(partners, eq(afterSalesServices.partnerId, partners.id))
        .where(whereClause)
        .orderBy(desc(afterSalesServices.createdAt))
        .limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(afterSalesServices).where(whereClause),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return res.json({ tickets: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN CUSTOMER SAV (B2C)
// ============================================

// GET /api/mobile/admin/customer-sav
router.get("/api/mobile/admin/customer-sav", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const { getDb } = await import("../db");
    const { customerSavTickets } = await import("../../drizzle/schema");
    const { desc, sql } = await import("drizzle-orm");
    const db = await getDb();
    const [rows, countResult] = await Promise.all([
      db.select().from(customerSavTickets).orderBy(desc(customerSavTickets.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(customerSavTickets),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return res.json({ tickets: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/customer-sav/:id/status
router.put("/api/mobile/admin/customer-sav/:id/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { status } = req.body;
    const { getDb } = await import("../db");
    const { customerSavTickets } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(customerSavTickets).set({ status: status as any, updatedAt: new Date() }).where(eq(customerSavTickets.id, ticketId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN TERRITORIES
// ============================================

// GET /api/mobile/admin/territories
router.get("/api/mobile/admin/territories", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { countries, regions, postalCodeRanges, partnerTerritories } = await import("../../drizzle/schema");
    const db = await getDb();
    const [allCountries, allRegions, allRanges, allTerritories] = await Promise.all([
      db.select().from(countries),
      db.select().from(regions),
      db.select().from(postalCodeRanges),
      db.select().from(partnerTerritories),
    ]);
    return res.json({ countries: allCountries, regions: allRegions, postalCodeRanges: allRanges, partnerTerritories: allTerritories });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN CANDIDATES
// ============================================

// GET /api/mobile/admin/candidates
router.get("/api/mobile/admin/candidates", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const { getDb } = await import("../db");
    const { partnerCandidates } = await import("../../drizzle/schema");
    const { desc, sql } = await import("drizzle-orm");
    const db = await getDb();
    const [rows, countResult] = await Promise.all([
      db.select().from(partnerCandidates).orderBy(desc(partnerCandidates.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(partnerCandidates),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return res.json({ candidates: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/candidates/:id
router.put("/api/mobile/admin/candidates/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const candidateId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { partnerCandidates } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(partnerCandidates).set({ ...req.body, updatedAt: new Date() }).where(eq(partnerCandidates.id, candidateId));
    return res.json({ success: true, message: "Candidat mis à jour" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN NEWSLETTER
// ============================================

// GET /api/mobile/admin/newsletters/scheduled
router.get("/api/mobile/admin/newsletters/scheduled", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { scheduledNewsletters } = await import("../../drizzle/schema");
    const { desc } = await import("drizzle-orm");
    const db = await getDb();
    const rows = await db.select().from(scheduledNewsletters).orderBy(desc(scheduledNewsletters.scheduledAt));
    return res.json({ newsletters: rows });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN SETTINGS
// ============================================

// GET /api/mobile/admin/settings
router.get("/api/mobile/admin/settings", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getAllSystemSettings } = await import("../db");
    const settings = await getAllSystemSettings();
    return res.json({ settings });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/settings
router.put("/api/mobile/admin/settings", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { settings } = req.body;
    if (!settings || typeof settings !== "object") return res.status(400).json({ error: "MISSING_FIELDS", message: "settings object requis" });
    const { upsertMultipleSystemSettings } = await import("../db");
    await upsertMultipleSystemSettings(settings, userId);
    return res.json({ success: true, message: "Paramètres mis à jour" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/settings/integrations
router.get("/api/mobile/admin/settings/integrations", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { metaAdAccounts, googleAdAccounts, ga4Accounts } = await import("../../drizzle/schema");
    const db = await getDb();
    const [meta, google, ga4] = await Promise.all([
      db.select().from(metaAdAccounts),
      db.select().from(googleAdAccounts),
      db.select().from(ga4Accounts),
    ]);
    return res.json({
      metaAds: { connected: meta.length > 0, accounts: meta },
      googleAds: { connected: google.length > 0, accounts: google },
      googleAnalytics: { connected: ga4.length > 0, accounts: ga4 },
    });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN LOGS
// ============================================

// GET /api/mobile/admin/webhook-logs
router.get("/api/mobile/admin/webhook-logs", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const { getDb } = await import("../db");
    const { mollieWebhookLogs } = await import("../../drizzle/schema");
    const { desc, sql } = await import("drizzle-orm");
    const db = await getDb();
    const [rows, countResult] = await Promise.all([
      db.select().from(mollieWebhookLogs).orderBy(desc(mollieWebhookLogs.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(mollieWebhookLogs),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return res.json({ logs: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/supplier-logs
router.get("/api/mobile/admin/supplier-logs", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const { getDb } = await import("../db");
    const { supplierApiLogs } = await import("../../drizzle/schema");
    const { desc, sql } = await import("drizzle-orm");
    const db = await getDb();
    const [rows, countResult] = await Promise.all([
      db.select().from(supplierApiLogs).orderBy(desc(supplierApiLogs.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(supplierApiLogs),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return res.json({ logs: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN SHIPPING ZONES
// ============================================

// GET /api/mobile/admin/shipping-zones
router.get("/api/mobile/admin/shipping-zones", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { shippingZones } = await import("../../drizzle/schema");
    const db = await getDb();
    const zones = await db.select().from(shippingZones);
    return res.json({ zones });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN WARRANTY RULES
// ============================================

// GET /api/mobile/admin/warranty-rules
router.get("/api/mobile/admin/warranty-rules", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { warrantyRules } = await import("../../drizzle/schema");
    const db = await getDb();
    const rules = await db.select().from(warrantyRules);
    return res.json({ rules });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/warranty-rules
router.post("/api/mobile/admin/warranty-rules", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { warrantyRules } = await import("../../drizzle/schema");
    const db = await getDb();
    const [inserted] = await db.insert(warrantyRules).values(req.body).$returningId();
    return res.json({ success: true, ruleId: inserted.id });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/warranty-rules/:id
router.put("/api/mobile/admin/warranty-rules/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ruleId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { warrantyRules } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(warrantyRules).set(req.body).where(eq(warrantyRules.id, ruleId));
    return res.json({ success: true, message: "Règle mise à jour" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/warranty-rules/:id
router.delete("/api/mobile/admin/warranty-rules/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ruleId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { warrantyRules } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(warrantyRules).where(eq(warrantyRules.id, ruleId));
    return res.json({ success: true, message: "Règle supprimée" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN SPARE PARTS
// ============================================

// POST /api/mobile/admin/spare-parts
router.post("/api/mobile/admin/spare-parts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { spareParts } = await import("../../drizzle/schema");
    const db = await getDb();
    const [inserted] = await db.insert(spareParts).values(req.body).$returningId();
    return res.json({ success: true, sparePartId: inserted.id });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/spare-parts/:id
router.put("/api/mobile/admin/spare-parts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { spareParts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(spareParts).set({ ...req.body, updatedAt: new Date() }).where(eq(spareParts.id, partId));
    return res.json({ success: true, message: "Pièce mise à jour" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/spare-parts/:id
router.delete("/api/mobile/admin/spare-parts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { spareParts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(spareParts).where(eq(spareParts.id, partId));
    return res.json({ success: true, message: "Pièce supprimée" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN SPA MODELS
// ============================================

// POST /api/mobile/admin/spa-models
router.post("/api/mobile/admin/spa-models", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { spaModels } = await import("../../drizzle/schema");
    const db = await getDb();
    const [inserted] = await db.insert(spaModels).values(req.body).$returningId();
    return res.json({ success: true, modelId: inserted.id });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/spa-models/:id
router.put("/api/mobile/admin/spa-models/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const modelId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { spaModels } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(spaModels).set({ ...req.body, updatedAt: new Date() }).where(eq(spaModels.id, modelId));
    return res.json({ success: true, message: "Modèle mis à jour" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/spa-models/:id
router.delete("/api/mobile/admin/spa-models/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const modelId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { spaModels } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(spaModels).where(eq(spaModels.id, modelId));
    return res.json({ success: true, message: "Modèle supprimé" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/spa-models/:id/parts
router.post("/api/mobile/admin/spa-models/:id/parts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const modelId = parseInt(req.params.id);
    const { sparePartId, quantity } = req.body;
    if (!sparePartId) return res.status(400).json({ error: "MISSING_FIELDS", message: "sparePartId requis" });
    const { getDb } = await import("../db");
    const { spaModelSpareParts } = await import("../../drizzle/schema");
    const db = await getDb();
    await db.insert(spaModelSpareParts).values({ spaModelId: modelId, sparePartId, quantity: quantity || 1 });
    return res.json({ success: true, message: "Pièce ajoutée au modèle" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/spa-models/:modelId/parts/:partId
router.delete("/api/mobile/admin/spa-models/:modelId/parts/:partId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const linkId = parseInt(req.params.partId);
    const { getDb } = await import("../db");
    const { spaModelSpareParts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(spaModelSpareParts).where(eq(spaModelSpareParts.id, linkId));
    return res.json({ success: true, message: "Pièce retirée du modèle" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN FORECAST
// ============================================

// GET /api/mobile/admin/forecast
router.get("/api/mobile/admin/forecast", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { products, incomingStock, productArrivals } = await import("../../drizzle/schema");
    const { desc, sql, eq, gte } = await import("drizzle-orm");
    const db = await getDb();
    const now = new Date();
    const [allProducts, incoming, arrivals] = await Promise.all([
      db.select({
        id: products.id, name: products.name, sku: products.sku,
        quantityInStock: products.quantityInStock, quantityInTransit: products.quantityInTransit,
        quantityReserved: products.quantityReserved,
      }).from(products),
      db.select().from(incomingStock).where(gte(incomingStock.expectedArrivalDate, now)),
      db.select().from(productArrivals).orderBy(desc(productArrivals.createdAt)).limit(50),
    ]);
    return res.json({ products: allProducts, incomingStock: incoming, recentArrivals: arrivals });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN STATS - ENRICHED
// ============================================

// GET /api/mobile/admin/stats/detailed
router.get("/api/mobile/admin/stats/detailed", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { orders, partners, leads, afterSalesServices, payments, customerSavTickets } = await import("../../drizzle/schema");
    const { eq, sql, gte, and, desc } = await import("drizzle-orm");
    const db = await getDb();

    // Monthly revenue (last 12 months)
    const monthlyRevenue = await db.select({
      month: sql<string>`DATE_FORMAT(${orders.createdAt}, '%Y-%m')`,
      totalHT: sql<number>`COALESCE(SUM(${orders.totalHT}), 0)`,
      totalTTC: sql<number>`COALESCE(SUM(${orders.totalTTC}), 0)`,
      count: sql<number>`COUNT(*)`,
    }).from(orders)
      .where(gte(orders.createdAt, sql`DATE_SUB(NOW(), INTERVAL 12 MONTH)`))
      .groupBy(sql`DATE_FORMAT(${orders.createdAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${orders.createdAt}, '%Y-%m')`);

    // Orders by status
    const ordersByStatus = await db.select({
      status: orders.status,
      count: sql<number>`COUNT(*)`,
    }).from(orders).groupBy(orders.status);

    // Leads by status
    const leadsByStatus = await db.select({
      status: leads.status,
      count: sql<number>`COUNT(*)`,
    }).from(leads).groupBy(leads.status);

    // SAV by status
    const savByStatus = await db.select({
      status: afterSalesServices.status,
      count: sql<number>`COUNT(*)`,
    }).from(afterSalesServices).groupBy(afterSalesServices.status);

    // Partners by level
    const partnersByLevel = await db.select({
      level: partners.level,
      count: sql<number>`COUNT(*)`,
    }).from(partners).groupBy(partners.level);

    // Top partners by revenue
    const topPartners = await db.select({
      partnerId: orders.partnerId,
      companyName: partners.companyName,
      totalRevenue: sql<number>`COALESCE(SUM(${orders.totalTTC}), 0)`,
      orderCount: sql<number>`COUNT(*)`,
    }).from(orders)
      .leftJoin(partners, eq(orders.partnerId, partners.id))
      .groupBy(orders.partnerId, partners.companyName)
      .orderBy(sql`SUM(${orders.totalTTC}) DESC`)
      .limit(10);

    // Recent activity
    const recentPayments = await db.select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      status: payments.status,
      createdAt: payments.createdAt,
    }).from(payments).orderBy(desc(payments.createdAt)).limit(5);

    return res.json({
      monthlyRevenue,
      ordersByStatus,
      leadsByStatus,
      savByStatus,
      partnersByLevel,
      topPartners,
      recentPayments,
    });
  } catch (err: any) {
    console.error("[Mobile Admin] Detailed stats error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN LEADS - ENRICHED
// ============================================

// GET /api/mobile/admin/leads/stats
router.get("/api/mobile/admin/leads/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { leads } = await import("../../drizzle/schema");
    const { sql, gte } = await import("drizzle-orm");
    const db = await getDb();
    const [byStatus, bySource, monthly] = await Promise.all([
      db.select({ status: leads.status, count: sql<number>`COUNT(*)` }).from(leads).groupBy(leads.status),
      db.select({ source: leads.source, count: sql<number>`COUNT(*)` }).from(leads).groupBy(leads.source),
      db.select({
        month: sql<string>`DATE_FORMAT(${leads.createdAt}, '%Y-%m')`,
        count: sql<number>`COUNT(*)`,
      }).from(leads)
        .where(gte(leads.createdAt, sql`DATE_SUB(NOW(), INTERVAL 12 MONTH)`))
        .groupBy(sql`DATE_FORMAT(${leads.createdAt}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${leads.createdAt}, '%Y-%m')`),
    ]);
    return res.json({ byStatus, bySource, monthly });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/leads/:id
router.put("/api/mobile/admin/leads/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leadId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { leads } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(leads).set({ ...req.body, updatedAt: new Date() }).where(eq(leads.id, leadId));
    return res.json({ success: true, message: "Lead mis à jour" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN USERS - EXTENDED
// ============================================

// POST /api/mobile/admin/users/invite
router.post("/api/mobile/admin/users/invite", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { invitations } = await import("../../drizzle/schema");
    const db = await getDb();
    const { email, role, partnerId } = req.body;
    if (!email) return res.status(400).json({ error: "VALIDATION_ERROR", message: "Email requis" });
    const token = require("crypto").randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [invitation] = await db.insert(invitations).values({
      email, role: role || "PARTNER_USER", partnerId: partnerId || null,
      invitedBy: parseInt(req.mobileUser!.sub), token, expiresAt,
    }).returning();
    // Send invitation email
    try {
      const { sendInvitationEmail } = await import("../email");
      await sendInvitationEmail(email, token, req.mobileUser!.name);
    } catch (e) { /* email failure non-blocking */ }
    return res.json({ invitation });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/users/:id/role
router.put("/api/mobile/admin/users/:id/role", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: "VALIDATION_ERROR", message: "R\u00f4le requis" });
    const { getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(users).set({ role }).where(eq(users.id, userId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/users/invitations
router.get("/api/mobile/admin/users/invitations", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { invitations } = await import("../../drizzle/schema");
    const { isNull } = await import("drizzle-orm");
    const db = await getDb();
    const pending = await db.select().from(invitations).where(isNull(invitations.acceptedAt));
    return res.json({ invitations: pending });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/users/invitations/:id/resend
router.post("/api/mobile/admin/users/invitations/:id/resend", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { invitations } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [inv] = await db.select().from(invitations).where(eq(invitations.id, invId));
    if (!inv) return res.status(404).json({ error: "NOT_FOUND" });
    try {
      const { sendInvitationEmail } = await import("../email");
      await sendInvitationEmail(inv.email, inv.token, req.mobileUser!.name);
    } catch (e) { /* non-blocking */ }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/users/invitations/:id
router.delete("/api/mobile/admin/users/invitations/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { invitations } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(invitations).where(eq(invitations.id, invId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN PARTNERS - EXTENDED
// ============================================

// DELETE /api/mobile/admin/partners/:id
router.delete("/api/mobile/admin/partners/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { partners } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(partners).where(eq(partners.id, partnerId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/partners/:id/approve
router.post("/api/mobile/admin/partners/:id/approve", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { partners } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(partners).set({ status: "APPROVED", approvedAt: new Date() }).where(eq(partners.id, partnerId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/partners/:id/discounts
router.get("/api/mobile/admin/partners/:id/discounts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { partnerProductDiscounts, products } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const discounts = await db.select({
      id: partnerProductDiscounts.id,
      productId: partnerProductDiscounts.productId,
      discountPercent: partnerProductDiscounts.discountPercent,
      productName: products.name,
    }).from(partnerProductDiscounts)
      .leftJoin(products, eq(partnerProductDiscounts.productId, products.id))
      .where(eq(partnerProductDiscounts.partnerId, partnerId));
    return res.json({ discounts });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/partners/:id/discounts
router.put("/api/mobile/admin/partners/:id/discounts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { partnerProductDiscounts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const { discounts } = req.body; // [{ productId, discountPercent }]
    if (!Array.isArray(discounts)) return res.status(400).json({ error: "VALIDATION_ERROR" });
    // Delete existing and re-insert
    await db.delete(partnerProductDiscounts).where(eq(partnerProductDiscounts.partnerId, partnerId));
    if (discounts.length > 0) {
      await db.insert(partnerProductDiscounts).values(
        discounts.map((d: any) => ({ partnerId, productId: d.productId, discountPercent: d.discountPercent.toString() }))
      );
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN PRODUCTS - VARIANTS
// ============================================

// POST /api/mobile/admin/products/:id/variants
router.post("/api/mobile/admin/products/:id/variants", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const { createProductVariant } = await import("../db");
    const variant = await createProductVariant({ ...req.body, productId });
    return res.json({ variant });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/variants/:id
router.put("/api/mobile/admin/variants/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const variantId = parseInt(req.params.id);
    const { updateProductVariant } = await import("../db");
    const variant = await updateProductVariant(variantId, req.body);
    return res.json({ variant });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/variants/:id
router.delete("/api/mobile/admin/variants/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const variantId = parseInt(req.params.id);
    const { deleteProductVariant } = await import("../db");
    await deleteProductVariant(variantId);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/products/reorder
router.put("/api/mobile/admin/products/reorder", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productIds } = req.body; // array of product IDs in new order
    if (!Array.isArray(productIds)) return res.status(400).json({ error: "VALIDATION_ERROR" });
    const { getDb } = await import("../db");
    const { products } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    for (let i = 0; i < productIds.length; i++) {
      await db.update(products).set({ sortOrder: i }).where(eq(products.id, productIds[i]));
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN LEADS - EXTENDED
// ============================================

// GET /api/mobile/admin/leads/partnership
router.get("/api/mobile/admin/leads/partnership", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { leads } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const partnerLeads = await db.select().from(leads).where(eq(leads.type, "PARTNERSHIP"));
    return res.json({ leads: partnerLeads });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/leads/reassign-all
router.post("/api/mobile/admin/leads/reassign-all", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { leads } = await import("../../drizzle/schema");
    const { isNull } = await import("drizzle-orm");
    const db = await getDb();
    // Reassign unassigned leads based on territory
    const unassigned = await db.select().from(leads).where(isNull(leads.partnerId));
    let reassigned = 0;
    // Simple auto-assignment logic based on postal code
    for (const lead of unassigned) {
      if (lead.postalCode) {
        const { territories, partners } = await import("../../drizzle/schema");
        const { eq, and, sql } = await import("drizzle-orm");
        const matchingTerritory = await db.select().from(territories)
          .where(sql`${lead.postalCode} LIKE CONCAT(${territories.postalPrefix}, '%')`)
          .limit(1);
        if (matchingTerritory.length > 0) {
          await db.update(leads).set({ partnerId: matchingTerritory[0].partnerId, status: "ASSIGNED" })
            .where(eq(leads.id, lead.id));
          reassigned++;
        }
      }
    }
    return res.json({ success: true, reassigned, total: unassigned.length });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN EVENTS - EXTENDED
// ============================================

// POST /api/mobile/admin/events/:id/toggle-publish
router.post("/api/mobile/admin/events/:id/toggle-publish", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { events } = await import("../../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");
    const db = await getDb();
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) return res.status(404).json({ error: "NOT_FOUND" });
    await db.update(events).set({ isPublished: !event.isPublished }).where(eq(events.id, eventId));
    return res.json({ success: true, isPublished: !event.isPublished });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN CANDIDATES - EXTENDED
// ============================================

// POST /api/mobile/admin/candidates/:id/toggle-visited
router.post("/api/mobile/admin/candidates/:id/toggle-visited", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const candidateId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { candidates } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [c] = await db.select().from(candidates).where(eq(candidates.id, candidateId));
    if (!c) return res.status(404).json({ error: "NOT_FOUND" });
    await db.update(candidates).set({ visited: !c.visited }).where(eq(candidates.id, candidateId));
    return res.json({ success: true, visited: !c.visited });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/candidates/:id/increment-email
router.post("/api/mobile/admin/candidates/:id/increment-email", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const candidateId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { candidates } = await import("../../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(candidates).set({ emailCount: sql`COALESCE(${candidates.emailCount}, 0) + 1` })
      .where(eq(candidates.id, candidateId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/candidates/:id/increment-phone
router.post("/api/mobile/admin/candidates/:id/increment-phone", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const candidateId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { candidates } = await import("../../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(candidates).set({ phoneCount: sql`COALESCE(${candidates.phoneCount}, 0) + 1` })
      .where(eq(candidates.id, candidateId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/candidates/:id/coordinates
router.put("/api/mobile/admin/candidates/:id/coordinates", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const candidateId = parseInt(req.params.id);
    const { lat, lng } = req.body;
    const { getDb } = await import("../db");
    const { candidates } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(candidates).set({ latitude: lat?.toString(), longitude: lng?.toString() })
      .where(eq(candidates.id, candidateId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/candidates/detect-duplicates
router.post("/api/mobile/admin/candidates/detect-duplicates", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { candidates } = await import("../../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    const db = await getDb();
    // Find candidates with same name or same address
    const duplicates = await db.execute(sql`
      SELECT a.id as id1, b.id as id2, a.company_name, a.city
      FROM candidates a JOIN candidates b ON a.id < b.id
      AND (LOWER(a.company_name) = LOWER(b.company_name) OR (a.address = b.address AND a.city = b.city))
      LIMIT 100
    `);
    return res.json({ duplicates: duplicates.rows || duplicates });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/candidates/auto-merge
router.post("/api/mobile/admin/candidates/auto-merge", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { candidates } = await import("../../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");
    const db = await getDb();
    // Auto-merge exact duplicates by company name
    const dupes = await db.execute(sql`
      SELECT MIN(id) as keep_id, GROUP_CONCAT(id) as all_ids, company_name
      FROM candidates GROUP BY LOWER(company_name) HAVING COUNT(*) > 1 LIMIT 50
    `);
    let merged = 0;
    const rows = (dupes.rows || dupes) as any[];
    for (const row of rows) {
      const ids = row.all_ids.split(',').map(Number);
      const keepId = row.keep_id;
      const deleteIds = ids.filter((id: number) => id !== keepId);
      for (const delId of deleteIds) {
        await db.delete(candidates).where(eq(candidates.id, delId));
        merged++;
      }
    }
    return res.json({ success: true, merged });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/candidates/merge
router.post("/api/mobile/admin/candidates/merge", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { keepId, mergeIds } = req.body;
    if (!keepId || !Array.isArray(mergeIds)) return res.status(400).json({ error: "VALIDATION_ERROR" });
    const { getDb } = await import("../db");
    const { candidates } = await import("../../drizzle/schema");
    const { eq, inArray } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(candidates).where(inArray(candidates.id, mergeIds));
    return res.json({ success: true, kept: keepId, deleted: mergeIds.length });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/candidates/reclassify-partner-leads
router.post("/api/mobile/admin/candidates/reclassify-partner-leads", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { candidates, partners } = await import("../../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");
    const db = await getDb();
    // Find candidates that match existing partners and mark them
    const result = await db.execute(sql`
      UPDATE candidates c SET c.status = 'PARTNER_EXISTING'
      WHERE EXISTS (SELECT 1 FROM partners p WHERE LOWER(p.company_name) = LOWER(c.company_name))
      AND c.status != 'PARTNER_EXISTING'
    `);
    return res.json({ success: true, reclassified: (result as any).changes || 0 });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN TERRITORIES - EXTENDED
// ============================================

// POST /api/mobile/admin/territories/assign
router.post("/api/mobile/admin/territories/assign", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { partnerId, postalPrefix, country, region } = req.body;
    const { getDb } = await import("../db");
    const { territories } = await import("../../drizzle/schema");
    const db = await getDb();
    const [territory] = await db.insert(territories).values({
      partnerId, postalPrefix, country: country || "BE", region: region || null,
    }).returning();
    return res.json({ territory });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/territories/:id
router.delete("/api/mobile/admin/territories/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const territoryId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { territories } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(territories).where(eq(territories.id, territoryId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/territories/by-partner/:partnerId
router.get("/api/mobile/admin/territories/by-partner/:partnerId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = parseInt(req.params.partnerId);
    const { getDb } = await import("../db");
    const { territories } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const items = await db.select().from(territories).where(eq(territories.partnerId, partnerId));
    return res.json({ territories: items });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/territories/countries
router.get("/api/mobile/admin/territories/countries", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { territories } = await import("../../drizzle/schema");
    const db = await getDb();
    const countries = await db.selectDistinct({ country: territories.country }).from(territories);
    return res.json({ countries: countries.map(c => c.country) });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/territories/regions
router.get("/api/mobile/admin/territories/regions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const country = req.query.country as string;
    const { getDb } = await import("../db");
    const { territories } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    let query = db.selectDistinct({ region: territories.region }).from(territories);
    if (country) query = query.where(eq(territories.country, country)) as any;
    const regions = await query;
    return res.json({ regions: regions.map(r => r.region).filter(Boolean) });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN AFTER SALES - EXTENDED
// ============================================

// GET /api/mobile/admin/sav/:id
router.get("/api/mobile/admin/sav/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const savId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { afterSalesServices, afterSalesNotes, partners, users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [sav] = await db.select().from(afterSalesServices).where(eq(afterSalesServices.id, savId));
    if (!sav) return res.status(404).json({ error: "NOT_FOUND" });
    const notes = await db.select().from(afterSalesNotes).where(eq(afterSalesNotes.afterSalesId, savId));
    let partner = null;
    if (sav.partnerId) {
      const [p] = await db.select().from(partners).where(eq(partners.id, sav.partnerId));
      partner = p || null;
    }
    return res.json({ sav, notes, partner });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/sav/:id/note
router.post("/api/mobile/admin/sav/:id/note", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const savId = parseInt(req.params.id);
    const userId = parseInt(req.mobileUser!.sub);
    const { content, isInternal } = req.body;
    if (!content) return res.status(400).json({ error: "VALIDATION_ERROR", message: "Contenu requis" });
    const { getDb } = await import("../db");
    const { afterSalesNotes } = await import("../../drizzle/schema");
    const db = await getDb();
    const [note] = await db.insert(afterSalesNotes).values({
      afterSalesId: savId, userId, content, isInternal: isInternal || false,
    }).returning();
    return res.json({ note });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/sav/:id/shipping-cost
router.put("/api/mobile/admin/sav/:id/shipping-cost", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const savId = parseInt(req.params.id);
    const { shippingCost } = req.body;
    const { getDb } = await import("../db");
    const { afterSalesServices } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(afterSalesServices).set({ shippingCost: shippingCost?.toString() })
      .where(eq(afterSalesServices.id, savId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/sav/:id/payment
router.post("/api/mobile/admin/sav/:id/payment", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const savId = parseInt(req.params.id);
    const { amount, method, reference } = req.body;
    const { getDb } = await import("../db");
    const { afterSalesPayments } = await import("../../drizzle/schema");
    const db = await getDb();
    const [payment] = await db.insert(afterSalesPayments).values({
      afterSalesId: savId, amount: amount?.toString(), method: method || "BANK_TRANSFER", reference,
    }).returning();
    return res.json({ payment });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/sav/weekly-stats
router.get("/api/mobile/admin/sav/weekly-stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { afterSalesServices } = await import("../../drizzle/schema");
    const { sql, gte } = await import("drizzle-orm");
    const db = await getDb();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [stats] = await db.select({
      total: sql<number>`COUNT(*)`,
      newThisWeek: sql<number>`SUM(CASE WHEN ${afterSalesServices.createdAt} >= ${oneWeekAgo} THEN 1 ELSE 0 END)`,
      pending: sql<number>`SUM(CASE WHEN ${afterSalesServices.status} = 'PENDING' THEN 1 ELSE 0 END)`,
      inProgress: sql<number>`SUM(CASE WHEN ${afterSalesServices.status} = 'IN_PROGRESS' THEN 1 ELSE 0 END)`,
    }).from(afterSalesServices);
    return res.json(stats);
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN CUSTOMER SAV - EXTENDED
// ============================================

// GET /api/mobile/admin/customer-sav/stats
router.get("/api/mobile/admin/customer-sav/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { customerSavRequests } = await import("../../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    const db = await getDb();
    const [stats] = await db.select({
      total: sql<number>`COUNT(*)`,
      pending: sql<number>`SUM(CASE WHEN ${customerSavRequests.status} = 'PENDING' THEN 1 ELSE 0 END)`,
      inProgress: sql<number>`SUM(CASE WHEN ${customerSavRequests.status} = 'IN_PROGRESS' THEN 1 ELSE 0 END)`,
      resolved: sql<number>`SUM(CASE WHEN ${customerSavRequests.status} = 'RESOLVED' THEN 1 ELSE 0 END)`,
    }).from(customerSavRequests);
    return res.json(stats);
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN NEWSLETTER - EXTENDED
// ============================================

// POST /api/mobile/admin/newsletters/send
router.post("/api/mobile/admin/newsletters/send", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subject, htmlContent, mailingListId, testEmail } = req.body;
    if (!subject || !htmlContent) return res.status(400).json({ error: "VALIDATION_ERROR", message: "Sujet et contenu requis" });
    const { getDb } = await import("../db");
    const db = await getDb();
    if (testEmail) {
      // Send test email
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({ from: process.env.EMAIL_FROM || "noreply@marketspas.pro", to: testEmail, subject, html: htmlContent });
      return res.json({ success: true, type: "test", sentTo: testEmail });
    }
    // Send to mailing list
    if (!mailingListId) return res.status(400).json({ error: "VALIDATION_ERROR", message: "Liste de diffusion requise" });
    const { mailingListContacts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const contacts = await db.select().from(mailingListContacts).where(eq(mailingListContacts.mailingListId, mailingListId));
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    let sent = 0;
    for (const contact of contacts) {
      try {
        await resend.emails.send({ from: process.env.EMAIL_FROM || "noreply@marketspas.pro", to: contact.email, subject, html: htmlContent });
        sent++;
      } catch (e) { /* skip failed */ }
    }
    return res.json({ success: true, type: "broadcast", sent, total: contacts.length });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/newsletters/schedule
router.post("/api/mobile/admin/newsletters/schedule", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subject, htmlContent, mailingListId, scheduledAt } = req.body;
    if (!subject || !htmlContent || !scheduledAt) return res.status(400).json({ error: "VALIDATION_ERROR" });
    const { getDb } = await import("../db");
    const { scheduledNewsletters } = await import("../../drizzle/schema");
    const db = await getDb();
    const [newsletter] = await db.insert(scheduledNewsletters).values({
      subject, htmlContent, mailingListId, scheduledAt: new Date(scheduledAt),
      createdBy: parseInt(req.mobileUser!.sub),
    }).returning();
    return res.json({ newsletter });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/newsletters/scheduled/:id
router.delete("/api/mobile/admin/newsletters/scheduled/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { scheduledNewsletters } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(scheduledNewsletters).where(eq(scheduledNewsletters.id, id));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN MAILING LISTS
// ============================================

// GET /api/mobile/admin/mailing-lists
router.get("/api/mobile/admin/mailing-lists", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { mailingLists, mailingListContacts } = await import("../../drizzle/schema");
    const { sql, eq } = await import("drizzle-orm");
    const db = await getDb();
    const lists = await db.select({
      id: mailingLists.id, name: mailingLists.name, description: mailingLists.description,
      createdAt: mailingLists.createdAt,
      contactCount: sql<number>`(SELECT COUNT(*) FROM mailing_list_contacts WHERE mailing_list_id = ${mailingLists.id})`,
    }).from(mailingLists);
    return res.json({ mailingLists: lists });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/mailing-lists
router.post("/api/mobile/admin/mailing-lists", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "VALIDATION_ERROR" });
    const { getDb } = await import("../db");
    const { mailingLists } = await import("../../drizzle/schema");
    const db = await getDb();
    const [list] = await db.insert(mailingLists).values({ name, description }).returning();
    return res.json({ mailingList: list });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/mailing-lists/:id
router.put("/api/mobile/admin/mailing-lists/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { mailingLists } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(mailingLists).set(req.body).where(eq(mailingLists.id, listId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/mailing-lists/:id
router.delete("/api/mobile/admin/mailing-lists/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { mailingLists, mailingListContacts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(mailingListContacts).where(eq(mailingListContacts.mailingListId, listId));
    await db.delete(mailingLists).where(eq(mailingLists.id, listId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/mailing-lists/:id/contacts
router.get("/api/mobile/admin/mailing-lists/:id/contacts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { mailingListContacts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const contacts = await db.select().from(mailingListContacts).where(eq(mailingListContacts.mailingListId, listId));
    return res.json({ contacts });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/mailing-lists/:id/contacts
router.post("/api/mobile/admin/mailing-lists/:id/contacts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listId = parseInt(req.params.id);
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: "VALIDATION_ERROR" });
    const { getDb } = await import("../db");
    const { mailingListContacts } = await import("../../drizzle/schema");
    const db = await getDb();
    const [contact] = await db.insert(mailingListContacts).values({ mailingListId: listId, email, name }).returning();
    return res.json({ contact });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/mailing-lists/:id/contacts/bulk
router.post("/api/mobile/admin/mailing-lists/:id/contacts/bulk", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listId = parseInt(req.params.id);
    const { contacts } = req.body; // [{ email, name }]
    if (!Array.isArray(contacts)) return res.status(400).json({ error: "VALIDATION_ERROR" });
    const { getDb } = await import("../db");
    const { mailingListContacts } = await import("../../drizzle/schema");
    const db = await getDb();
    const inserted = await db.insert(mailingListContacts).values(
      contacts.map((c: any) => ({ mailingListId: listId, email: c.email, name: c.name }))
    ).returning();
    return res.json({ contacts: inserted, count: inserted.length });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/mailing-lists/:listId/contacts/:contactId
router.delete("/api/mobile/admin/mailing-lists/:listId/contacts/:contactId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contactId = parseInt(req.params.contactId);
    const { getDb } = await import("../db");
    const { mailingListContacts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(mailingListContacts).where(eq(mailingListContacts.id, contactId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN RESOURCES - EXTENDED
// ============================================

// GET /api/mobile/admin/resources
router.get("/api/mobile/admin/resources", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getAllResources } = await import("../db");
    const resources = await getAllResources();
    return res.json({ resources });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/resources/:id/move
router.put("/api/mobile/admin/resources/:id/move", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resourceId = parseInt(req.params.id);
    const { folderId } = req.body;
    const { getDb } = await import("../db");
    const { resources } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(resources).set({ folderId: folderId || null }).where(eq(resources.id, resourceId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/media-folders
router.post("/api/mobile/admin/media-folders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, parentId } = req.body;
    if (!name) return res.status(400).json({ error: "VALIDATION_ERROR" });
    const { getDb } = await import("../db");
    const { mediaFolders } = await import("../../drizzle/schema");
    const db = await getDb();
    const [folder] = await db.insert(mediaFolders).values({ name, parentId: parentId || null }).returning();
    return res.json({ folder });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/media-folders/:id
router.put("/api/mobile/admin/media-folders/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const folderId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { mediaFolders } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(mediaFolders).set(req.body).where(eq(mediaFolders.id, folderId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/media-folders/:id
router.delete("/api/mobile/admin/media-folders/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const folderId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { mediaFolders } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(mediaFolders).where(eq(mediaFolders.id, folderId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/tech-folders
router.get("/api/mobile/admin/tech-folders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { techFolders } = await import("../../drizzle/schema");
    const db = await getDb();
    const folders = await db.select().from(techFolders);
    return res.json({ folders });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/admin/tech-folders
router.post("/api/mobile/admin/tech-folders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "VALIDATION_ERROR" });
    const { getDb } = await import("../db");
    const { techFolders } = await import("../../drizzle/schema");
    const db = await getDb();
    const [folder] = await db.insert(techFolders).values({ name, description }).returning();
    return res.json({ folder });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/tech-folders/:id
router.put("/api/mobile/admin/tech-folders/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const folderId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { techFolders } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(techFolders).set(req.body).where(eq(techFolders.id, folderId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/tech-folders/:id
router.delete("/api/mobile/admin/tech-folders/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const folderId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { techFolders } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(techFolders).where(eq(techFolders.id, folderId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/technical-resources
router.get("/api/mobile/admin/technical-resources", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { technicalResources } = await import("../../drizzle/schema");
    const db = await getDb();
    const items = await db.select().from(technicalResources);
    return res.json({ resources: items });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/technical-resources/:id
router.put("/api/mobile/admin/technical-resources/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resourceId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { technicalResources } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(technicalResources).set(req.body).where(eq(technicalResources.id, resourceId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/technical-resources/:id
router.delete("/api/mobile/admin/technical-resources/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resourceId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { technicalResources } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(technicalResources).where(eq(technicalResources.id, resourceId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN SHIPPING ZONES - EXTENDED
// ============================================

// POST /api/mobile/admin/shipping-zones
router.post("/api/mobile/admin/shipping-zones", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { shippingZones } = await import("../../drizzle/schema");
    const db = await getDb();
    const [zone] = await db.insert(shippingZones).values(req.body).returning();
    return res.json({ zone });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/admin/shipping-zones/:id
router.put("/api/mobile/admin/shipping-zones/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const zoneId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { shippingZones } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(shippingZones).set(req.body).where(eq(shippingZones.id, zoneId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/admin/shipping-zones/:id
router.delete("/api/mobile/admin/shipping-zones/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const zoneId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { shippingZones } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(shippingZones).where(eq(shippingZones.id, zoneId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN ANALYTICS & REPORTS
// ============================================

// GET /api/mobile/admin/analytics/ga4
router.get("/api/mobile/admin/analytics/ga4", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, metrics, dimensions } = req.query;
    // Forward to GA4 API if configured
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) return res.status(400).json({ error: "NOT_CONFIGURED", message: "GA4 non configur\u00e9" });
    // Return placeholder - actual GA4 integration uses the tRPC route
    return res.json({ configured: true, propertyId, message: "Utilisez le dashboard web pour les rapports GA4 d\u00e9taill\u00e9s" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/analytics/meta-ads
router.get("/api/mobile/admin/analytics/meta-ads", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { adAccounts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const accounts = await db.select().from(adAccounts).where(eq(adAccounts.platform, "meta"));
    return res.json({ accounts, configured: accounts.length > 0 });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/analytics/google-ads
router.get("/api/mobile/admin/analytics/google-ads", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { adAccounts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const accounts = await db.select().from(adAccounts).where(eq(adAccounts.platform, "google"));
    return res.json({ accounts, configured: accounts.length > 0 });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/analytics/shopify
router.get("/api/mobile/admin/analytics/shopify", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configured = !!(process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_CLIENT_ID);
    return res.json({ configured, storeDomain: process.env.SHOPIFY_STORE_DOMAIN || null });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

export const mobileApiAdminRouter = router;
