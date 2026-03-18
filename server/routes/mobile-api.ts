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
// GET /api/mobile/health
// Health check endpoint (public)
// ============================================
router.get("/api/mobile/health", (_req: Request, res: Response) => {
  return res.json({
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

export const mobileApiRouter = router;
