/**
 * Mobile API - User Endpoints (compléments)
 * Profil, Panier, Favoris, Recherche, Commandes avancées, Retours,
 * SAV détail, Pièces détachées, Modèles spa, Ressources techniques,
 * Forum, Équipe, Préférences notifications, Leads stats, Zones livraison, Onboarding
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

const router = Router();

// Apply auth middleware to all user routes
router.use("/api/mobile/v1", requireMobileAuth);

// ============================================
// PROFILE
// ============================================

// GET /api/mobile/v1/profile
router.get("/api/mobile/v1/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "NOT_FOUND", message: "Utilisateur introuvable" });
    return res.json({ profile: user });
  } catch (err: any) {
    console.error("[Mobile API] Profile get error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/v1/profile
router.put("/api/mobile/v1/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { name, phone, avatarUrl } = req.body;
    const { getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    await db.update(users).set(updateData).where(eq(users.id, userId));
    return res.json({ success: true, message: "Profil mis à jour" });
  } catch (err: any) {
    console.error("[Mobile API] Profile update error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/v1/partner/profile
router.put("/api/mobile/v1/partner/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = req.mobileUser!.partnerId;
    if (!partnerId) return res.status(400).json({ error: "NO_PARTNER", message: "Aucun partenaire associé" });
    const { companyName, tradeName, website, primaryContactName, primaryContactEmail, primaryContactPhone, addressStreet, addressCity, addressPostalCode, addressCountry } = req.body;
    const { updatePartner } = await import("../db");
    const updateData: Record<string, any> = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (tradeName !== undefined) updateData.tradeName = tradeName;
    if (website !== undefined) updateData.website = website;
    if (primaryContactName !== undefined) updateData.primaryContactName = primaryContactName;
    if (primaryContactEmail !== undefined) updateData.primaryContactEmail = primaryContactEmail;
    if (primaryContactPhone !== undefined) updateData.primaryContactPhone = primaryContactPhone;
    if (addressStreet !== undefined) updateData.addressStreet = addressStreet;
    if (addressCity !== undefined) updateData.addressCity = addressCity;
    if (addressPostalCode !== undefined) updateData.addressPostalCode = addressPostalCode;
    if (addressCountry !== undefined) updateData.addressCountry = addressCountry;
    await updatePartner(partnerId, updateData);
    return res.json({ success: true, message: "Profil partenaire mis à jour" });
  } catch (err: any) {
    console.error("[Mobile API] Partner profile update error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// CART
// ============================================

// GET /api/mobile/v1/cart
router.get("/api/mobile/v1/cart", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { getCart } = await import("../db");
    const cart = await getCart(userId);
    return res.json({ cart });
  } catch (err: any) {
    console.error("[Mobile API] Cart get error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/v1/cart
router.post("/api/mobile/v1/cart", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { productId, quantity, isPreorder, variantId } = req.body;
    if (!productId || !quantity) return res.status(400).json({ error: "MISSING_FIELDS", message: "productId et quantity requis" });
    const { addToCart } = await import("../db");
    const result = await addToCart(userId, productId, quantity, isPreorder || false, variantId);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[Mobile API] Cart add error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/v1/cart/:productId
router.put("/api/mobile/v1/cart/:productId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const productId = parseInt(req.params.productId);
    const { quantity, variantId } = req.body;
    if (quantity === undefined) return res.status(400).json({ error: "MISSING_FIELDS", message: "quantity requis" });
    const { updateCartQuantity } = await import("../db");
    const result = await updateCartQuantity(userId, productId, quantity, variantId);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[Mobile API] Cart update error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/v1/cart/:productId
router.delete("/api/mobile/v1/cart/:productId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const productId = parseInt(req.params.productId);
    const variantId = req.query.variantId ? parseInt(req.query.variantId as string) : undefined;
    const { removeFromCart } = await import("../db");
    await removeFromCart(userId, productId, variantId);
    return res.json({ success: true, message: "Article retiré du panier" });
  } catch (err: any) {
    console.error("[Mobile API] Cart remove error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/v1/cart
router.delete("/api/mobile/v1/cart", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { clearCart } = await import("../db");
    await clearCart(userId);
    return res.json({ success: true, message: "Panier vidé" });
  } catch (err: any) {
    console.error("[Mobile API] Cart clear error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/v1/cart/available/:productId
router.get("/api/mobile/v1/cart/available/:productId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const variantId = req.query.variantId ? parseInt(req.query.variantId as string) : undefined;
    const { getAvailableQuantity } = await import("../db");
    const result = await getAvailableQuantity(productId, variantId);
    return res.json(result);
  } catch (err: any) {
    console.error("[Mobile API] Available quantity error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// PRODUCT FAVORITES
// ============================================

// GET /api/mobile/v1/favorites
router.get("/api/mobile/v1/favorites", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { getFavorites } = await import("../db");
    const favorites = await getFavorites(userId);
    return res.json({ favorites });
  } catch (err: any) {
    console.error("[Mobile API] Favorites get error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/v1/favorites/:productId
router.post("/api/mobile/v1/favorites/:productId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const productId = parseInt(req.params.productId);
    const { addToFavorites } = await import("../db");
    await addToFavorites(userId, productId);
    return res.json({ success: true, message: "Ajouté aux favoris" });
  } catch (err: any) {
    console.error("[Mobile API] Favorite add error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/v1/favorites/:productId
router.delete("/api/mobile/v1/favorites/:productId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const productId = parseInt(req.params.productId);
    const { removeFromFavorites } = await import("../db");
    await removeFromFavorites(userId, productId);
    return res.json({ success: true, message: "Retiré des favoris" });
  } catch (err: any) {
    console.error("[Mobile API] Favorite remove error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/v1/favorites/:productId/check
router.get("/api/mobile/v1/favorites/:productId/check", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const productId = parseInt(req.params.productId);
    const { isFavorite } = await import("../db");
    const result = await isFavorite(userId, productId);
    return res.json({ isFavorite: result });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// PRODUCT SEARCH
// ============================================

// GET /api/mobile/v1/products/search
router.get("/api/mobile/v1/products/search", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = (req.query.q as string || "").trim();
    if (!query || query.length < 2) return res.json({ products: [] });
    const { getDb } = await import("../db");
    const { products } = await import("../../drizzle/schema");
    const { like, or, eq } = await import("drizzle-orm");
    const db = await getDb();
    const rows = await db.select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      category: products.category,
      priceHT: products.priceHT,
      imageUrl: products.imageUrl,
      inStock: products.inStock,
    }).from(products)
      .where(or(like(products.name, `%${query}%`), like(products.sku, `%${query}%`), like(products.brand, `%${query}%`)))
      .limit(20);
    return res.json({ products: rows });
  } catch (err: any) {
    console.error("[Mobile API] Product search error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ORDERS - ADVANCED
// ============================================

// POST /api/mobile/v1/orders/:id/cancel
router.post("/api/mobile/v1/orders/:id/cancel", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const partnerId = req.mobileUser!.partnerId;
    const { getDb } = await import("../db");
    const { orders } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");
    const db = await getDb();
    const conditions: any[] = [eq(orders.id, orderId)];
    if (partnerId) conditions.push(eq(orders.partnerId, partnerId));
    const [order] = await db.select().from(orders).where(and(...conditions)).limit(1);
    if (!order) return res.status(404).json({ error: "NOT_FOUND", message: "Commande introuvable" });
    const cancellableStatuses = ["PENDING_APPROVAL", "PENDING_DEPOSIT"];
    if (!cancellableStatuses.includes(order.status as string)) {
      return res.status(400).json({ error: "NOT_CANCELLABLE", message: "Cette commande ne peut plus être annulée" });
    }
    await db.update(orders).set({ status: "CANCELLED", updatedAt: new Date() }).where(eq(orders.id, orderId));
    return res.json({ success: true, message: "Commande annulée" });
  } catch (err: any) {
    console.error("[Mobile API] Order cancel error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});



// GET /api/mobile/v1/orders/export
router.get("/api/mobile/v1/orders/export", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = req.mobileUser!.partnerId;
    const { getDb } = await import("../db");
    const { orders, orderItems, products } = await import("../../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");
    const db = await getDb();
    const allOrders = partnerId
      ? await db.select().from(orders).where(eq(orders.partnerId, partnerId)).orderBy(desc(orders.createdAt))
      : [];
    const exportData = [];
    for (const order of allOrders) {
      const items = await db.select({
        productName: products.name,
        sku: products.sku,
        quantity: orderItems.quantity,
        unitPriceHT: orderItems.unitPriceHT,
        totalHT: orderItems.totalHT,
      }).from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));
      exportData.push({
        orderNumber: order.orderNumber,
        status: order.status,
        totalHT: order.totalHT,
        totalTTC: order.totalTTC,
        createdAt: order.createdAt,
        items,
      });
    }
    return res.json({ orders: exportData, total: exportData.length });
  } catch (err: any) {
    console.error("[Mobile API] Orders export error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// RETURNS
// ============================================

// GET /api/mobile/v1/returns
router.get("/api/mobile/v1/returns", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = req.mobileUser!.partnerId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const { getDb } = await import("../db");
    const { afterSalesServices } = await import("../../drizzle/schema");
    const { eq, desc, sql, and } = await import("drizzle-orm");
    const db = await getDb();
    // Returns are afterSalesServices with issueType containing "return" related types
    const conditions: any[] = [];
    if (partnerId) conditions.push(eq(afterSalesServices.partnerId, partnerId));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [rows, countResult] = await Promise.all([
      db.select().from(afterSalesServices).where(whereClause).orderBy(desc(afterSalesServices.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(afterSalesServices).where(whereClause),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return res.json({ returns: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    console.error("[Mobile API] Returns list error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/v1/returns/:id
router.get("/api/mobile/v1/returns/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const returnId = parseInt(req.params.id);
    const partnerId = req.mobileUser!.partnerId;
    const { getDb } = await import("../db");
    const { afterSalesServices, afterSalesNotes, afterSalesMedia, afterSalesStatusHistory } = await import("../../drizzle/schema");
    const { eq, and, desc } = await import("drizzle-orm");
    const db = await getDb();
    const conditions: any[] = [eq(afterSalesServices.id, returnId)];
    if (partnerId) conditions.push(eq(afterSalesServices.partnerId, partnerId));
    const [returnItem] = await db.select().from(afterSalesServices).where(and(...conditions)).limit(1);
    if (!returnItem) return res.status(404).json({ error: "NOT_FOUND", message: "Retour introuvable" });
    const [notes, media, history] = await Promise.all([
      db.select().from(afterSalesNotes).where(eq(afterSalesNotes.afterSalesId, returnId)).orderBy(desc(afterSalesNotes.createdAt)),
      db.select().from(afterSalesMedia).where(eq(afterSalesMedia.afterSalesId, returnId)),
      db.select().from(afterSalesStatusHistory).where(eq(afterSalesStatusHistory.afterSalesId, returnId)).orderBy(desc(afterSalesStatusHistory.createdAt)),
    ]);
    return res.json({ return: { ...returnItem, notes, media, history } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/v1/returns/:id/note
router.post("/api/mobile/v1/returns/:id/note", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const returnId = parseInt(req.params.id);
    const userId = parseInt(req.mobileUser!.sub);
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "MISSING_FIELDS", message: "Contenu requis" });
    const { getDb } = await import("../db");
    const { afterSalesNotes } = await import("../../drizzle/schema");
    const db = await getDb();
    await db.insert(afterSalesNotes).values({
      afterSalesId: returnId,
      userId,
      content,
      isInternal: false,
    });
    return res.json({ success: true, message: "Note ajoutée" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// SAV - EXTENDED DETAILS
// ============================================

// GET /api/mobile/v1/sav/:id/history
router.get("/api/mobile/v1/sav/:id/history", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const savId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { afterSalesStatusHistory } = await import("../../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");
    const db = await getDb();
    const history = await db.select().from(afterSalesStatusHistory).where(eq(afterSalesStatusHistory.afterSalesId, savId)).orderBy(desc(afterSalesStatusHistory.createdAt));
    return res.json({ history });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/v1/sav/:id/spare-parts
router.get("/api/mobile/v1/sav/:id/spare-parts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const savId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { savSpareParts, spareParts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const parts = await db.select({
      id: savSpareParts.id,
      quantity: savSpareParts.quantity,
      unitPrice: savSpareParts.unitPrice,
      sparePartId: savSpareParts.sparePartId,
      sparePartName: spareParts.name,
      sparePartSku: spareParts.sku,
      sparePartCategory: spareParts.category,
    }).from(savSpareParts)
      .leftJoin(spareParts, eq(savSpareParts.sparePartId, spareParts.id))
      .where(eq(savSpareParts.afterSalesId, savId));
    return res.json({ spareParts: parts });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/v1/sav/:id/note
router.post("/api/mobile/v1/sav/:id/note", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const savId = parseInt(req.params.id);
    const userId = parseInt(req.mobileUser!.sub);
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "MISSING_FIELDS", message: "Contenu requis" });
    const { getDb } = await import("../db");
    const { afterSalesNotes } = await import("../../drizzle/schema");
    const db = await getDb();
    await db.insert(afterSalesNotes).values({ afterSalesId: savId, userId, content, isInternal: false });
    return res.json({ success: true, message: "Note ajoutée" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/v1/sav/components
router.get("/api/mobile/v1/sav/components", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const brand = req.query.brand as string;
    if (!brand) return res.json({ components: [] });
    const { getDb } = await import("../db");
    const { afterSalesServices } = await import("../../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");
    const db = await getDb();
    const components = await db.selectDistinct({ component: afterSalesServices.component })
      .from(afterSalesServices)
      .where(eq(afterSalesServices.brand, brand as any));
    return res.json({ components: components.map(c => c.component).filter(Boolean) });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// SPARE PARTS
// ============================================

// GET /api/mobile/v1/spare-parts
router.get("/api/mobile/v1/spare-parts", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const { getDb } = await import("../db");
    const { spareParts } = await import("../../drizzle/schema");
    const { eq, like, or, and, sql } = await import("drizzle-orm");
    const db = await getDb();
    const conditions: any[] = [];
    if (category) conditions.push(eq(spareParts.category, category as any));
    if (search) conditions.push(or(like(spareParts.name, `%${search}%`), like(spareParts.sku, `%${search}%`)));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [rows, countResult] = await Promise.all([
      db.select().from(spareParts).where(whereClause).limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(spareParts).where(whereClause),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return res.json({ spareParts: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/v1/spare-parts/:id
router.get("/api/mobile/v1/spare-parts/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { spareParts, sparePartsCompatibility, spaModels } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [part] = await db.select().from(spareParts).where(eq(spareParts.id, partId)).limit(1);
    if (!part) return res.status(404).json({ error: "NOT_FOUND", message: "Pièce introuvable" });
    const compatibility = await db.select({
      modelId: sparePartsCompatibility.spaModelId,
      modelName: spaModels.name,
    }).from(sparePartsCompatibility)
      .leftJoin(spaModels, eq(sparePartsCompatibility.spaModelId, spaModels.id))
      .where(eq(sparePartsCompatibility.sparePartId, partId));
    return res.json({ sparePart: { ...part, compatibleModels: compatibility } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// SPA MODELS
// ============================================

// GET /api/mobile/v1/spa-models
router.get("/api/mobile/v1/spa-models", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { spaModels, spaModelSpareParts } = await import("../../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    const db = await getDb();
    const rows = await db.select({
      id: spaModels.id,
      name: spaModels.name,
      brand: spaModels.brand,
      imageUrl: spaModels.imageUrl,
      partCount: sql<number>`(SELECT COUNT(*) FROM spa_model_spare_parts WHERE spa_model_spare_parts.spa_model_id = ${spaModels.id})`,
    }).from(spaModels);
    return res.json({ models: rows });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/v1/spa-models/:id
router.get("/api/mobile/v1/spa-models/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const modelId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { spaModels, spaModelSpareParts, spareParts } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [model] = await db.select().from(spaModels).where(eq(spaModels.id, modelId)).limit(1);
    if (!model) return res.status(404).json({ error: "NOT_FOUND", message: "Modèle introuvable" });
    const parts = await db.select({
      id: spareParts.id,
      name: spareParts.name,
      sku: spareParts.sku,
      category: spareParts.category,
      price: spareParts.price,
      quantity: spaModelSpareParts.quantity,
    }).from(spaModelSpareParts)
      .leftJoin(spareParts, eq(spaModelSpareParts.sparePartId, spareParts.id))
      .where(eq(spaModelSpareParts.spaModelId, modelId));
    return res.json({ model: { ...model, spareParts: parts } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// TECHNICAL RESOURCES
// ============================================

// GET /api/mobile/v1/technical-resources
router.get("/api/mobile/v1/technical-resources", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const folderId = req.query.folderId ? parseInt(req.query.folderId as string) : undefined;
    const { getDb } = await import("../db");
    const { technicalResources, technicalResourceFolders } = await import("../../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");
    const db = await getDb();
    const [folders, resources] = await Promise.all([
      db.select().from(technicalResourceFolders),
      folderId
        ? db.select().from(technicalResources).where(eq(technicalResources.folderId, folderId)).orderBy(desc(technicalResources.createdAt))
        : db.select().from(technicalResources).orderBy(desc(technicalResources.createdAt)),
    ]);
    return res.json({ folders, resources });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/v1/technical-resources/:id
router.get("/api/mobile/v1/technical-resources/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const resourceId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { technicalResources } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [resource] = await db.select().from(technicalResources).where(eq(technicalResources.id, resourceId)).limit(1);
    if (!resource) return res.status(404).json({ error: "NOT_FOUND", message: "Ressource introuvable" });
    // Track download
    await db.update(technicalResources).set({ downloadCount: (resource.downloadCount || 0) + 1 }).where(eq(technicalResources.id, resourceId));
    return res.json({ resource });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// RESOURCE FAVORITES
// ============================================

// POST /api/mobile/v1/resources/:id/favorite
router.post("/api/mobile/v1/resources/:id/favorite", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const resourceId = parseInt(req.params.id);
    const { toggleResourceFavorite } = await import("../db");
    const result = await toggleResourceFavorite(userId, resourceId);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/v1/resources/favorites
router.get("/api/mobile/v1/resources/favorites", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { getUserFavoriteResources } = await import("../db");
    const favorites = await getUserFavoriteResources(userId);
    return res.json({ favorites });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// FORUM
// ============================================

// GET /api/mobile/v1/forum/topics
router.get("/api/mobile/v1/forum/topics", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const { getDb } = await import("../db");
    const { forumTopics, forumReplies, users } = await import("../../drizzle/schema");
    const { desc, sql, eq } = await import("drizzle-orm");
    const db = await getDb();
    const [topics, countResult] = await Promise.all([
      db.select({
        id: forumTopics.id,
        title: forumTopics.title,
        content: forumTopics.content,
        authorId: forumTopics.authorId,
        authorName: users.name,
        isResolved: forumTopics.isResolved,
        createdAt: forumTopics.createdAt,
        replyCount: sql<number>`(SELECT COUNT(*) FROM forum_replies WHERE forum_replies.topic_id = ${forumTopics.id})`,
      }).from(forumTopics)
        .leftJoin(users, eq(forumTopics.authorId, users.id))
        .orderBy(desc(forumTopics.createdAt))
        .limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(forumTopics),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return res.json({ topics, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/v1/forum/topics/:id
router.get("/api/mobile/v1/forum/topics/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const topicId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { forumTopics, forumReplies, users } = await import("../../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");
    const db = await getDb();
    const [topic] = await db.select({
      id: forumTopics.id,
      title: forumTopics.title,
      content: forumTopics.content,
      authorId: forumTopics.authorId,
      authorName: users.name,
      isResolved: forumTopics.isResolved,
      createdAt: forumTopics.createdAt,
    }).from(forumTopics)
      .leftJoin(users, eq(forumTopics.authorId, users.id))
      .where(eq(forumTopics.id, topicId)).limit(1);
    if (!topic) return res.status(404).json({ error: "NOT_FOUND", message: "Sujet introuvable" });
    const replies = await db.select({
      id: forumReplies.id,
      content: forumReplies.content,
      authorId: forumReplies.authorId,
      authorName: users.name,
      isHelpful: forumReplies.isHelpful,
      createdAt: forumReplies.createdAt,
    }).from(forumReplies)
      .leftJoin(users, eq(forumReplies.authorId, users.id))
      .where(eq(forumReplies.topicId, topicId))
      .orderBy(desc(forumReplies.createdAt));
    return res.json({ topic: { ...topic, replies } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/v1/forum/topics
router.post("/api/mobile/v1/forum/topics", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: "MISSING_FIELDS", message: "Titre et contenu requis" });
    const { getDb } = await import("../db");
    const { forumTopics } = await import("../../drizzle/schema");
    const db = await getDb();
    const [inserted] = await db.insert(forumTopics).values({ title, content, authorId: userId }).$returningId();
    return res.json({ success: true, topicId: inserted.id, message: "Sujet créé" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/v1/forum/topics/:id/reply
router.post("/api/mobile/v1/forum/topics/:id/reply", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const topicId = parseInt(req.params.id);
    const userId = parseInt(req.mobileUser!.sub);
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "MISSING_FIELDS", message: "Contenu requis" });
    const { getDb } = await import("../db");
    const { forumReplies } = await import("../../drizzle/schema");
    const db = await getDb();
    await db.insert(forumReplies).values({ topicId, authorId: userId, content });
    return res.json({ success: true, message: "Réponse ajoutée" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// TEAM
// ============================================

// GET /api/mobile/v1/team
router.get("/api/mobile/v1/team", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = req.mobileUser!.partnerId;
    if (!partnerId) return res.json({ members: [], invitations: [] });
    const { getDb } = await import("../db");
    const { teamMembers, teamInvitations, users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [members, invitations] = await Promise.all([
      db.select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        userName: users.name,
        userEmail: users.email,
        role: teamMembers.role,
        createdAt: teamMembers.createdAt,
      }).from(teamMembers)
        .leftJoin(users, eq(teamMembers.userId, users.id))
        .where(eq(teamMembers.partnerId, partnerId)),
      db.select().from(teamInvitations).where(eq(teamInvitations.partnerId, partnerId)),
    ]);
    return res.json({ members, invitations });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/v1/team/permissions
router.get("/api/mobile/v1/team/permissions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const partnerId = req.mobileUser!.partnerId;
    if (!partnerId) return res.json({ permissions: null });
    const { getDb } = await import("../db");
    const { teamMembers } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");
    const db = await getDb();
    const [member] = await db.select().from(teamMembers)
      .where(and(eq(teamMembers.userId, userId), eq(teamMembers.partnerId, partnerId))).limit(1);
    return res.json({ permissions: member || null });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

// GET /api/mobile/v1/notification-preferences
router.get("/api/mobile/v1/notification-preferences", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { getDb } = await import("../db");
    const { notificationPreferences } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [prefs] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
    return res.json({ preferences: prefs || null });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/v1/notification-preferences
router.put("/api/mobile/v1/notification-preferences", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { getDb } = await import("../db");
    const { notificationPreferences } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [existing] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
    const updateData = { ...req.body, userId, updatedAt: new Date() };
    if (existing) {
      await db.update(notificationPreferences).set(updateData).where(eq(notificationPreferences.userId, userId));
    } else {
      await db.insert(notificationPreferences).values(updateData);
    }
    return res.json({ success: true, message: "Préférences mises à jour" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// LEADS - EXTENDED
// ============================================

// GET /api/mobile/v1/leads/stats
router.get("/api/mobile/v1/leads/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = req.mobileUser!.partnerId;
    // SECURITY: Si pas de partnerId, retourner des stats vides (pas de fuite de données)
    if (!partnerId) {
      return res.json({ stats: [], total: 0 });
    }
    const { getDb } = await import("../db");
    const { leads } = await import("../../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");
    const db = await getDb();
    const stats = await db.select({
      status: leads.status,
      count: sql<number>`COUNT(*)`,
    }).from(leads).where(eq(leads.assignedPartnerId, partnerId)).groupBy(leads.status);
    const total = stats.reduce((sum, s) => sum + Number(s.count), 0);
    return res.json({ stats, total });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// SHIPPING ZONES
// ============================================

// GET /api/mobile/v1/shipping-zones/lookup
router.get("/api/mobile/v1/shipping-zones/lookup", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const postalCode = req.query.postalCode as string;
    const country = req.query.country as string;
    if (!postalCode || !country) return res.status(400).json({ error: "MISSING_FIELDS", message: "postalCode et country requis" });
    const { getDb } = await import("../db");
    const { shippingZones } = await import("../../drizzle/schema");
    const { eq, and, lte, gte } = await import("drizzle-orm");
    const db = await getDb();
    const zones = await db.select().from(shippingZones)
      .where(and(
        eq(shippingZones.countryCode, country.toUpperCase()),
        lte(shippingZones.postalCodeFrom, postalCode),
        gte(shippingZones.postalCodeTo, postalCode),
      ));
    return res.json({ zones });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ONBOARDING
// ============================================

// GET /api/mobile/v1/onboarding
router.get("/api/mobile/v1/onboarding", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [user] = await db.select({ completedOnboarding: users.completedOnboarding }).from(users).where(eq(users.id, userId)).limit(1);
    return res.json({ completedOnboarding: user?.completedOnboarding ?? false });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/v1/onboarding/complete
router.post("/api/mobile/v1/onboarding/complete", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { getDb } = await import("../db");
    const { users } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.update(users).set({ completedOnboarding: true, updatedAt: new Date() }).where(eq(users.id, userId));
    return res.json({ success: true, message: "Onboarding complété" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// SAVED ROUTES
// ============================================

// GET /api/mobile/v1/saved-routes
router.get("/api/mobile/v1/saved-routes", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { getSavedRoutes } = await import("../db");
    const routes = await getSavedRoutes(userId);
    return res.json({ routes });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/v1/saved-routes/:id
router.get("/api/mobile/v1/saved-routes/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const routeId = parseInt(req.params.id);
    const { getSavedRouteById } = await import("../db");
    const route = await getSavedRouteById(routeId, userId);
    if (!route) return res.status(404).json({ error: "NOT_FOUND", message: "Route introuvable" });
    return res.json({ route });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// POST /api/mobile/v1/saved-routes
router.post("/api/mobile/v1/saved-routes", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { name, type, points, totalDistance, totalDuration, notes } = req.body;
    if (!name || !type || !points) return res.status(400).json({ error: "MISSING_FIELDS", message: "name, type et points requis" });
    const { createSavedRoute } = await import("../db");
    const route = await createSavedRoute({ userId, name, type, points, totalDistance, totalDuration, notes });
    return res.json({ success: true, route });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PUT /api/mobile/v1/saved-routes/:id
router.put("/api/mobile/v1/saved-routes/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const routeId = parseInt(req.params.id);
    const { name, points, totalDistance, totalDuration, notes } = req.body;
    const { updateSavedRoute } = await import("../db");
    await updateSavedRoute(routeId, userId, { name, points, totalDistance, totalDuration, notes });
    return res.json({ success: true, message: "Route mise à jour" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// DELETE /api/mobile/v1/saved-routes/:id
router.delete("/api/mobile/v1/saved-routes/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const routeId = parseInt(req.params.id);
    const { deleteSavedRoute } = await import("../db");
    await deleteSavedRoute(routeId, userId);
    return res.json({ success: true, message: "Route supprimée" });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// MEDIA FOLDERS
// ============================================

// GET /api/mobile/v1/media-folders
router.get("/api/mobile/v1/media-folders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { mediaFolders } = await import("../../drizzle/schema");
    const db = await getDb();
    const folders = await db.select().from(mediaFolders);
    return res.json({ folders });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

export const mobileApiUserRouter = router;
