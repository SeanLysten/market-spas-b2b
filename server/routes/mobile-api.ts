/**
 * Mobile-optimized REST API endpoints
 * 
 * These endpoints return data aligned with the web tRPC routes,
 * optimized for mobile bandwidth with pagination.
 * All /v1/ routes require Bearer token authentication.
 * 
 * Base path: /api/mobile/
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { verifyMobileAccessToken } from "./mobile-auth";

const router = Router();

// ============================================
// AUTH MIDDLEWARE
// ============================================
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
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Token d'accès requis" });
  }

  const token = authHeader.slice(7);
  const payload = await verifyMobileAccessToken(token);

  if (!payload) {
    return res.status(401).json({ error: "INVALID_TOKEN", message: "Token invalide ou expiré" });
  }

  req.mobileUser = payload;
  next();
}

// Apply auth middleware to all /api/mobile/v1/* routes
router.use("/api/mobile/v1", requireMobileAuth);

// ============================================
// GET /api/mobile/v1/dashboard
// Lightweight dashboard data for the home screen
// ============================================
router.get("/api/mobile/v1/dashboard", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const partnerId = req.mobileUser!.partnerId;

    const { getDb } = await import("../db");
    const { orders, notifications, resources, events, partners } = await import("../../drizzle/schema");
    const { eq, and, desc, sql, gte } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    // Parallel queries for dashboard data
    const [
      recentOrders,
      unreadNotifications,
      recentResources,
      upcomingEvents,
      partnerInfo,
    ] = await Promise.all([
      // Recent orders (last 5)
      partnerId
        ? drizzleDb
            .select({
              id: orders.id,
              orderNumber: orders.orderNumber,
              status: orders.status,
              totalHT: orders.totalHT,
              totalTTC: orders.totalTTC,
              depositPaid: orders.depositPaid,
              createdAt: orders.createdAt,
            })
            .from(orders)
            .where(eq(orders.partnerId, partnerId))
            .orderBy(desc(orders.createdAt))
            .limit(5)
        : Promise.resolve([]),

      // Unread notification count
      drizzleDb
        .select({ count: sql<number>`COUNT(*)` })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        ),

      // Latest resources (last 10)
      drizzleDb
        .select({
          id: resources.id,
          title: resources.title,
          fileType: resources.fileType,
          fileSize: resources.fileSize,
          thumbnailUrl: resources.thumbnailUrl,
          createdAt: resources.createdAt,
        })
        .from(resources)
        .orderBy(desc(resources.createdAt))
        .limit(10),

      // Upcoming events (published only)
      drizzleDb
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          type: events.type,
          startDate: events.startDate,
          endDate: events.endDate,
          allDay: events.allDay,
          imageUrl: events.imageUrl,
          discountPercent: events.discountPercent,
          promoCode: events.promoCode,
        })
        .from(events)
        .where(
          and(
            gte(events.endDate, new Date()),
            eq(events.isPublished, true)
          )
        )
        .orderBy(events.startDate)
        .limit(5),

      // Partner info
      partnerId
        ? drizzleDb
            .select({
              id: partners.id,
              companyName: partners.companyName,
              partnerLevel: partners.partnerLevel,
              partnerStatus: partners.partnerStatus,
            })
            .from(partners)
            .where(eq(partners.id, partnerId))
            .limit(1)
        : Promise.resolve([]),
    ]);

    return res.json({
      orders: recentOrders,
      unreadNotificationCount: unreadNotifications[0]?.count || 0,
      resources: recentResources.map((r) => ({
        ...r,
        thumbnailUrl: r.thumbnailUrl || (r.fileType?.startsWith("image/") ? `/api/resources/thumbnail/${r.id}` : null),
      })),
      events: upcomingEvents,
      partner: partnerInfo[0] || null,
    });
  } catch (err) {
    console.error("[Mobile API] Dashboard error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// GET /api/mobile/v1/products
// Paginated product catalog (same data as web)
// ============================================
router.get("/api/mobile/v1/products", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;
    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "";

    const { getDb } = await import("../db");
    const { products } = await import("../../drizzle/schema");
    const { desc, sql, like, eq, and } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    // Build where conditions
    const conditions: any[] = [eq(products.isActive, true)];
    if (search) {
      conditions.push(like(products.name, `%${search}%`));
    }
    if (category) {
      conditions.push(eq(products.category, category as any));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [productList, countResult] = await Promise.all([
      drizzleDb
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          category: products.category,
          shortDescription: products.shortDescription,
          pricePublicHT: products.pricePublicHT,
          pricePartnerHT: products.pricePartnerHT,
          vatRate: products.vatRate,
          stockQuantity: products.stockQuantity,
          inTransitQuantity: products.inTransitQuantity,
          imageUrl: products.imageUrl,
          isFeatured: products.isFeatured,
          isVisible: products.isVisible,
          weight: products.weight,
          sortOrder: products.sortOrder,
        })
        .from(products)
        .where(whereClause)
        .orderBy(products.sortOrder, desc(products.createdAt))
        .limit(limit)
        .offset(offset),

      drizzleDb
        .select({ count: sql<number>`COUNT(*)` })
        .from(products)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count || 0;

    return res.json({
      products: productList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    console.error("[Mobile API] Products error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// GET /api/mobile/v1/products/:id
// Single product detail with variants (same as web)
// ============================================
router.get("/api/mobile/v1/products/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const partnerId = req.mobileUser!.partnerId;

    const { getDb, getProductVariants } = await import("../db");
    const { products, partnerProductDiscounts } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    const [product] = await drizzleDb
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        category: products.category,
        type: products.type,
        shortDescription: products.shortDescription,
        description: products.description,
        pricePublicHT: products.pricePublicHT,
        pricePartnerHT: products.pricePartnerHT,
        vatRate: products.vatRate,
        costPrice: products.costPrice,
        trackStock: products.trackStock,
        stockQuantity: products.stockQuantity,
        stockReserved: products.stockReserved,
        inTransitQuantity: products.inTransitQuantity,
        lowStockThreshold: products.lowStockThreshold,
        weight: products.weight,
        length: products.length,
        width: products.width,
        height: products.height,
        imageUrl: products.imageUrl,
        supplierProductCode: products.supplierProductCode,
        ean13: products.ean13,
        isActive: products.isActive,
        isVisible: products.isVisible,
        isFeatured: products.isFeatured,
        sortOrder: products.sortOrder,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Produit non trouvé" });
    }

    // Get variants with options (same as web tRPC getProductVariants)
    const variants = await getProductVariants(productId);

    // Get partner-specific discount if applicable
    let discount = null;
    if (partnerId) {
      const [d] = await drizzleDb
        .select({
          discountPercent: partnerProductDiscounts.discountPercent,
        })
        .from(partnerProductDiscounts)
        .where(
          and(
            eq(partnerProductDiscounts.partnerId, partnerId),
            eq(partnerProductDiscounts.productId, productId)
          )
        )
        .limit(1);
      discount = d || null;
    }

    return res.json({
      product,
      variants,
      discount,
    });
  } catch (err) {
    console.error("[Mobile API] Product detail error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// GET /api/mobile/v1/orders
// Paginated orders for the partner
// ============================================
router.get("/api/mobile/v1/orders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = req.mobileUser!.partnerId;
    if (!partnerId) {
      return res.json({ orders: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false } });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;
    const status = (req.query.status as string) || "";

    const { getDb } = await import("../db");
    const { orders } = await import("../../drizzle/schema");
    const { eq, and, desc, sql } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    const conditions: any[] = [eq(orders.partnerId, partnerId)];
    if (status) {
      conditions.push(eq(orders.status, status as any));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [orderList, countResult] = await Promise.all([
      drizzleDb
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          subtotalHT: orders.subtotalHT,
          discountAmount: orders.discountAmount,
          shippingHT: orders.shippingHT,
          totalHT: orders.totalHT,
          totalVAT: orders.totalVAT,
          totalTTC: orders.totalTTC,
          depositAmount: orders.depositAmount,
          depositPaid: orders.depositPaid,
          depositPaidAt: orders.depositPaidAt,
          balanceAmount: orders.balanceAmount,
          balancePaid: orders.balancePaid,
          currency: orders.currency,
          trackingNumber: orders.trackingNumber,
          trackingUrl: orders.trackingUrl,
          shippingCarrier: orders.shippingCarrier,
          shippedAt: orders.shippedAt,
          deliveredAt: orders.deliveredAt,
          deliveryRequestedWeek: orders.deliveryRequestedWeek,
          customerNotes: orders.customerNotes,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),

      drizzleDb
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count || 0;

    return res.json({
      orders: orderList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    console.error("[Mobile API] Orders error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// GET /api/mobile/v1/orders/:id
// Single order detail with items (same as web getOrderWithItems)
// ============================================
router.get("/api/mobile/v1/orders/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const partnerId = req.mobileUser!.partnerId;

    const { getOrderWithItems } = await import("../db");

    const order = await getOrderWithItems(orderId);

    if (!order) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Commande non trouvée" });
    }

    // Security: only allow access to own partner's orders
    if (partnerId && order.partnerId !== partnerId) {
      return res.status(403).json({ error: "FORBIDDEN", message: "Accès non autorisé" });
    }

    return res.json({ order });
  } catch (err) {
    console.error("[Mobile API] Order detail error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// GET /api/mobile/v1/notifications
// Paginated notifications
// ============================================
router.get("/api/mobile/v1/notifications", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);
    const offset = (page - 1) * limit;

    const { getDb } = await import("../db");
    const { notifications } = await import("../../drizzle/schema");
    const { eq, desc, sql } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    const [notifList, countResult] = await Promise.all([
      drizzleDb
        .select({
          id: notifications.id,
          title: notifications.title,
          message: notifications.message,
          type: notifications.type,
          isRead: notifications.isRead,
          readAt: notifications.readAt,
          linkUrl: notifications.linkUrl,
          linkText: notifications.linkText,
          orderId: notifications.orderId,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),

      drizzleDb
        .select({ count: sql<number>`COUNT(*)` })
        .from(notifications)
        .where(eq(notifications.userId, userId)),
    ]);

    const total = countResult[0]?.count || 0;

    return res.json({
      notifications: notifList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    console.error("[Mobile API] Notifications error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// POST /api/mobile/v1/notifications/mark-read
// Mark notifications as read
// ============================================
router.post("/api/mobile/v1/notifications/mark-read", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const { ids } = req.body;

    const { getDb } = await import("../db");
    const { notifications } = await import("../../drizzle/schema");
    const { eq, and, inArray } = await import("drizzle-orm");

    const drizzleDb = await getDb();
    const now = new Date();

    if (ids === "all") {
      await drizzleDb
        .update(notifications)
        .set({ isRead: true, readAt: now })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        );
    } else if (Array.isArray(ids) && ids.length > 0) {
      await drizzleDb
        .update(notifications)
        .set({ isRead: true, readAt: now })
        .where(
          and(
            eq(notifications.userId, userId),
            inArray(notifications.id, ids)
          )
        );
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("[Mobile API] Mark read error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// GET /api/mobile/v1/resources
// Paginated resources with folder navigation (same as web listByFolder)
// ============================================
router.get("/api/mobile/v1/resources", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const folderId = req.query.folderId ? parseInt(req.query.folderId as string) : null;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);
    const offset = (page - 1) * limit;

    const { getDb } = await import("../db");
    const { resources, mediaFolders } = await import("../../drizzle/schema");
    const { eq, desc, sql, isNull } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    // Get subfolders
    const subfolders = await drizzleDb
      .select({
        id: mediaFolders.id,
        name: mediaFolders.name,
        parentId: mediaFolders.parentId,
        sortOrder: mediaFolders.sortOrder,
      })
      .from(mediaFolders)
      .where(
        folderId
          ? eq(mediaFolders.parentId, folderId)
          : isNull(mediaFolders.parentId)
      )
      .orderBy(mediaFolders.sortOrder);

    // Get current folder info (for breadcrumb)
    let currentFolder = null;
    if (folderId) {
      const [folder] = await drizzleDb
        .select({
          id: mediaFolders.id,
          name: mediaFolders.name,
          parentId: mediaFolders.parentId,
        })
        .from(mediaFolders)
        .where(eq(mediaFolders.id, folderId))
        .limit(1);
      currentFolder = folder || null;
    }

    // Build breadcrumb path
    const breadcrumb: { id: number; name: string }[] = [];
    if (currentFolder) {
      let current = currentFolder;
      breadcrumb.unshift({ id: current.id, name: current.name });
      while (current.parentId) {
        const [parent] = await drizzleDb
          .select({
            id: mediaFolders.id,
            name: mediaFolders.name,
            parentId: mediaFolders.parentId,
          })
          .from(mediaFolders)
          .where(eq(mediaFolders.id, current.parentId))
          .limit(1);
        if (parent) {
          breadcrumb.unshift({ id: parent.id, name: parent.name });
          current = parent;
        } else {
          break;
        }
      }
    }

    // Get files in this folder
    const [fileList, countResult] = await Promise.all([
      drizzleDb
        .select({
          id: resources.id,
          title: resources.title,
          fileType: resources.fileType,
          fileSize: resources.fileSize,
          fileUrl: resources.fileUrl,
          thumbnailUrl: resources.thumbnailUrl,
          folderId: resources.folderId,
          createdAt: resources.createdAt,
        })
        .from(resources)
        .where(folderId ? eq(resources.folderId, folderId) : isNull(resources.folderId))
        .orderBy(desc(resources.createdAt))
        .limit(limit)
        .offset(offset),

      drizzleDb
        .select({ count: sql<number>`COUNT(*)` })
        .from(resources)
        .where(folderId ? eq(resources.folderId, folderId) : isNull(resources.folderId)),
    ]);

    const total = countResult[0]?.count || 0;

    return res.json({
      currentFolder,
      breadcrumb,
      folders: subfolders,
      files: fileList.map((f) => ({
        ...f,
        thumbnailUrl: f.thumbnailUrl || (f.fileType?.startsWith("image/") ? `/api/resources/thumbnail/${f.id}` : null),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    console.error("[Mobile API] Resources error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// GET /api/mobile/v1/sav
// After-sales service tickets for the partner
// ============================================
router.get("/api/mobile/v1/sav", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = req.mobileUser!.partnerId;
    if (!partnerId) {
      return res.json({ tickets: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false } });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    const { getDb } = await import("../db");
    const { afterSalesServices } = await import("../../drizzle/schema");
    const { eq, desc, sql } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    const [ticketList, countResult] = await Promise.all([
      drizzleDb
        .select({
          id: afterSalesServices.id,
          ticketNumber: afterSalesServices.ticketNumber,
          status: afterSalesServices.status,
          issueType: afterSalesServices.issueType,
          description: afterSalesServices.description,
          urgency: afterSalesServices.urgency,
          brand: afterSalesServices.brand,
          modelName: afterSalesServices.modelName,
          serialNumber: afterSalesServices.serialNumber,
          warrantyStatus: afterSalesServices.warrantyStatus,
          warrantyPercentage: afterSalesServices.warrantyPercentage,
          customerName: afterSalesServices.customerName,
          trackingNumber: afterSalesServices.trackingNumber,
          createdAt: afterSalesServices.createdAt,
          updatedAt: afterSalesServices.updatedAt,
        })
        .from(afterSalesServices)
        .where(eq(afterSalesServices.partnerId, partnerId))
        .orderBy(desc(afterSalesServices.createdAt))
        .limit(limit)
        .offset(offset),

      drizzleDb
        .select({ count: sql<number>`COUNT(*)` })
        .from(afterSalesServices)
        .where(eq(afterSalesServices.partnerId, partnerId)),
    ]);

    const total = countResult[0]?.count || 0;

    return res.json({
      tickets: ticketList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    console.error("[Mobile API] SAV error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// GET /api/mobile/v1/sav/:id
// Single SAV ticket detail
// ============================================
router.get("/api/mobile/v1/sav/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id);
    const partnerId = req.mobileUser!.partnerId;

    const { getDb } = await import("../db");
    const { afterSalesServices, savPhotos } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    const [ticket] = await drizzleDb
      .select()
      .from(afterSalesServices)
      .where(eq(afterSalesServices.id, ticketId))
      .limit(1);

    if (!ticket) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Ticket SAV non trouvé" });
    }

    // Security: only allow access to own partner's tickets
    if (partnerId && ticket.partnerId !== partnerId) {
      return res.status(403).json({ error: "FORBIDDEN", message: "Accès non autorisé" });
    }

    // Get photos
    let photos: any[] = [];
    try {
      photos = await drizzleDb
        .select()
        .from(savPhotos)
        .where(eq(savPhotos.savId, ticketId));
    } catch {
      // Table might not exist yet
    }

    return res.json({ ticket, photos });
  } catch (err) {
    console.error("[Mobile API] SAV detail error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// GET /api/mobile/v1/partner/profile
// Partner profile info
// ============================================
router.get("/api/mobile/v1/partner/profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = req.mobileUser!.partnerId;
    if (!partnerId) {
      return res.status(404).json({ error: "NO_PARTNER", message: "Aucun partenaire associé" });
    }

    const { getDb } = await import("../db");
    const { partners, partnerAddresses } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    const [partner] = await drizzleDb
      .select()
      .from(partners)
      .where(eq(partners.id, partnerId))
      .limit(1);

    if (!partner) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Partenaire non trouvé" });
    }

    // Get addresses
    const addresses = await drizzleDb
      .select()
      .from(partnerAddresses)
      .where(eq(partnerAddresses.partnerId, partnerId));

    return res.json({ partner, addresses });
  } catch (err) {
    console.error("[Mobile API] Partner profile error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// GET /api/mobile/v1/events
// Upcoming events and promotions
// ============================================
router.get("/api/mobile/v1/events", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    const { getDb } = await import("../db");
    const { events } = await import("../../drizzle/schema");
    const { gte, eq, and, desc, sql } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    const whereClause = and(
      eq(events.isPublished, true),
      gte(events.endDate, new Date())
    );

    const [eventList, countResult] = await Promise.all([
      drizzleDb
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          type: events.type,
          startDate: events.startDate,
          endDate: events.endDate,
          allDay: events.allDay,
          discountPercent: events.discountPercent,
          promoCode: events.promoCode,
          imageUrl: events.imageUrl,
          attachmentUrl: events.attachmentUrl,
        })
        .from(events)
        .where(whereClause)
        .orderBy(events.startDate)
        .limit(limit)
        .offset(offset),

      drizzleDb
        .select({ count: sql<number>`COUNT(*)` })
        .from(events)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count || 0;

    return res.json({
      events: eventList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    console.error("[Mobile API] Events error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// POST /api/mobile/v1/orders
// Create a new order (same logic as web tRPC)
// ============================================
router.post("/api/mobile/v1/orders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const partnerId = req.mobileUser!.partnerId;

    if (!partnerId) {
      return res.status(403).json({ error: "FORBIDDEN", message: "Vous devez être associé à un partenaire pour passer commande" });
    }

    const { items, deliveryAddress, paymentMethod, shippingType, customerNotes } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "MISSING_FIELDS", message: "La commande doit contenir au moins un article" });
    }
    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.postalCode || !deliveryAddress.country || !deliveryAddress.contactName || !deliveryAddress.contactPhone) {
      return res.status(400).json({ error: "MISSING_FIELDS", message: "Adresse de livraison incomplète (street, city, postalCode, country, contactName, contactPhone requis)" });
    }
    if (!paymentMethod) {
      return res.status(400).json({ error: "MISSING_FIELDS", message: "Méthode de paiement requise" });
    }

    const db = await import("../db");
    const { products: productsTable, partnerProductDiscounts } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const drizzleDb = await db.getDb();

    // Get per-product discounts for this partner
    const partnerProdDiscounts = await db.getPartnerProductDiscounts(partnerId);
    const productDiscountsMap = new Map<number, number>();
    for (const ppd of partnerProdDiscounts) {
      productDiscountsMap.set(ppd.productId, ppd.discountPercent);
    }

    // Get partner's global fallback discount
    const partnerInfo = await db.getPartnerById(partnerId);
    const partnerGlobalDiscount = partnerInfo?.discountPercent ? parseFloat(partnerInfo.discountPercent) : 0;

    // Get VAT rate based on partner country (FR=20%, others=0%)
    const vatConfig = await db.getVatRateForPartner(partnerId);
    const dynamicVatRate = vatConfig.vatRate;

    // Build order items with product details and per-product discounts
    const orderItems: any[] = [];
    let totalDiscountWeighted = 0;
    let totalItemsValue = 0;

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ error: "INVALID_ITEM", message: `Article invalide: productId et quantity (>0) requis` });
      }

      const product = await db.getProductById(item.productId);
      if (!product) {
        return res.status(404).json({ error: "NOT_FOUND", message: `Produit ${item.productId} non trouvé` });
      }

      let sku = product.sku;
      let name = product.name;
      let unitPriceHT = parseFloat(product.pricePartnerHT);
      let vatRate = dynamicVatRate;

      // If variant is specified, get variant details
      if (item.variantId) {
        const variant = await db.getProductVariantById(item.variantId);
        if (variant) {
          sku = variant.sku;
          name = `${product.name} - ${variant.name}`;
          if (variant.pricePartnerHT) {
            unitPriceHT = parseFloat(variant.pricePartnerHT);
          }
        }
      }

      // Per-product discount takes priority, then partner global discount
      const itemDiscount = productDiscountsMap.get(item.productId) ?? partnerGlobalDiscount;
      const lineValue = unitPriceHT * item.quantity;
      totalDiscountWeighted += (lineValue * itemDiscount) / 100;
      totalItemsValue += lineValue;

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        sku,
        name,
        quantity: item.quantity,
        unitPriceHT,
        vatRate,
        discountPercent: itemDiscount,
        isPreorder: item.isPreorder || false,
      });
    }

    // Weighted average discount for the order
    const avgDiscountPercent = totalItemsValue > 0 ? Math.round((totalDiscountWeighted / totalItemsValue) * 10000) / 100 : 0;

    // Create the order with dynamic shipping
    const result = await db.createOrder({
      partnerId,
      createdById: userId,
      items: orderItems,
      deliveryAddress,
      paymentMethod,
      shippingType: shippingType || "standard",
      customerNotes: customerNotes || undefined,
      discountPercent: avgDiscountPercent,
    });

    // Send new order notification
    try {
      const { notifyNewOrder } = await import("../alerts");
      await notifyNewOrder(result.orderId);
    } catch (err) {
      console.error("[Mobile API] Failed to send order notification:", err);
    }

    // Create Mollie payment for the deposit/full amount
    let mollieCheckoutUrl: string | null = null;
    try {
      const { createMolliePayment } = await import("../mollie");
      const paymentAmount = result.depositAmount || result.totalTTC;
      const mollieResult = await createMolliePayment({
        amount: paymentAmount,
        description: `Commande ${result.orderNumber} - ${result.depositAmount < result.totalTTC ? 'Acompte' : 'Paiement intégral'}`,
        redirectUrl: `${req.headers.origin || process.env.SITE_URL}/order-confirmation/${result.orderId}`,
        webhookUrl: `${process.env.SITE_URL}/api/webhooks/mollie`,
        metadata: {
          type: "order",
          orderId: result.orderId.toString(),
          orderNumber: result.orderNumber,
        },
      });
      mollieCheckoutUrl = mollieResult.checkoutUrl;
    } catch (mollieErr) {
      console.error("[Mobile API] Mollie payment creation failed:", mollieErr);
    }

    return res.status(201).json({
      success: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      totalHT: result.totalHT,
      totalTTC: result.totalTTC,
      shippingHT: result.shippingHT,
      depositAmount: result.depositAmount,
      balanceAmount: result.balanceAmount,
      discountPercent: avgDiscountPercent,
      mollieCheckoutUrl,
      message: "Commande créée avec succès",
    });
  } catch (err: any) {
    console.error("[Mobile API] Create order error:", err);
    // Handle stock errors gracefully
    if (err.message?.includes("Stock insuffisant")) {
      return res.status(409).json({ error: "INSUFFICIENT_STOCK", message: err.message });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message || "Erreur lors de la création de la commande" });
  }
});

// ============================================
// POST /api/mobile/v1/sav
// Create a new SAV ticket with optional photo upload
// ============================================
router.post("/api/mobile/v1/sav", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.mobileUser!.sub);
    const partnerId = req.mobileUser!.partnerId;

    if (!partnerId) {
      return res.status(403).json({ error: "FORBIDDEN", message: "Vous devez être associé à un partenaire pour créer un ticket SAV" });
    }

    const {
      serialNumber,
      issueType,
      description,
      urgency,
      brand,
      productLine,
      modelName,
      component,
      defectType,
      purchaseDate,
      deliveryDate,
      usageType,
      isOriginalBuyer,
      isModified,
      isMaintenanceConform,
      isChemistryConform,
      usesHydrogenPeroxide,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      installationDate,
      productId,
      media,
    } = req.body;

    // Validate required fields
    if (!serialNumber || !serialNumber.trim()) {
      return res.status(400).json({ error: "MISSING_FIELDS", message: "Numéro de série requis" });
    }
    if (!issueType) {
      return res.status(400).json({ error: "MISSING_FIELDS", message: "Type de problème requis" });
    }
    if (!description || description.length < 10) {
      return res.status(400).json({ error: "MISSING_FIELDS", message: "Description requise (minimum 10 caractères)" });
    }

    // Upload media to S3
    const { storagePut } = await import("../storage");
    const { nanoid } = await import("nanoid");
    const uploadedMedia: Array<{ url: string; key: string; type: "IMAGE" | "VIDEO"; description?: string }> = [];

    if (media && Array.isArray(media) && media.length > 0) {
      for (const item of media) {
        if (!item.base64 || !item.mimeType || !item.type) {
          continue; // Skip invalid media items
        }
        try {
          const buffer = Buffer.from(item.base64, "base64");
          const ext = item.type === "VIDEO" ? "mp4" : "jpg";
          const fileKey = `sav/${partnerId}/${Date.now()}-${nanoid()}.${ext}`;
          const { url } = await storagePut(fileKey, buffer, item.mimeType);
          uploadedMedia.push({ url, key: fileKey, type: item.type, description: item.description });
        } catch (uploadErr) {
          console.error("[Mobile API] Failed to upload SAV media:", uploadErr);
        }
      }
    }

    // Run warranty analysis if enough data
    let warrantyResult = null;
    if (brand && component && defectType && purchaseDate && deliveryDate) {
      try {
        const { analyzeWarranty, SavBrand, UsageType } = await import("../sav-warranty");
        warrantyResult = analyzeWarranty({
          brand: brand as any,
          productLine,
          component,
          defectType,
          purchaseDate,
          deliveryDate,
          usageType: (usageType || "PRIVATE") as any,
          isOriginalBuyer: isOriginalBuyer ?? true,
          isModified: isModified ?? false,
          isMaintenanceConform: isMaintenanceConform ?? true,
          isChemistryConform: isChemistryConform ?? true,
          usesHydrogenPeroxide: usesHydrogenPeroxide ?? false,
        });
      } catch (err) {
        console.error("[Mobile API] Warranty analysis failed:", err);
      }
    }

    // Create the SAV ticket
    const savDb = await import("../sav-db");
    const result = await savDb.createSavTicket({
      partnerId,
      productId: productId || undefined,
      serialNumber: serialNumber.trim(),
      issueType,
      description,
      urgency: urgency || "NORMAL",
      brand,
      productLine,
      modelName,
      component,
      defectType,
      purchaseDate,
      deliveryDate,
      usageType: usageType || "PRIVATE",
      isOriginalBuyer: isOriginalBuyer ?? true,
      isModified: isModified ?? false,
      isMaintenanceConform: isMaintenanceConform ?? true,
      isChemistryConform: isChemistryConform ?? true,
      usesHydrogenPeroxide: usesHydrogenPeroxide ?? false,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      installationDate,
      media: uploadedMedia,
      warrantyStatus: warrantyResult?.status,
      warrantyPercentage: warrantyResult?.percentage,
      warrantyExpiryDate: warrantyResult?.expiryDate || undefined,
      warrantyAnalysisDetails: warrantyResult ? JSON.stringify(warrantyResult) : undefined,
    });

    // Notify admin
    try {
      const { notifyOwner } = await import("../alerts");
      const urgencyLabel = urgency === "CRITICAL" ? "CRITIQUE" : urgency === "URGENT" ? "URGENT" : "";
      await notifyOwner({
        title: `Nouveau ticket SAV ${urgencyLabel} - ${result.ticketNumber}`,
        content: `Ticket: ${result.ticketNumber}\nMarque: ${brand || "N/A"}\nModèle: ${modelName || "N/A"}\nComposant: ${component || "N/A"}\nGarantie: ${warrantyResult?.status || "À analyser"}\nDescription: ${description.substring(0, 200)}`,
      });
    } catch (err) {
      console.error("[Mobile API] Failed to send SAV notification:", err);
    }

    // Persistent DB notification for admins
    try {
      const notifService = await import("../notification-service");
      await notifService.notifySavTicketCreated(result.ticketNumber, partnerId, urgency || "NORMAL", description);
    } catch (err) {
      console.error("[Mobile API] Failed to create SAV DB notification:", err);
    }

    return res.status(201).json({
      success: true,
      ticketId: result.serviceId,
      ticketNumber: result.ticketNumber,
      warrantyAnalysis: warrantyResult || null,
      mediaUploaded: uploadedMedia.length,
      message: "Ticket SAV créé avec succès",
    });
  } catch (err: any) {
    console.error("[Mobile API] Create SAV error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message || "Erreur lors de la création du ticket SAV" });
  }
});

// ============================================
// GET /api/mobile/v1/orders/:id/tracking
// Order tracking timeline with status history
// ============================================
router.get("/api/mobile/v1/orders/:id/tracking", requireMobileAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) return res.status(400).json({ error: "INVALID_ID", message: "ID de commande invalide" });

    const { getDb } = await import("../db");
    const { orders, orderStatusHistory, users: usersTable } = await import("../../drizzle/schema");
    const { eq, and, desc } = await import("drizzle-orm");
    const drizzleDb = await getDb();

    // Get order
    const [order] = await drizzleDb.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return res.status(404).json({ error: "NOT_FOUND", message: "Commande non trouvée" });

    // Check partner access
    const user = req.mobileUser!;
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && order.partnerId !== user.partnerId) {
      return res.status(403).json({ error: "FORBIDDEN", message: "Accès non autorisé" });
    }

    // Get status history
    const history = await drizzleDb
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.createdAt));

    const statusLabels: Record<string, string> = {
      DRAFT: "Brouillon",
      PENDING_APPROVAL: "En attente de validation",
      PENDING_DEPOSIT: "En attente d'acompte",
      DEPOSIT_PAID: "Acompte reçu",
      IN_PRODUCTION: "En production",
      READY_TO_SHIP: "Prêt à expédier",
      PARTIALLY_SHIPPED: "Partiellement expédié",
      SHIPPED: "Expédié",
      DELIVERED: "Livré",
      COMPLETED: "Terminée",
      CANCELLED: "Annulée",
      REFUNDED: "Remboursée",
    };

    // Build tracking steps (all possible steps in order)
    const allSteps = [
      "PENDING_APPROVAL",
      "PENDING_DEPOSIT",
      "DEPOSIT_PAID",
      "IN_PRODUCTION",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
      "COMPLETED",
    ];

    const currentStatusIndex = allSteps.indexOf(order.status as string);

    const trackingSteps = allSteps.map((step, index) => {
      const historyEntry = history.find((h) => h.newStatus === step);
      let stepStatus: "completed" | "current" | "upcoming" = "upcoming";
      if (index < currentStatusIndex) stepStatus = "completed";
      else if (index === currentStatusIndex) stepStatus = "current";

      return {
        status: step,
        label: statusLabels[step] || step,
        stepStatus,
        date: historyEntry?.createdAt?.toISOString() || null,
        note: historyEntry?.note || null,
      };
    });

    // Build carrier tracking info
    const carrierTracking = order.trackingNumber
      ? {
          carrier: order.shippingCarrier || null,
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl || null,
          shippedAt: order.shippedAt?.toISOString() || null,
          deliveredAt: order.deliveredAt?.toISOString() || null,
          estimatedDeliveryDate: null as string | null,
        }
      : null;

    // Get estimated delivery from latest history entry with estimatedDeliveryDate
    if (carrierTracking) {
      const withEstimate = history.find((h) => h.estimatedDeliveryDate);
      if (withEstimate?.estimatedDeliveryDate) {
        carrierTracking.estimatedDeliveryDate = withEstimate.estimatedDeliveryDate.toISOString();
      }
    }

    return res.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusLabel: statusLabels[order.status as string] || order.status,
        createdAt: order.createdAt?.toISOString() || null,
        totalTTC: order.totalTTC,
      },
      carrierTracking,
      trackingSteps,
      statusHistory: history.map((h) => ({
        id: h.id,
        oldStatus: h.oldStatus,
        oldStatusLabel: statusLabels[h.oldStatus || ""] || h.oldStatus,
        newStatus: h.newStatus,
        newStatusLabel: statusLabels[h.newStatus] || h.newStatus,
        note: h.note,
        trackingNumber: h.trackingNumber,
        trackingCarrier: h.trackingCarrier,
        trackingUrl: h.trackingUrl,
        date: h.createdAt?.toISOString() || null,
      })),
    });
  } catch (err: any) {
    console.error("[Mobile API] Order tracking error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// PUT /api/mobile/v1/orders/:id/tracking
// Update tracking info (admin only)
// ============================================
router.put("/api/mobile/v1/orders/:id/tracking", requireMobileAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.mobileUser!;
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      return res.status(403).json({ error: "FORBIDDEN", message: "Réservé aux administrateurs" });
    }

    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) return res.status(400).json({ error: "INVALID_ID", message: "ID invalide" });

    const { trackingNumber, trackingCarrier, trackingUrl, estimatedDeliveryDate, note } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({ error: "MISSING_FIELDS", message: "Numéro de suivi requis" });
    }

    const { getDb } = await import("../db");
    const { orders, orderStatusHistory } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const drizzleDb = await getDb();

    // Get order
    const [order] = await drizzleDb.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return res.status(404).json({ error: "NOT_FOUND", message: "Commande non trouvée" });

    // Generate tracking URL if carrier is known
    let finalTrackingUrl = trackingUrl || null;
    if (!finalTrackingUrl && trackingCarrier && trackingNumber) {
      const carrierUrls: Record<string, string> = {
        BPOST: `https://track.bpost.cloud/btr/web/#/search?itemCode=${trackingNumber}`,
        DHL: `https://www.dhl.com/fr-fr/home/tracking.html?tracking-id=${trackingNumber}`,
        UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
        GLS: `https://gls-group.com/FR/fr/suivi-colis?match=${trackingNumber}`,
        MONDIAL_RELAY: `https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=${trackingNumber}`,
        CHRONOPOST: `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${trackingNumber}`,
        COLISSIMO: `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`,
        TNT: `https://www.tnt.com/express/fr_fr/site/outils-expedition/suivi.html?searchType=con&cons=${trackingNumber}`,
      };
      finalTrackingUrl = carrierUrls[trackingCarrier] || null;
    }

    // Update order tracking fields
    const updateData: Record<string, any> = {
      trackingNumber,
      trackingUrl: finalTrackingUrl,
      updatedAt: new Date(),
    };
    if (trackingCarrier) updateData.shippingCarrier = trackingCarrier;

    // If status is READY_TO_SHIP or earlier, auto-advance to SHIPPED
    const oldStatus = order.status as string;
    let newStatus = oldStatus;
    if (["READY_TO_SHIP", "IN_PRODUCTION", "DEPOSIT_PAID", "PENDING_DEPOSIT", "PENDING_APPROVAL"].includes(oldStatus)) {
      updateData.status = "SHIPPED";
      updateData.shippedAt = new Date();
      newStatus = "SHIPPED";
    }

    await drizzleDb.update(orders).set(updateData).where(eq(orders.id, orderId));

    // Record in history
    await drizzleDb.insert(orderStatusHistory).values({
      orderId,
      oldStatus,
      newStatus: newStatus !== oldStatus ? newStatus : oldStatus,
      note: note || `Numéro de suivi ajouté: ${trackingNumber}`,
      changedByUserId: parseInt(user.sub),
      trackingNumber,
      trackingCarrier: trackingCarrier || null,
      trackingUrl: finalTrackingUrl,
      estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
    });

    // If status changed, trigger full notification chain
    if (newStatus !== oldStatus) {
      try {
        const { notifyOrderStatusChange } = await import("../alerts");
        await notifyOrderStatusChange(orderId, oldStatus, newStatus, parseInt(user.sub), { skipHistory: true });
      } catch (err) {
        console.error("[Mobile API] Failed to send status change notifications:", err);
      }
    }

    return res.json({
      success: true,
      trackingNumber,
      trackingCarrier: trackingCarrier || null,
      trackingUrl: finalTrackingUrl,
      statusChanged: newStatus !== oldStatus,
      newStatus,
      message: "Informations de suivi mises à jour",
    });
  } catch (err: any) {
    console.error("[Mobile API] Update tracking error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// GET /api/mobile/v1/network
// Carte du réseau partenaires
// ============================================
router.get("/api/mobile/v1/network", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { partners } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");
    const db = await getDb();
    const country = req.query.country as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const conditions: any[] = [];
    if (country) conditions.push(eq(partners.addressCountry, country.toUpperCase()));
    if (statusFilter) conditions.push(eq(partners.status, statusFilter as any));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db.select({
      id: partners.id,
      companyName: partners.companyName,
      tradeName: partners.tradeName,
      addressStreet: partners.addressStreet,
      addressCity: partners.addressCity,
      addressPostalCode: partners.addressPostalCode,
      addressCountry: partners.addressCountry,
      contactPhone: partners.primaryContactPhone,
      contactEmail: partners.primaryContactEmail,
      partnerLevel: partners.level,
      partnerStatus: partners.status,
      website: partners.website,
    }).from(partners).where(whereClause);
    const result = rows.map((p) => ({ ...p, latitude: null, longitude: null }));
    return res.json({ partners: result, total: result.length });
  } catch (err: any) {
    console.error("[Mobile API] Network error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// GET /api/mobile/v1/leads
// Leads du partenaire connecté (ou tous si admin)
// ============================================
router.get("/api/mobile/v1/leads", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = req.mobileUser!.partnerId;
    const role = req.mobileUser!.role;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status as string | undefined;
    const { getDb } = await import("../db");
    const { leads } = await import("../../drizzle/schema");
    const { eq, and, desc, sql } = await import("drizzle-orm");
    const db = await getDb();
    const conditions: any[] = [];
    if (role !== "SUPER_ADMIN" && role !== "ADMIN" && partnerId) {
      conditions.push(eq(leads.assignedPartnerId, partnerId));
    }
    if (statusFilter) conditions.push(eq(leads.status, statusFilter as any));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [rows, countResult] = await Promise.all([
      db.select().from(leads).where(whereClause).orderBy(desc(leads.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(leads).where(whereClause),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return res.json({ leads: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    console.error("[Mobile API] Leads error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/v1/leads/:id
router.get("/api/mobile/v1/leads/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leadId = parseInt(req.params.id);
    const partnerId = req.mobileUser!.partnerId;
    const role = req.mobileUser!.role;
    const { getDb } = await import("../db");
    const { leads } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");
    const db = await getDb();
    const conditions: any[] = [eq(leads.id, leadId)];
    if (role !== "SUPER_ADMIN" && role !== "ADMIN" && partnerId) conditions.push(eq(leads.assignedPartnerId, partnerId));
    const [lead] = await db.select().from(leads).where(and(...conditions)).limit(1);
    if (!lead) return res.status(404).json({ error: "NOT_FOUND", message: "Lead introuvable" });
    return res.json({ lead });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// PATCH /api/mobile/v1/leads/:id
router.patch("/api/mobile/v1/leads/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leadId = parseInt(req.params.id);
    const partnerId = req.mobileUser!.partnerId;
    const role = req.mobileUser!.role;
    const { getDb } = await import("../db");
    const { leads } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");
    const db = await getDb();
    const conditions: any[] = [eq(leads.id, leadId)];
    if (role !== "SUPER_ADMIN" && role !== "ADMIN" && partnerId) conditions.push(eq(leads.assignedPartnerId, partnerId));
    const { status, notes, phone } = req.body;
    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.message = notes;
    if (phone) updateData.phone = phone;
    await db.update(leads).set(updateData).where(and(...conditions));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// ADMIN MIDDLEWARE
// ============================================
async function requireAdminRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const role = req.mobileUser?.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return res.status(403).json({ error: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
  }
  next();
}
router.use("/api/mobile/admin", requireMobileAuth, requireAdminRole);

// GET /api/mobile/admin/stats
router.get("/api/mobile/admin/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { getDb } = await import("../db");
    const { partners, orders, leads, customerSavTickets } = await import("../../drizzle/schema");
    const { eq, desc, sql } = await import("drizzle-orm");
    const db = await getDb();
    const [totalPartners, activePartners, totalOrders, pendingOrders, totalRevenue, totalLeads, openSav, recentOrders] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` }).from(partners),
      db.select({ count: sql<number>`COUNT(*)` }).from(partners).where(eq(partners.status, "APPROVED")),
      db.select({ count: sql<number>`COUNT(*)` }).from(orders),
      db.select({ count: sql<number>`COUNT(*)` }).from(orders).where(eq(orders.status, "PENDING")),
      db.select({ total: sql<number>`COALESCE(SUM(totalTTC), 0)` }).from(orders),
      db.select({ count: sql<number>`COUNT(*)` }).from(leads),
      db.select({ count: sql<number>`COUNT(*)` }).from(customerSavTickets).where(eq(customerSavTickets.status, "OPEN")),
      db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, totalTTC: orders.totalTTC, createdAt: orders.createdAt, partnerId: orders.partnerId }).from(orders).orderBy(desc(orders.createdAt)).limit(10),
    ]);
    return res.json({
      totalPartners: Number(totalPartners[0]?.count ?? 0),
      activePartners: Number(activePartners[0]?.count ?? 0),
      totalOrders: Number(totalOrders[0]?.count ?? 0),
      pendingOrders: Number(pendingOrders[0]?.count ?? 0),
      totalRevenueTTC: Number(totalRevenue[0]?.total ?? 0),
      totalLeads: Number(totalLeads[0]?.count ?? 0),
      openSavTickets: Number(openSav[0]?.count ?? 0),
      recentOrders,
    });
  } catch (err: any) {
    console.error("[Mobile Admin] Stats error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/partners
router.get("/api/mobile/admin/partners", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const statusFilter = req.query.status as string | undefined;
    const { getDb } = await import("../db");
    const { partners } = await import("../../drizzle/schema");
    const { eq, like, or, and, desc, sql } = await import("drizzle-orm");
    const db = await getDb();
    const conditions: any[] = [];
    if (statusFilter) conditions.push(eq(partners.status, statusFilter as any));
    if (search) conditions.push(or(like(partners.companyName, `%${search}%`), like(partners.primaryContactEmail, `%${search}%`)));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [rows, countResult] = await Promise.all([
      db.select({
        id: partners.id, companyName: partners.companyName, tradeName: partners.tradeName,
        contactName: partners.primaryContactName, contactEmail: partners.primaryContactEmail,
        contactPhone: partners.primaryContactPhone, addressCity: partners.addressCity,
        addressCountry: partners.addressCountry, partnerLevel: partners.level,
        partnerStatus: partners.status, discountPercent: partners.discountPercent,
        supplierClientCode: partners.supplierClientCode, totalOrders: partners.totalOrders,
        createdAt: partners.createdAt,
      }).from(partners).where(whereClause).orderBy(desc(partners.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(partners).where(whereClause),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return res.json({ partners: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    console.error("[Mobile Admin] Partners error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/partners/:id
router.get("/api/mobile/admin/partners/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const partnerId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { partners, orders, leads } = await import("../../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");
    const db = await getDb();
    const [partner] = await db.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
    if (!partner) return res.status(404).json({ error: "NOT_FOUND", message: "Partenaire introuvable" });
    const [recentOrders, partnerLeads] = await Promise.all([
      db.select().from(orders).where(eq(orders.partnerId, partnerId)).orderBy(desc(orders.createdAt)).limit(10),
      db.select().from(leads).where(eq(leads.assignedPartnerId, partnerId)).orderBy(desc(leads.createdAt)).limit(20),
    ]);
    return res.json({ partner, recentOrders, leads: partnerLeads });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/orders
router.get("/api/mobile/admin/orders", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status as string | undefined;
    const partnerIdFilter = req.query.partnerId ? parseInt(req.query.partnerId as string) : undefined;
    const { getDb } = await import("../db");
    const { orders, partners } = await import("../../drizzle/schema");
    const { eq, and, desc, sql } = await import("drizzle-orm");
    const db = await getDb();
    const conditions: any[] = [];
    if (statusFilter) conditions.push(eq(orders.status, statusFilter as any));
    if (partnerIdFilter) conditions.push(eq(orders.partnerId, partnerIdFilter));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [rows, countResult] = await Promise.all([
      db.select({
        id: orders.id, orderNumber: orders.orderNumber, status: orders.status,
        totalHT: orders.totalHT, totalTTC: orders.totalTTC, depositPaid: orders.depositPaid,
        deliveryRequestedDate: orders.deliveryRequestedDate, createdAt: orders.createdAt,
        partnerId: orders.partnerId, partnerName: partners.primaryContactName, partnerCompany: partners.companyName,
      }).from(orders).leftJoin(partners, eq(orders.partnerId, partners.id)).where(whereClause).orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(orders).where(whereClause),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return res.json({ orders: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    console.error("[Mobile Admin] Orders error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/orders/:id
router.get("/api/mobile/admin/orders/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const { getDb } = await import("../db");
    const { orders, orderItems, partners, payments } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return res.status(404).json({ error: "NOT_FOUND", message: "Commande introuvable" });
    const [items, partner, orderPayments] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
      order.partnerId ? db.select({ id: partners.id, companyName: partners.companyName, contactName: partners.primaryContactName, contactEmail: partners.primaryContactEmail, contactPhone: partners.primaryContactPhone }).from(partners).where(eq(partners.id, order.partnerId)).limit(1) : Promise.resolve([]),
      db.select().from(payments).where(eq(payments.orderId, orderId)),
    ]);
    return res.json({ order: { ...order, items, payments: orderPayments, partner: partner[0] ?? null } });
  } catch (err: any) {
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// GET /api/mobile/admin/leads
router.get("/api/mobile/admin/leads", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status as string | undefined;
    const partnerIdFilter = req.query.partnerId ? parseInt(req.query.partnerId as string) : undefined;
    const { getDb } = await import("../db");
    const { leads } = await import("../../drizzle/schema");
    const { eq, and, desc, sql } = await import("drizzle-orm");
    const db = await getDb();
    const conditions: any[] = [];
    if (statusFilter) conditions.push(eq(leads.status, statusFilter as any));
    if (partnerIdFilter) conditions.push(eq(leads.assignedPartnerId, partnerIdFilter));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [rows, countResult] = await Promise.all([
      db.select().from(leads).where(whereClause).orderBy(desc(leads.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(leads).where(whereClause),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return res.json({ leads: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err: any) {
    console.error("[Mobile Admin] Leads error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR", message: err.message });
  }
});

// ============================================
// GET /api/mobile/health
// Health check endpoint (public)
// ============================================
router.get("/api/mobile/health", (_req: Request, res: Response) => {
  return res.json({
    status: "ok",
    version: "1.2.0",
    timestamp: new Date().toISOString(),
  });
});

export const mobileApiRouter = router;
