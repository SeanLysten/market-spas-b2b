/**
 * Mobile-optimized REST API endpoints
 * 
 * These endpoints return lightweight, paginated data optimized for mobile bandwidth.
 * All routes require Bearer token authentication.
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
    const { orders, notifications, resources, events } = await import("../../drizzle/schema");
    const { eq, and, desc, sql, gte } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    // Parallel queries for dashboard data
    const [
      recentOrders,
      unreadNotifications,
      recentResources,
      upcomingEvents,
    ] = await Promise.all([
      // Recent orders (last 5)
      partnerId
        ? drizzleDb
            .select({
              id: orders.id,
              orderNumber: orders.orderNumber,
              status: orders.status,
              totalHT: orders.totalHT,
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
          thumbnailUrl: resources.thumbnailUrl,
          createdAt: resources.createdAt,
        })
        .from(resources)
        .orderBy(desc(resources.createdAt))
        .limit(10),

      // Upcoming events
      drizzleDb
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          startDate: events.startDate,
          endDate: events.endDate,
          imageUrl: events.imageUrl,
        })
        .from(events)
        .where(gte(events.endDate, new Date()))
        .orderBy(events.startDate)
        .limit(5),
    ]);

    return res.json({
      orders: recentOrders,
      unreadNotificationCount: unreadNotifications[0]?.count || 0,
      resources: recentResources,
      events: upcomingEvents,
    });
  } catch (err) {
    console.error("[Mobile API] Dashboard error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// GET /api/mobile/v1/products
// Paginated product catalog optimized for mobile
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
    let whereClause: any = eq(products.isActive, true);
    if (search && category) {
      whereClause = and(eq(products.isActive, true), like(products.name, `%${search}%`), eq(products.category, category as any));
    } else if (search) {
      whereClause = and(eq(products.isActive, true), like(products.name, `%${search}%`));
    } else if (category) {
      whereClause = and(eq(products.isActive, true), eq(products.category, category as any));
    }

    const [productList, countResult] = await Promise.all([
      drizzleDb
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          category: products.category,
          pricePublicHT: products.pricePublicHT,
          imageUrl: products.imageUrl,
          isFeatured: products.isFeatured,
        })
        .from(products)
        .where(whereClause)
        .orderBy(desc(products.createdAt))
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
// Single product detail
// ============================================
router.get("/api/mobile/v1/products/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const partnerId = req.mobileUser!.partnerId;

    const { getDb } = await import("../db");
    const { products, partnerProductDiscounts } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    const [product] = await drizzleDb
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Produit non trouvé" });
    }

    // Get partner-specific discount if applicable
    let discount = null;
    if (partnerId) {
      const [d] = await drizzleDb
        .select()
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
      discount: discount ? { percentage: discount.discountPercentage } : null,
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

    const conditions = [eq(orders.partnerId, partnerId)];
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
          totalHT: orders.totalHT,
          totalTTC: orders.totalTTC,
          depositAmount: orders.depositAmount,
          depositPaid: orders.depositPaid,
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
          linkUrl: notifications.linkUrl,
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
    const { ids } = req.body; // array of notification IDs, or "all"

    const { getDb } = await import("../db");
    const { notifications } = await import("../../drizzle/schema");
    const { eq, and, inArray } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    if (ids === "all") {
      await drizzleDb
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        );
    } else if (Array.isArray(ids) && ids.length > 0) {
      await drizzleDb
        .update(notifications)
        .set({ isRead: true })
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
// Paginated resources with folder navigation
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
      folders: subfolders,
      files: fileList.map((f) => ({
        ...f,
        // Use thumbnail for list views, original for detail
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
          priority: afterSalesServices.priority,
          subject: afterSalesServices.subject,
          productName: afterSalesServices.productName,
          serialNumber: afterSalesServices.serialNumber,
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
// GET /api/mobile/v1/health
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
