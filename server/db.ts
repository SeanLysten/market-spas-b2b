import { eq, and, desc, sql, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, partners, products, orders, notifications, resources } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER QUERIES
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "firstName", "lastName", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'SUPER_ADMIN';
      updateSet.role = 'SUPER_ADMIN';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUsersByPartnerId(partnerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).where(eq(users.partnerId, partnerId));
}

// ============================================
// PARTNER QUERIES
// ============================================

export async function getPartnerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPartnerByVatNumber(vatNumber: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(partners).where(eq(partners.vatNumber, vatNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllPartners(filters?: {
  status?: string;
  level?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(partners);

  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(partners.status, filters.status as any));
  }
  if (filters?.level) {
    conditions.push(eq(partners.level, filters.level as any));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(partners.companyName, `%${filters.search}%`),
        like(partners.vatNumber, `%${filters.search}%`),
        like(partners.primaryContactEmail, `%${filters.search}%`)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(partners.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return await query;
}

export async function createPartner(data: typeof partners.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(partners).values(data);
  return result;
}

export async function updatePartner(id: number, data: Partial<typeof partners.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(partners).set(data).where(eq(partners.id, id));
}

// ============================================
// PRODUCT QUERIES
// ============================================

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductBySku(sku: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products).where(eq(products.sku, sku)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllProducts(filters?: {
  categoryId?: number;
  isActive?: boolean;
  isVisible?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(products);

  const conditions = [];
  if (filters?.categoryId !== undefined) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }
  if (filters?.isVisible !== undefined) {
    conditions.push(eq(products.isVisible, filters.isVisible));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(products.name, `%${filters.search}%`),
        like(products.sku, `%${filters.search}%`),
        like(products.description, `%${filters.search}%`)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(products.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return await query;
}

// ============================================
// ORDER QUERIES
// ============================================

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByPartnerId(partnerId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(orders)
    .where(eq(orders.partnerId, partnerId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getAllOrders(filters?: {
  partnerId?: number;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(orders);

  const conditions = [];
  if (filters?.partnerId !== undefined) {
    conditions.push(eq(orders.partnerId, filters.partnerId));
  }
  if (filters?.status) {
    conditions.push(eq(orders.status, filters.status as any));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(orders.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return await query;
}

// ============================================
// NOTIFICATION QUERIES
// ============================================

export async function getNotificationsByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationsCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return result[0]?.count || 0;
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.id, id));
}

export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(notifications).values(data);
}

// ============================================
// RESOURCE QUERIES
// ============================================

export async function getAllResources(filters?: {
  category?: string;
  isActive?: boolean;
  language?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(resources);

  const conditions = [];
  if (filters?.category) {
    conditions.push(eq(resources.category, filters.category as any));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(resources.isActive, filters.isActive));
  }
  if (filters?.language) {
    conditions.push(eq(resources.language, filters.language));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(resources.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return await query;
}

export async function getResourceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementResourceView(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(resources)
    .set({ viewCount: sql`${resources.viewCount} + 1` })
    .where(eq(resources.id, id));
}

export async function incrementResourceDownload(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(resources)
    .set({ downloadCount: sql`${resources.downloadCount} + 1` })
    .where(eq(resources.id, id));
}

// ============================================
// STATS QUERIES
// ============================================

export async function getDashboardStats(partnerId?: number) {
  const db = await getDb();
  if (!db) return null;

  const stats: any = {};

  // Total orders
  let ordersQuery = db.select({ count: sql<number>`count(*)` }).from(orders);
  if (partnerId) {
    ordersQuery = ordersQuery.where(eq(orders.partnerId, partnerId)) as any;
  }
  const ordersResult = await ordersQuery;
  stats.totalOrders = ordersResult[0]?.count || 0;

  // Total revenue
  let revenueQuery = db
    .select({ total: sql<number>`sum(${orders.totalTTC})` })
    .from(orders);
  if (partnerId) {
    revenueQuery = revenueQuery.where(
      and(eq(orders.partnerId, partnerId), eq(orders.status, "COMPLETED"))
    ) as any;
  } else {
    revenueQuery = revenueQuery.where(eq(orders.status, "COMPLETED")) as any;
  }
  const revenueResult = await revenueQuery;
  stats.totalRevenue = revenueResult[0]?.total || 0;

  // Total partners (admin only)
  if (!partnerId) {
    const partnersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(partners)
      .where(eq(partners.status, "APPROVED"));
    stats.totalPartners = partnersResult[0]?.count || 0;
  }

  // Total products
  const productsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isVisible, true)));
  stats.totalProducts = productsResult[0]?.count || 0;

  return stats;
}
