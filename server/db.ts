import { eq, and, desc, sql, or, like, lte, gte, asc, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, partners, products, orders, notifications, resources, productVariants, variantOptions, incomingStock, cartItems, favorites, events, leads, leadStatusHistory, payments, technicalResources, forumTopics, forumReplies } from "../drizzle/schema";
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

export async function createPartner(data: {
  companyName: string;
  vatNumber: string;
  primaryContactEmail: string;
  tradeName?: string;
  addressStreet?: string;
  addressCity?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  level?: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "VIP";
  discountPercent?: number;
  status?: "PENDING" | "APPROVED" | "SUSPENDED" | "TERMINATED";
  internalNotes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const insertData: typeof partners.$inferInsert = {
    companyName: data.companyName,
    vatNumber: data.vatNumber,
    primaryContactEmail: data.primaryContactEmail,
    tradeName: data.tradeName || null,
    addressStreet: data.addressStreet || "N/A",
    addressCity: data.addressCity || "N/A",
    addressPostalCode: data.addressPostalCode || "N/A",
    addressCountry: data.addressCountry || "BE",
    primaryContactName: data.primaryContactName || "N/A",
    primaryContactPhone: data.primaryContactPhone || "N/A",
    level: data.level || "BRONZE",
    discountPercent: data.discountPercent?.toString() || "0",
    status: data.status || "PENDING",
    internalNotes: data.internalNotes || null,
  };

  const result = await db.insert(partners).values(insertData);
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
  category?: string;
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
  if (filters?.category !== undefined) {
    conditions.push(eq(products.category, filters.category as any));
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

// Note: markNotificationAsRead and createNotification are defined at the end of the file
// with enhanced functionality

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

export async function createResource(data: {
  title: string;
  description: string | null;
  category: string;
  language: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isPublic: boolean;
  isActive: boolean;
  requiredPartnerLevel: string;
  uploadedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(resources).values({
    title: data.title,
    description: data.description,
    category: data.category as any,
    language: data.language,
    fileUrl: data.fileUrl,
    fileType: data.fileType,
    fileSize: data.fileSize,
    isPublic: data.isPublic,
    isActive: data.isActive,
    requiredPartnerLevel: data.requiredPartnerLevel as any,
    uploadedById: data.uploadedBy,
    downloadCount: 0,
    viewCount: 0,
  });

  return result;
}

export async function deleteResource(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(resources).where(eq(resources.id, id));
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


// ============================================
// USER ADMIN QUERIES
// ============================================

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserStatus(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}

// ============================================
// PRODUCT ADMIN QUERIES
// ============================================

export async function createProduct(data: {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  priceHT: number;
  vatRate: number;
  stockQuantity: number;
  minOrderQuantity?: number;
  weight?: number;
  dimensions?: string;
  imageUrl?: string;
  isActive?: boolean;
  isVisible?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values({
    sku: data.sku,
    name: data.name,
    description: data.description || null,
    shortDescription: data.description || null,
    pricePublicHT: data.priceHT.toString(),
    pricePartnerHT: data.priceHT.toString(),
    vatRate: data.vatRate.toString(),
    stockQuantity: data.stockQuantity,
    weight: data.weight ? data.weight.toString() : null,
    isActive: data.isActive !== undefined ? data.isActive : true,
    isVisible: data.isVisible !== undefined ? data.isVisible : true,
  });

  return result;
}

export async function updateProduct(id: number, data: Partial<{
  sku: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  priceHT: number;
  vatRate: number;
  stockQuantity: number;
  minOrderQuantity: number;
  weight: number;
  dimensions: string;
  imageUrl: string;
  isActive: boolean;
  isVisible: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.brand !== undefined) updateData.brand = data.brand;
  if (data.priceHT !== undefined) {
    updateData.priceHT = data.priceHT.toString();
    if (data.vatRate !== undefined) {
      updateData.priceTTC = ((data.priceHT * (1 + data.vatRate / 100))).toString();
    }
  }
  if (data.vatRate !== undefined) updateData.vatRate = data.vatRate.toString();
  if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity;
  if (data.minOrderQuantity !== undefined) updateData.minOrderQuantity = data.minOrderQuantity;
  if (data.weight !== undefined) updateData.weight = data.weight;
  if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;

  await db.update(products).set(updateData).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(products).where(eq(products.id, id));
}


// ============================================
// CART FUNCTIONS (Persistent database implementation)
// ============================================

export async function getCart(userId: number) {
  const db = await getDb();
  if (!db) return { items: [], subtotalHT: 0, discountPercent: 0, discountAmount: 0, vatAmount: 0, totalTTC: 0 };

  // Get cart items from database
  const dbCartItems = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  
  if (dbCartItems.length === 0) {
    return { items: [], subtotalHT: 0, discountPercent: 0, discountAmount: 0, vatAmount: 0, totalTTC: 0 };
  }

  // Get product details
  const items = [];
  for (const item of dbCartItems) {
    const product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    if (product[0]) {
      // Get variant if specified
      let variant = null;
      if (item.variantId) {
        const variantResult = await db.select().from(productVariants).where(eq(productVariants.id, item.variantId)).limit(1);
        variant = variantResult[0] || null;
      }
      
      const unitPrice = variant?.pricePartnerHT || product[0].pricePartnerHT || product[0].pricePublicHT || 0;
      
      items.push({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        isPreorder: item.isPreorder,
        product: product[0],
        variant: variant,
        unitPriceHT: unitPrice,
      });
    }
  }

  // Get user's partner discount
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  let discountPercent = 0;
  
  if (user[0]?.partnerId) {
    const partner = await db.select().from(partners).where(eq(partners.id, user[0].partnerId)).limit(1);
    discountPercent = typeof partner[0]?.discountPercent === 'string' ? parseFloat(partner[0].discountPercent) : (partner[0]?.discountPercent || 0);
  }

  // Calculate totals
  let subtotalHT = 0;
  for (const item of items) {
    const price = typeof item.unitPriceHT === 'string' ? parseFloat(item.unitPriceHT) : item.unitPriceHT;
    subtotalHT += price * item.quantity;
  }

  const discountAmount = (subtotalHT * discountPercent) / 100;
  const subtotalAfterDiscount = subtotalHT - discountAmount;
  const vatAmount = subtotalAfterDiscount * 0.21; // Default 21% VAT
  const totalTTC = subtotalAfterDiscount + vatAmount;

  return {
    items,
    subtotalHT,
    discountPercent,
    discountAmount,
    vatAmount,
    totalTTC,
  };
}

export async function addToCart(userId: number, productId: number, quantity: number, isPreorder: boolean = false, variantId?: number) {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  try {
    // Check if item already exists in cart
    const existing = await db.select().from(cartItems).where(
      and(
        eq(cartItems.userId, userId),
        eq(cartItems.productId, productId),
        variantId ? eq(cartItems.variantId, variantId) : sql`${cartItems.variantId} IS NULL`
      )
    ).limit(1);

    if (existing[0]) {
      // Replace quantity instead of accumulating
      await db.update(cartItems)
        .set({ quantity: quantity })
        .where(eq(cartItems.id, existing[0].id));
    } else {
      // Insert new item
      await db.insert(cartItems).values({
        userId,
        productId,
        variantId: variantId || null,
        quantity,
        isPreorder,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error adding to cart:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCartQuantity(userId: number, productId: number, quantity: number, variantId?: number) {
  const db = await getDb();
  if (!db) return { success: false };

  try {
    await db.update(cartItems)
      .set({ quantity })
      .where(
        and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productId),
          variantId ? eq(cartItems.variantId, variantId) : sql`${cartItems.variantId} IS NULL`
        )
      );
    return { success: true };
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    return { success: false };
  }
}

export async function removeFromCart(userId: number, productId: number, variantId?: number) {
  const db = await getDb();
  if (!db) return { success: false };

  try {
    await db.delete(cartItems).where(
      and(
        eq(cartItems.userId, userId),
        eq(cartItems.productId, productId),
        variantId ? eq(cartItems.variantId, variantId) : sql`${cartItems.variantId} IS NULL`
      )
    );
    return { success: true };
  } catch (error) {
    console.error("Error removing from cart:", error);
    return { success: false };
  }
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) return { success: false };

  try {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return { success: true };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return { success: false };
  }
}

// ============================================
// FAVORITES FUNCTIONS
// ============================================

export async function getFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const favs = await db.select().from(favorites).where(eq(favorites.userId, userId));
  
  // Get product details for each favorite
  const result = [];
  for (const fav of favs) {
    const product = await db.select().from(products).where(eq(products.id, fav.productId)).limit(1);
    if (product[0]) {
      result.push({
        id: fav.id,
        productId: fav.productId,
        product: product[0],
        createdAt: fav.createdAt,
      });
    }
  }
  
  return result;
}

export async function addToFavorites(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return { success: false };

  try {
    await db.insert(favorites).values({ userId, productId });
    return { success: true };
  } catch (error: any) {
    // Ignore duplicate key error
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: true, alreadyExists: true };
    }
    console.error("Error adding to favorites:", error);
    return { success: false, error: error.message };
  }
}

export async function removeFromFavorites(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return { success: false };

  try {
    await db.delete(favorites).where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.productId, productId)
      )
    );
    return { success: true };
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return { success: false };
  }
}

export async function isFavorite(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(favorites).where(
    and(
      eq(favorites.userId, userId),
      eq(favorites.productId, productId)
    )
  ).limit(1);
  
  return result.length > 0;
}


// ============================================
// PRODUCT VARIANTS FUNCTIONS
// ============================================

export async function getProductVariantById(variantId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getProductVariants(productId: number) {
  const db = await getDb();
  if (!db) return [];

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  // Get options for each variant
  const variantsWithOptions = [];
  for (const variant of variants) {
    const options = await db
      .select()
      .from(variantOptions)
      .where(eq(variantOptions.variantId, variant.id));
    
    variantsWithOptions.push({
      ...variant,
      options,
    });
  }

  return variantsWithOptions;
}

export async function createProductVariant(data: {
  productId: number;
  sku: string;
  name: string;
  priceAdjustmentHT?: number;
  stockQuantity?: number;
  isDefault?: boolean;
  options: Array<{ optionName: string; optionValue: string }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Extract specific options for the existing structure
  const color = data.options.find(o => o.optionName === "Couleur" || o.optionName === "Color")?.optionValue;
  const size = data.options.find(o => o.optionName === "Taille" || o.optionName === "Size")?.optionValue;
  const voltage = data.options.find(o => o.optionName === "Voltage")?.optionValue;
  const material = data.options.find(o => o.optionName === "Matériau" || o.optionName === "Material")?.optionValue;

  // Insert variant using existing structure
  const result = await db.insert(productVariants).values({
    productId: data.productId,
    sku: data.sku,
    name: data.name,
    color: color || null,
    size: size || null,
    voltage: voltage || null,
    material: material || null,
    stockQuantity: data.stockQuantity || 0,
    isActive: true,
  });

  const variantId = result[0].insertId;

  // Also insert in variant_options for flexibility
  if (data.options && data.options.length > 0) {
    for (const option of data.options) {
      await db.insert(variantOptions).values({
        variantId,
        optionName: option.optionName,
        optionValue: option.optionValue,
      });
    }
  }

  return { id: variantId };
}

export async function updateProductVariant(
  id: number,
  data: {
    sku?: string;
    name?: string;
    color?: string;
    size?: string;
    voltage?: string;
    material?: string;
    stockQuantity?: number;
    imageUrl?: string;
    isActive?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.size !== undefined) updateData.size = data.size;
  if (data.voltage !== undefined) updateData.voltage = data.voltage;
  if (data.material !== undefined) updateData.material = data.material;
  if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await db.update(productVariants).set(updateData).where(eq(productVariants.id, id));
}

export async function deleteProductVariant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete options first (cascade should handle this, but being explicit)
  await db.delete(variantOptions).where(eq(variantOptions.variantId, id));
  
  // Delete variant
  await db.delete(productVariants).where(eq(productVariants.id, id));
}


// ============================================
// INCOMING STOCK FUNCTIONS
// ============================================

export async function getIncomingStock(filters?: {
  productId?: number;
  variantId?: number;
  status?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select({
      id: incomingStock.id,
      productId: incomingStock.productId,
      variantId: incomingStock.variantId,
      quantity: incomingStock.quantity,
      expectedWeek: incomingStock.expectedWeek,
      expectedYear: incomingStock.expectedYear,
      status: incomingStock.status,
      notes: incomingStock.notes,
      arrivedAt: incomingStock.arrivedAt,
      createdAt: incomingStock.createdAt,
      updatedAt: incomingStock.updatedAt,
      product: products,
    })
    .from(incomingStock)
    .leftJoin(products, eq(incomingStock.productId, products.id));

  const conditions = [];
  if (filters?.productId) {
    conditions.push(eq(incomingStock.productId, filters.productId));
  }
  if (filters?.variantId) {
    conditions.push(eq(incomingStock.variantId, filters.variantId));
  }
  if (filters?.status) {
    conditions.push(eq(incomingStock.status, filters.status as any));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const result = await query.orderBy(desc(incomingStock.expectedYear), desc(incomingStock.expectedWeek));
  return result || [];
}

export async function createIncomingStock(data: {
  productId?: number;
  variantId?: number;
  quantity: number;
  expectedWeek: number;
  expectedYear: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(incomingStock).values({
    productId: data.productId || null,
    variantId: data.variantId || null,
    quantity: data.quantity,
    expectedWeek: data.expectedWeek,
    expectedYear: data.expectedYear,
    notes: data.notes || null,
    status: "PENDING",
  });

  return { id: result[0].insertId };
}

export async function updateIncomingStock(
  id: number,
  data: {
    quantity?: number;
    expectedWeek?: number;
    expectedYear?: number;
    status?: string;
    notes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.expectedWeek !== undefined) updateData.expectedWeek = data.expectedWeek;
  if (data.expectedYear !== undefined) updateData.expectedYear = data.expectedYear;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes;

  await db.update(incomingStock).set(updateData).where(eq(incomingStock.id, id));
}

export async function deleteIncomingStock(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(incomingStock).where(eq(incomingStock.id, id));
}

// Process incoming stock that has arrived (called by cron job or manually)
export async function processArrivedStock() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current ISO week and year
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const currentWeek = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);

  // Find all pending incoming stock that should have arrived
  const arrivedStock = await db
    .select()
    .from(incomingStock)
    .where(
      and(
        eq(incomingStock.status, "PENDING"),
        or(
          sql`${incomingStock.expectedYear} < ${currentYear}`,
          and(
            eq(incomingStock.expectedYear, currentYear),
            sql`${incomingStock.expectedWeek} <= ${currentWeek}`
          )
        )
      )
    );

  // Update stock quantities and mark as arrived
  for (const stock of arrivedStock) {
    if (stock.variantId) {
      // Update variant stock
      await db
        .update(productVariants)
        .set({
          stockQuantity: sql`${productVariants.stockQuantity} + ${stock.quantity}`,
        })
        .where(eq(productVariants.id, stock.variantId));
    } else if (stock.productId) {
      // Update product stock
      await db
        .update(products)
        .set({
          stockQuantity: sql`${products.stockQuantity} + ${stock.quantity}`,
        })
        .where(eq(products.id, stock.productId));
    }

    // Mark as arrived
    await db
      .update(incomingStock)
      .set({
        status: "ARRIVED",
        arrivedAt: new Date(),
      })
      .where(eq(incomingStock.id, stock.id));
  }

  return { processed: arrivedStock.length };
}




export async function deletePartner(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(partners).where(eq(partners.id, id));
}



// ============================================
// ORDER CREATION
// ============================================

import { orderItems } from "../drizzle/schema";

export async function generateOrderNumber(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  
  // Get the count of orders created today
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(
      and(
        sql`${orders.createdAt} >= ${startOfDay}`,
        sql`${orders.createdAt} < ${endOfDay}`
      )
    );
  
  const count = (result[0]?.count || 0) + 1;
  const sequence = count.toString().padStart(4, "0");
  
  return `CMD-${dateStr}-${sequence}`;
}

export interface CreateOrderInput {
  partnerId: number;
  createdById: number;
  items: Array<{
    productId: number;
    variantId?: number;
    sku: string;
    name: string;
    quantity: number;
    unitPriceHT: number;
    vatRate: number;
    discountPercent?: number;
    isPreorder?: boolean;
    incomingStockId?: number;
  }>;
  deliveryAddress: {
    street: string;
    street2?: string;
    city: string;
    postalCode: string;
    country: string;
    contactName: string;
    contactPhone: string;
    instructions?: string;
  };
  paymentMethod: string;
  customerNotes?: string;
  discountPercent?: number;
}

export async function createOrder(input: CreateOrderInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate order number
  const orderNumber = await generateOrderNumber();

  // Calculate totals
  let subtotalHT = 0;
  const itemsWithTotals = input.items.map((item) => {
    const itemDiscountPercent = item.discountPercent || input.discountPercent || 0;
    const itemDiscountAmount = (item.unitPriceHT * item.quantity * itemDiscountPercent) / 100;
    const itemTotalHT = item.unitPriceHT * item.quantity - itemDiscountAmount;
    const itemTotalVAT = (itemTotalHT * item.vatRate) / 100;
    const itemTotalTTC = itemTotalHT + itemTotalVAT;

    subtotalHT += itemTotalHT;

    return {
      ...item,
      discountPercent: itemDiscountPercent,
      discountAmount: itemDiscountAmount,
      totalHT: itemTotalHT,
      totalVAT: itemTotalVAT,
      totalTTC: itemTotalTTC,
    };
  });

  const orderDiscountPercent = input.discountPercent || 0;
  const orderDiscountAmount = (subtotalHT * orderDiscountPercent) / 100;
  const totalHT = subtotalHT - orderDiscountAmount;
  
  // Calculate VAT (average rate from items)
  const totalVAT = itemsWithTotals.reduce((sum, item) => sum + item.totalVAT, 0);
  const totalTTC = totalHT + totalVAT;

  // Deposit (30% by default)
  const depositPercent = 30;
  const depositAmount = (totalTTC * depositPercent) / 100;
  const balanceAmount = totalTTC - depositAmount;

  // Create the order
  await db.insert(orders).values({
    orderNumber,
    partnerId: input.partnerId,
    createdById: input.createdById,
    subtotalHT: subtotalHT.toFixed(2),
    discountAmount: orderDiscountAmount.toFixed(2),
    discountPercent: orderDiscountPercent.toFixed(2),
    shippingHT: "0.00",
    totalHT: totalHT.toFixed(2),
    totalVAT: totalVAT.toFixed(2),
    totalTTC: totalTTC.toFixed(2),
    depositPercent: depositPercent.toFixed(2),
    depositAmount: depositAmount.toFixed(2),
    depositPaid: false,
    balanceAmount: balanceAmount.toFixed(2),
    balancePaid: false,
    currency: "EUR",
    deliveryStreet: input.deliveryAddress.street,
    deliveryStreet2: input.deliveryAddress.street2 || null,
    deliveryCity: input.deliveryAddress.city,
    deliveryPostalCode: input.deliveryAddress.postalCode,
    deliveryCountry: input.deliveryAddress.country,
    deliveryContactName: input.deliveryAddress.contactName,
    deliveryContactPhone: input.deliveryAddress.contactPhone,
    deliveryInstructions: input.deliveryAddress.instructions || null,
    paymentMethod: input.paymentMethod,
    status: "PENDING_APPROVAL",
    customerNotes: input.customerNotes || null,
  });

  // Get the created order by orderNumber
  const createdOrder = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  const orderId = createdOrder[0].id;

  // Create order items
  for (const item of itemsWithTotals) {
    await db.insert(orderItems).values({
      orderId,
      productId: item.productId,
      variantId: item.variantId || null,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPriceHT: item.unitPriceHT.toFixed(2),
      discountPercent: item.discountPercent.toFixed(2),
      discountAmount: item.discountAmount.toFixed(2),
      totalHT: item.totalHT.toFixed(2),
      vatRate: item.vatRate.toFixed(2),
      totalVAT: item.totalVAT.toFixed(2),
      totalTTC: item.totalTTC.toFixed(2),
    });

    // Update stock if not a preorder
    if (!item.isPreorder) {
      if (item.variantId) {
        await db
          .update(productVariants)
          .set({
            stockQuantity: sql`${productVariants.stockQuantity} - ${item.quantity}`,
          })
          .where(eq(productVariants.id, item.variantId));
      } else {
        await db
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
          })
          .where(eq(products.id, item.productId));
      }
    } else if (item.isPreorder && item.incomingStockId) {
      // Décrémenter le stock d'arrivage programmé pour les précommandes
      await db
        .update(incomingStock)
        .set({
          quantity: sql`${incomingStock.quantity} - ${item.quantity}`,
        })
        .where(eq(incomingStock.id, item.incomingStockId));
    }
  }

  // Update partner stats
  await db
    .update(partners)
    .set({
      totalOrders: sql`${partners.totalOrders} + 1`,
      lastOrderAt: new Date(),
    })
    .where(eq(partners.id, input.partnerId));

  return {
    orderId,
    orderNumber,
    totalHT,
    totalVAT,
    totalTTC,
    depositAmount,
    balanceAmount,
  };
}

export async function getOrderWithItems(orderId: number) {
  const db = await getDb();
  if (!db) return null;

  const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (order.length === 0) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  return {
    ...order[0],
    items,
  };
}

export async function updateOrderStatus(orderId: number, status: string, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(orders)
    .set({ 
      status: status as any,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  return { success: true };
}


// ============================================
// NOTIFICATION FUNCTIONS
// ============================================

export async function getUserNotifications(
  userId: number,
  options: { limit?: number; unreadOnly?: boolean }
) {
  const db = await getDb();
  if (!db) return [];

  if (options.unreadOnly) {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(options.limit || 20);
  }

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(options.limit || 20);
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return { count: 0 };

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );

  return { count: result[0]?.count || 0 };
}

type NotificationType = "ORDER_CREATED" | "ORDER_STATUS_CHANGED" | "PAYMENT_RECEIVED" | "PAYMENT_FAILED" | "INVOICE_READY" | "STOCK_LOW" | "NEW_PARTNER" | "PARTNER_APPROVED" | "NEW_RESOURCE" | "SYSTEM_ALERT";

export async function createNotification(data: {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  linkText?: string;
}) {
  const db = await getDb();
  if (!db) return;

  await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    linkUrl: data.linkUrl || null,
    linkText: data.linkText || null,
  });
}

// Helper to notify all admins
export async function notifyAdmins(data: {
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  linkText?: string;
}) {
  const db = await getDb();
  if (!db) return;

  const admins = await db
    .select()
    .from(users)
    .where(
      or(
        eq(users.role, "SUPER_ADMIN"),
        eq(users.role, "ADMIN")
      )
    );

  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: data.type,
      title: data.title,
      message: data.message,
      linkUrl: data.linkUrl,
      linkText: data.linkText,
    });
  }
}

// Helper to notify partner users
export async function notifyPartnerUsers(partnerId: number, data: {
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  linkText?: string;
}) {
  const db = await getDb();
  if (!db) return;

  const partnerUsers = await db
    .select()
    .from(users)
    .where(eq(users.partnerId, partnerId));

  for (const user of partnerUsers) {
    await createNotification({
      userId: user.id,
      ...data,
    });
  }
}


// ============================================
// STOCK ALERTS
// ============================================

const LOW_STOCK_THRESHOLD = 5;

export async function getLowStockProducts(threshold: number = LOW_STOCK_THRESHOLD) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(products)
    .where(
      and(
        lte(products.stockQuantity, threshold),
        eq(products.isActive, true)
      )
    )
    .orderBy(asc(products.stockQuantity));

  return result;
}

export async function getLowStockVariants(threshold: number = LOW_STOCK_THRESHOLD) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      variant: productVariants,
      product: products,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(
      and(
        lte(productVariants.stockQuantity, threshold),
        eq(productVariants.isActive, true)
      )
    )
    .orderBy(asc(productVariants.stockQuantity));

  return result;
}

export async function checkAndCreateStockAlerts() {
  const db = await getDb();
  if (!db) return { created: 0, products: [] };

  const lowStockProducts = await getLowStockProducts();
  const lowStockVariants = await getLowStockVariants();
  
  const alerts: { name: string; sku: string; stock: number; type: string }[] = [];

  // Create notifications for low stock products
  for (const product of lowStockProducts) {
    alerts.push({
      name: product.name,
      sku: product.sku,
      stock: product.stockQuantity || 0,
      type: 'product',
    });
  }

  // Create notifications for low stock variants
  for (const { variant, product } of lowStockVariants) {
    alerts.push({
      name: `${product.name} - ${variant.name}`,
      sku: variant.sku,
      stock: variant.stockQuantity || 0,
      type: 'variant',
    });
  }

  return { created: alerts.length, products: alerts };
}

// ============================================
// ADMIN DASHBOARD STATS
// ============================================

export async function getAdminDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Total partners
  const totalPartnersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(partners);
  const totalPartners = totalPartnersResult[0]?.count || 0;

  // Active partners (approved)
  const activePartnersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(partners)
    .where(eq(partners.status, 'APPROVED'));
  const activePartners = activePartnersResult[0]?.count || 0;

  // Pending partners
  const pendingPartnersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(partners)
    .where(eq(partners.status, 'PENDING'));
  const pendingPartners = pendingPartnersResult[0]?.count || 0;

  // Total products
  const totalProductsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.isActive, true));
  const totalProducts = totalProductsResult[0]?.count || 0;

  // Low stock products count
  const lowStockResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(
      and(
        lte(products.stockQuantity, LOW_STOCK_THRESHOLD),
        eq(products.isActive, true)
      )
    );
  const lowStockCount = lowStockResult[0]?.count || 0;

  // Total orders this month
  const ordersThisMonthResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(gte(orders.createdAt, startOfMonth));
  const ordersThisMonth = ordersThisMonthResult[0]?.count || 0;

  // Total orders last month
  const ordersLastMonthResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startOfLastMonth),
        lte(orders.createdAt, endOfLastMonth)
      )
    );
  const ordersLastMonth = ordersLastMonthResult[0]?.count || 0;

  // Revenue this month
  const revenueThisMonthResult = await db
    .select({ total: sql<number>`COALESCE(SUM(total_ttc), 0)` })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startOfMonth),
        sql`status != 'CANCELLED'`
      )
    );
  const revenueThisMonth = Number(revenueThisMonthResult[0]?.total || 0);

  // Revenue last month
  const revenueLastMonthResult = await db
    .select({ total: sql<number>`COALESCE(SUM(total_ttc), 0)` })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startOfLastMonth),
        lte(orders.createdAt, endOfLastMonth),
        sql`status != 'CANCELLED'`
      )
    );
  const revenueLastMonth = Number(revenueLastMonthResult[0]?.total || 0);

  // Pending orders
  const pendingOrdersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, 'PENDING_APPROVAL'));
  const pendingOrders = pendingOrdersResult[0]?.count || 0;

  return {
    partners: {
      total: totalPartners,
      active: activePartners,
      pending: pendingPartners,
    },
    products: {
      total: totalProducts,
      lowStock: lowStockCount,
    },
    orders: {
      thisMonth: ordersThisMonth,
      lastMonth: ordersLastMonth,
      pending: pendingOrders,
      growth: ordersLastMonth > 0 
        ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth * 100).toFixed(1)
        : '0',
    },
    revenue: {
      thisMonth: revenueThisMonth,
      lastMonth: revenueLastMonth,
      growth: revenueLastMonth > 0 
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100).toFixed(1)
        : '0',
    },
  };
}

// ============================================
// ACTIVITY LOGS
// ============================================

export async function getRecentActivity(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  // Get recent orders
  const recentOrders = await db
    .select({
      id: orders.id,
      type: sql<string>`'order'`,
      title: sql<string>`CONCAT('Commande #', order_number)`,
      description: sql<string>`CONCAT('Statut: ', status)`,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  // Get recent partner registrations
  const recentPartners = await db
    .select({
      id: partners.id,
      type: sql<string>`'partner'`,
      title: sql<string>`CONCAT('Nouveau partenaire: ', company_name)`,
      description: sql<string>`CONCAT('Statut: ', status)`,
      createdAt: partners.createdAt,
    })
    .from(partners)
    .orderBy(desc(partners.createdAt))
    .limit(limit);

  // Combine and sort by date
  const combined = [...recentOrders, ...recentPartners]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, limit);

  return combined;
}


// ============================================
// FAVORITES (extended)
// ============================================

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: favorites.id,
      productId: favorites.productId,
      createdAt: favorites.createdAt,
      product: {
        id: products.id,
        name: products.name,
        sku: products.sku,
        pricePublicHT: products.pricePublicHT,
        pricePartnerHT: products.pricePartnerHT,
        stockQuantity: products.stockQuantity,
        category: products.category,
      }
    })
    .from(favorites)
    .innerJoin(products, eq(favorites.productId, products.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

  return result;
}


// ============================================
// REORDER FROM PREVIOUS ORDER
// ============================================

export async function reorderFromOrder(userId: number, orderId: number) {
  const db = await getDb();
  if (!db) return { success: false, message: 'Database not available' };

  // Get order items
  const orderItems = await db
    .select()
    .from(sql`order_items`)
    .where(sql`order_id = ${orderId}`);

  if (orderItems.length === 0) {
    return { success: false, message: 'Order not found or empty' };
  }

  // Add each item to cart
  for (const item of orderItems) {
    await addToCart(userId, (item as any).product_id, (item as any).quantity, false, (item as any).variant_id);
  }

  return { success: true, itemsAdded: orderItems.length };
}

// ============================================
// QUICK SEARCH BY SKU
// ============================================

export async function searchProductsBySku(searchTerm: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(products)
    .where(
      or(
        sql`sku LIKE ${`%${searchTerm}%`}`,
        sql`name LIKE ${`%${searchTerm}%`}`
      )
    )
    .limit(limit);

  return result;
}

// ============================================
// TODAY'S ORDERS FOR ADMIN
// ============================================

export async function getTodayOrders() {
  const db = await getDb();
  if (!db) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalTTC: orders.totalTTC,
      createdAt: orders.createdAt,
      partnerId: orders.partnerId,
    })
    .from(orders)
    .where(gte(orders.createdAt, today))
    .orderBy(desc(orders.createdAt));

  return result;
}

// ============================================
// QUICK ORDER VALIDATION
// ============================================

export async function quickValidateOrder(orderId: number, adminUserId: number) {
  const db = await getDb();
  if (!db) return { success: false, message: 'Database not available' };

  // Update order status to DEPOSIT_PAID (validated)
  await db
    .update(orders)
    .set({ 
      status: 'DEPOSIT_PAID',
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // Create notification for the partner
  const order = await db
    .select({ partnerId: orders.partnerId, orderNumber: orders.orderNumber })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (order[0]?.partnerId) {
    // Get partner's user
    const partnerUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.partnerId, order[0].partnerId))
      .limit(1);

    if (partnerUsers[0]) {
      await createNotification({
        userId: partnerUsers[0].id,
        type: 'ORDER_STATUS_CHANGED',
        title: 'Commande approuvée',
        message: `Votre commande #${order[0].orderNumber} a été approuvée et est en cours de traitement.`,
        linkUrl: `/orders/${orderId}`,
      });
    }
  }

  return { success: true, message: 'Order validated successfully' };
}

// ============================================
// EXPORT TODAY'S ORDERS AS CSV DATA
// ============================================

export async function getTodayOrdersForExport() {
  const db = await getDb();
  if (!db) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db
    .select({
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalHT: orders.totalHT,
      totalTTC: orders.totalTTC,
      createdAt: orders.createdAt,
      partnerName: partners.companyName,
      partnerEmail: partners.primaryContactEmail,
      deliveryStreet: orders.deliveryStreet,
      deliveryCity: orders.deliveryCity,
      deliveryPostalCode: orders.deliveryPostalCode,
    })
    .from(orders)
    .leftJoin(partners, eq(orders.partnerId, partners.id))
    .where(gte(orders.createdAt, today))
    .orderBy(desc(orders.createdAt));

  return result;
}


// ==================== EVENTS ====================

export async function getEvents(filters?: { type?: string }) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(events);
  
  if (filters?.type && filters.type !== 'all') {
    query = query.where(eq(events.type, filters.type as any)) as any;
  }
  
  return query.orderBy(desc(events.startDate));
}

export async function getUpcomingEvents(limit = 5) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return db.select()
    .from(events)
    .where(gte(events.startDate, now))
    .orderBy(asc(events.startDate))
    .limit(limit);
}

export async function createEvent(data: {
  title: string;
  description?: string;
  type: 'PROMOTION' | 'EVENT' | 'ANNOUNCEMENT' | 'TRAINING' | 'WEBINAR';
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  imageUrl?: string;
  discountPercent?: number;
  promoCode?: string;
  isPublished?: boolean;
  createdBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(events).values({
    title: data.title,
    description: data.description || null,
    type: data.type,
    startDate: data.startDate,
    endDate: data.endDate || null,
    allDay: data.allDay || false,
    imageUrl: data.imageUrl || null,
    discountPercent: data.discountPercent?.toString() || null,
    promoCode: data.promoCode || null,
    isPublished: data.isPublished || false,
    createdBy: data.createdBy || null,
  });
  return result;
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(events).where(eq(events.id, id));
}

// ==================== LEADS ====================

export async function getLeads(filters?: { 
  status?: string; 
  partnerId?: number; 
  source?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select()
  .from(leads)
  .leftJoin(partners, eq(leads.assignedPartnerId, partners.id));
  
  const conditions = [];
  
  if (filters?.status && filters.status !== 'all') {
    conditions.push(eq(leads.status, filters.status as any));
  }
  if (filters?.partnerId) {
    conditions.push(eq(leads.assignedPartnerId, filters.partnerId));
  }
  if (filters?.source && filters.source !== 'all') {
    conditions.push(eq(leads.source, filters.source as any));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.orderBy(desc(leads.receivedAt));
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
  .from(leads)
  .where(eq(leads.id, id))
  .limit(1);
  
  return result[0] || null;
}

export async function getLeadsByPartnerId(partnerId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select()
    .from(leads)
    .where(eq(leads.assignedPartnerId, partnerId))
    .orderBy(desc(leads.receivedAt));
}

export async function createLead(data: {
  metaLeadgenId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  source: 'META_ADS' | 'GOOGLE_ADS' | 'WEBSITE' | 'REFERRAL' | 'PHONE' | 'EMAIL' | 'TRADE_SHOW' | 'OTHER';
  metaCampaignId?: string;
  metaAdsetId?: string;
  metaAdId?: string;
  metaFormId?: string;
  productInterest?: string;
  budget?: string;
  message?: string;
  assignedPartnerId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(leads).values({
    metaLeadgenId: data.metaLeadgenId || null,
    firstName: data.firstName || null,
    lastName: data.lastName || null,
    email: data.email || null,
    phone: data.phone || null,
    city: data.city || null,
    postalCode: data.postalCode || null,
    country: data.country || 'Belgium',
    source: data.source,
    metaCampaignId: data.metaCampaignId || null,
    metaAdsetId: data.metaAdsetId || null,
    metaAdId: data.metaAdId || null,
    metaFormId: data.metaFormId || null,
    productInterest: data.productInterest || null,
    budget: data.budget || null,
    message: data.message || null,
    assignedPartnerId: data.assignedPartnerId || null,
    status: data.assignedPartnerId ? 'ASSIGNED' : 'NEW',
    contactAttempts: 0,
  });
  
  return result;
}

export async function updateLeadStatus(
  id: number, 
  status: string, 
  userId: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Mettre à jour le lead
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };
  
  // Si c'est le premier contact
  if (status === 'CONTACTED') {
    const lead = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    if (lead[0] && !lead[0].firstContactAt) {
      updateData.firstContactAt = new Date();
    }
  }
  
  // Incrémenter les tentatives de contact
  if (status === 'NO_RESPONSE') {
    await db.update(leads)
      .set({ contactAttempts: sql`contact_attempts + 1` })
      .where(eq(leads.id, id));
  }
  
  await db.update(leads)
    .set(updateData)
    .where(eq(leads.id, id));
  
  // Ajouter à l'historique
  await db.insert(leadStatusHistory).values({
    leadId: id,
    newStatus: status as any,
    changedBy: userId,
    notes: notes || null,
  });
  
  return { success: true };
}

export async function assignLeadToPartner(leadId: number, partnerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(leads)
    .set({ 
      assignedPartnerId: partnerId, 
      status: 'ASSIGNED',
      assignedAt: new Date(),
    })
    .where(eq(leads.id, leadId));
  
  return { success: true };
}

export async function getLeadStats(partnerId?: number) {
  const db = await getDb();
  if (!db) return {
    total: 0,
    new: 0,
    assigned: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    lost: 0,
    conversionRate: 0,
    contactRate: 0,
  };

  let query = db.select().from(leads);
  if (partnerId) {
    query = query.where(eq(leads.assignedPartnerId, partnerId)) as any;
  }
  
  const allLeads = await query;
  
  const stats = {
    total: allLeads.length,
    new: allLeads.filter(l => l.status === 'NEW').length,
    assigned: allLeads.filter(l => l.status === 'ASSIGNED').length,
    contacted: allLeads.filter(l => l.firstContactAt !== null).length,
    qualified: allLeads.filter(l => l.status === 'QUALIFIED').length,
    converted: allLeads.filter(l => l.status === 'CONVERTED').length,
    lost: allLeads.filter(l => l.status === 'LOST').length,
    conversionRate: allLeads.length > 0 
      ? Math.round((allLeads.filter(l => l.status === 'CONVERTED').length / allLeads.length) * 100) 
      : 0,
    contactRate: allLeads.length > 0
      ? Math.round((allLeads.filter(l => l.firstContactAt !== null).length / allLeads.length) * 100)
      : 0,
  };
  
  return stats;
}

// ============================================
// PAYMENT TRANSACTIONS
// ============================================

export async function createPaymentTransaction(data: {
  orderId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  stripePaymentIntentId?: string;
  status: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get order to find partnerId
  const order = await db.select().from(orders).where(eq(orders.id, data.orderId)).limit(1);
  if (order.length === 0) {
    throw new Error(`Order ${data.orderId} not found`);
  }

  const [payment] = await db.insert(payments).values({
    partnerId: order[0].partnerId,
    orderId: data.orderId,
    amount: data.amount.toString(),
    currency: data.currency,
    method: data.paymentMethod,
    status: data.status as any,
    stripePaymentIntentId: data.stripePaymentIntentId,
    paidAt: data.status === "COMPLETED" ? new Date() : null,
    failedAt: data.status === "FAILED" ? new Date() : null,
    refundedAt: data.status === "REFUNDED" ? new Date() : null,
  });

  return payment;
}

export async function getPaymentTransactionByStripeId(stripePaymentIntentId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId))
    .limit(1);

  return result[0] || null;
}

export async function getPaymentsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(desc(payments.createdAt));
}


// ============================================
// ADVANCED ORDER MANAGEMENT
// ============================================

/**
 * Cancel an order and restore stock
 */
export async function cancelOrder(orderId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get order with items
  const order = await getOrderWithItems(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);

  // Restore stock for all items
  for (const item of order.items) {
    if (item.variantId) {
      await db
        .update(productVariants)
        .set({
          stockQuantity: sql`${productVariants.stockQuantity} + ${item.quantity}`,
        })
        .where(eq(productVariants.id, item.variantId));
    }
  }

  // Update order status to CANCELLED
  const updateData: any = { status: "CANCELLED" };
  if (reason) {
    updateData.internalNotes = sql`CONCAT(COALESCE(${orders.internalNotes}, ''), '\nAnnulation: ', ${reason})`;
  }
  await db.update(orders).set(updateData).where(eq(orders.id, orderId));

  return { success: true, message: "Commande annulée et stock restauré" };
}

/**
 * Create partial shipment for an order
 */
export async function createPartialShipment(data: {
  orderId: number;
  items: Array<{ orderItemId: number; quantity: number }>;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // TODO: Create shipments table in schema if needed
  // For now, we'll just update order status and add a note

  const shipmentNote = `Expédition partielle: ${data.items.length} articles\n${data.trackingNumber ? `Tracking: ${data.trackingNumber}` : ""}\n${data.carrier ? `Transporteur: ${data.carrier}` : ""}\n${data.notes || ""}`;

  await db
    .update(orders)
    .set({
      status: "SHIPPED",
      shippedAt: new Date(),
      trackingNumber: data.trackingNumber || null,
      shippingCarrier: data.carrier || null,
      internalNotes: sql`CONCAT(COALESCE(${orders.internalNotes}, ''), '\n', ${shipmentNote})`,
    })
    .where(eq(orders.id, data.orderId));

  return { success: true, message: "Expédition partielle enregistrée" };
}

/**
 * Process partial refund for an order
 * TODO: Fix TypeScript errors with payments table schema
 */
export async function processPartialRefund(data: {
  orderId: number;
  amount: number;
  reason: string;
  items?: Array<{ orderItemId: number; quantity: number }>;
}): Promise<{ success: boolean; message: string }> {
  // Temporarily disabled due to TypeScript schema issues
  return { success: false, message: "Feature temporarily disabled" };
  /*
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const order = await getOrderById(data.orderId);
  if (!order) throw new Error(`Order ${data.orderId} not found`);

  // Record refund transaction
  await db.insert(payments).values({
    partnerId: order.partnerId,
    orderId: data.orderId,
    amount: (-data.amount).toString(),
    currency: "EUR",
    method: "REFUND",
    status: "COMPLETED",
    paidAt: new Date(),
    refundReason: data.reason,
  });

  // If items are specified, restore their stock
  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      const orderItem = await db
        .select()
        .from(sql`order_items`)
        .where(sql`id = ${item.orderItemId}`)
        .limit(1);

      if (orderItem[0] && orderItem[0].productVariantId) {
        await db
          .update(productVariants)
          .set({
            stockQuantity: sql`${productVariants.stockQuantity} + ${item.quantity}`,
          })
          .where(eq(productVariants.id, orderItem[0].productVariantId));
      }
    }
  }

  return { success: true, message: "Remboursement partiel traité" };
  */
}


// ============================================
// ANALYTICS & CHARTS
// ============================================

/**
 * Get sales data by month for the last 12 months
 */
export async function getSalesByMonth(months: number = 12) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(sql`
    SELECT 
      DATE_FORMAT(createdAt, '%Y-%m') as month,
      COUNT(*) as orders,
      SUM(CAST(totalTTC as DECIMAL(12,2))) as sales
    FROM orders
    WHERE status NOT IN ('CANCELLED', 'DRAFT')
      AND createdAt >= DATE_SUB(NOW(), INTERVAL ${months} MONTH)
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
    ORDER BY month ASC
  `);

  return ((result as any).rows || []).map((row: any) => ({
    month: row.month,
    orders: Number(row.orders),
    sales: Number(row.sales) || 0,
  }));
}

/**
 * Get top selling products
 */
export async function getTopProducts(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(sql`
    SELECT 
      oi.name,
      oi.sku,
      SUM(oi.quantity) as quantity,
      SUM(CAST(oi.quantity * oi.unitPriceHT as DECIMAL(12,2))) as revenue
    FROM order_items oi
    INNER JOIN orders o ON oi.orderId = o.id
    WHERE o.status NOT IN ('CANCELLED', 'DRAFT')
    GROUP BY oi.name, oi.sku
    ORDER BY revenue DESC
    LIMIT ${limit}
  `);

  return ((result as any).rows || []).map((row: any) => ({
    name: row.name,
    sku: row.sku,
    quantity: Number(row.quantity),
    revenue: Number(row.revenue) || 0,
  }));
}

/**
 * Get partner performance data
 */
export async function getPartnerPerformance(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.execute(sql`
    SELECT 
      p.companyName,
      COUNT(o.id) as orders,
      SUM(CAST(o.totalTTC as DECIMAL(12,2))) as revenue,
      AVG(CAST(o.totalTTC as DECIMAL(12,2))) as avgOrderValue
    FROM partners p
    LEFT JOIN orders o ON p.id = o.partnerId AND o.status NOT IN ('CANCELLED', 'DRAFT')
    WHERE p.status = 'APPROVED'
    GROUP BY p.id, p.companyName
    HAVING orders > 0
    ORDER BY revenue DESC
    LIMIT ${limit}
  `);

  return ((result as any).rows || []).map((row: any) => ({
    companyName: row.companyName,
    orders: Number(row.orders),
    revenue: Number(row.revenue) || 0,
    avgOrderValue: Number(row.avgOrderValue) || 0,
  }));
}


// ============================================
// TECHNICAL RESOURCES
// ============================================

export async function getAllTechnicalResources(filters?: {
  type?: string;
  category?: string;
  productCategory?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];
  
  if (filters?.type) {
    conditions.push(eq(technicalResources.type, filters.type as any));
  }
  if (filters?.category) {
    conditions.push(eq(technicalResources.category, filters.category as any));
  }
  if (filters?.productCategory) {
    conditions.push(eq(technicalResources.productCategory, filters.productCategory as any));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(technicalResources.title, `%${filters.search}%`),
        like(technicalResources.description, `%${filters.search}%`)
      )
    );
  }

  const query = conditions.length > 0
    ? db.select().from(technicalResources).where(and(...conditions))
    : db.select().from(technicalResources);

  return await query.orderBy(desc(technicalResources.createdAt));
}

export async function getTechnicalResourceById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(technicalResources)
    .where(eq(technicalResources.id, id))
    .limit(1);

  return results[0] || null;
}

export async function createTechnicalResource(data: {
  title: string;
  description: string;
  type: string;
  fileUrl: string;
  category: string;
  productCategory?: string;
  tags?: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(technicalResources).values({
    ...data,
    type: data.type as any,
    category: data.category as any,
    productCategory: data.productCategory as any,
    viewCount: 0,
    createdAt: new Date(),
  });

  return result;
}

export async function updateTechnicalResource(
  id: number,
  data: Partial<{
    title: string;
    description: string;
    type: string;
    fileUrl: string;
    category: string;
    productCategory: string;
    tags: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { ...data };
  if (data.type) updateData.type = data.type as any;
  if (data.category) updateData.category = data.category as any;
  if (data.productCategory) updateData.productCategory = data.productCategory as any;

  return await db
    .update(technicalResources)
    .set(updateData)
    .where(eq(technicalResources.id, id));
}

export async function deleteTechnicalResource(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .delete(technicalResources)
    .where(eq(technicalResources.id, id));
}

export async function incrementResourceViewCount(id: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(technicalResources)
    .set({ viewCount: sql`${technicalResources.viewCount} + 1` })
    .where(eq(technicalResources.id, id));
}

// ============================================
// FORUM
// ============================================

export async function getAllForumTopics(filters?: {
  category?: string;
  productCategory?: string;
  status?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let conditions = [];
  
  if (filters?.category) {
    conditions.push(eq(forumTopics.category, filters.category as any));
  }
  if (filters?.productCategory) {
    conditions.push(eq(forumTopics.productCategory, filters.productCategory as any));
  }
  if (filters?.status) {
    conditions.push(eq(forumTopics.status, filters.status as any));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(forumTopics.title, `%${filters.search}%`),
        like(forumTopics.description, `%${filters.search}%`)
      )
    );
  }

  const query = conditions.length > 0
    ? db.select().from(forumTopics).where(and(...conditions))
    : db.select().from(forumTopics);

  return await query.orderBy(
    desc(forumTopics.isPinned),
    desc(forumTopics.createdAt)
  );
}

export async function getForumTopicById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select({
      id: forumTopics.id,
      title: forumTopics.title,
      description: forumTopics.description,
      category: forumTopics.category,
      productCategory: forumTopics.productCategory,
      status: forumTopics.status,
      authorId: forumTopics.authorId,
      authorName: users.name,
      viewCount: forumTopics.viewCount,
      replyCount: forumTopics.replyCount,
      lastReplyAt: forumTopics.lastReplyAt,
      lastReplyBy: forumTopics.lastReplyBy,
      isPinned: forumTopics.isPinned,
      createdAt: forumTopics.createdAt,
      updatedAt: forumTopics.updatedAt,
    })
    .from(forumTopics)
    .leftJoin(users, eq(forumTopics.authorId, users.id))
    .where(eq(forumTopics.id, id))
    .limit(1);

  return results[0] || null;
}

export async function createForumTopic(data: {
  title: string;
  description: string;
  category: string;
  productCategory?: string;
  authorId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(forumTopics).values({
    ...data,
    category: data.category as any,
    productCategory: data.productCategory as any,
    status: "OPEN",
    viewCount: 0,
    replyCount: 0,
    isPinned: false,
    createdAt: new Date(),
  });

  return result;
}

export async function getForumRepliesByTopicId(topicId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: forumReplies.id,
      topicId: forumReplies.topicId,
      authorId: forumReplies.authorId,
      authorName: users.name,
      content: forumReplies.content,
      isAdminReply: forumReplies.isAdminReply,
      isHelpful: forumReplies.isHelpful,
      helpfulCount: forumReplies.helpfulCount,
      createdAt: forumReplies.createdAt,
      updatedAt: forumReplies.updatedAt,
    })
    .from(forumReplies)
    .leftJoin(users, eq(forumReplies.authorId, users.id))
    .where(eq(forumReplies.topicId, topicId))
    .orderBy(forumReplies.createdAt);
}

export async function createForumReply(data: {
  topicId: number;
  authorId: number;
  content: string;
  isAdminReply: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(forumReplies).values({
    ...data,
    isHelpful: false,
    helpfulCount: 0,
    createdAt: new Date(),
  });

  // Increment reply count
  await db
    .update(forumTopics)
    .set({ replyCount: sql`${forumTopics.replyCount} + 1` })
    .where(eq(forumTopics.id, data.topicId));

  return result;
}

export async function markTopicAsResolved(topicId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(forumTopics)
    .set({ status: "RESOLVED" })
    .where(eq(forumTopics.id, topicId));
}

export async function markReplyAsHelpful(replyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(forumReplies)
    .set({
      isHelpful: true,
      helpfulCount: sql`${forumReplies.helpfulCount} + 1`,
    })
    .where(eq(forumReplies.id, replyId));
}

export async function incrementTopicViewCount(topicId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(forumTopics)
    .set({ viewCount: sql`${forumTopics.viewCount} + 1` })
    .where(eq(forumTopics.id, topicId));
}

// ============================================
// STOCK FORECAST FUNCTIONS
// ============================================

/**
 * Calculate stock forecast for the next N weeks
 * Takes into account:
 * - Current stock
 * - Incoming stock (scheduled arrivals)
 * - Preorders (reserved stock from incoming)
 */
export async function getStockForecast(weeks: number = 8) {
  const db = await getDb();
  if (!db) return [];

  // Get current week and year
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();

  // Get all products with their current stock
  const allProducts = await db.select().from(products);

  // Get all incoming stock (PENDING)
  const allIncomingStock = await db
    .select()
    .from(incomingStock)
    .where(eq(incomingStock.status, "PENDING"));

  // Get all preorders (orders with isPreorder = true)
  const preorders = await db
    .select({
      productId: orderItems.productId,
      variantId: orderItems.variantId,
      quantity: orderItems.quantity,
      incomingStockId: sql<number>`NULL`, // TODO: Add this field to orderItems table
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orders.status, "PENDING_APPROVAL"));

  // Build forecast for each product
  const forecasts = [];

  for (const product of allProducts) {
    const forecast = {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      currentStock: product.stockQuantity,
      weeks: [] as Array<{
        weekNumber: number;
        year: number;
        weekLabel: string;
        projectedStock: number;
        incomingQuantity: number;
        preorderQuantity: number;
        alerts: string[];
      }>,
    };

    let runningStock: number = product.stockQuantity || 0;

    // Calculate for each week
    for (let i = 0; i < weeks; i++) {
      const { week, year } = addWeeks(currentWeek, currentYear, i);
      
      // Find incoming stock for this week
      const incoming = allIncomingStock.filter(
        (stock: any) =>
          stock.productId === product.id &&
          stock.expectedWeek === week &&
          stock.expectedYear === year
      );

      const incomingQuantity = incoming.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0);

      // Find preorders for this week (approximation - we don't have exact week data)
      // For now, we'll distribute preorders evenly across weeks
      const productPreorders = preorders.filter((po: any) => po.productId === product.id);
      const preorderQuantity = 0; // TODO: Calculate based on expected delivery week

      // Calculate projected stock
      runningStock += incomingQuantity - preorderQuantity;

      // Generate alerts
      const alerts: string[] = [];
      if (runningStock < 0) {
        alerts.push("RUPTURE");
      } else if (runningStock < 5) {
        alerts.push("STOCK_CRITIQUE");
      } else if (runningStock < 10) {
        alerts.push("STOCK_BAS");
      }

      forecast.weeks.push({
        weekNumber: week,
        year,
        weekLabel: `S${week} ${year}`,
        projectedStock: runningStock,
        incomingQuantity,
        preorderQuantity,
        alerts,
      });
    }

    forecasts.push(forecast);
  }

  return forecasts;
}

/**
 * Get detailed forecast for a specific product
 */
export async function getProductForecast(productId: number, weeks: number = 8) {
  const db = await getDb();
  if (!db) return null;

  // Get product details
  const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product.length) return null;

  // Get current week and year
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();

  // Get incoming stock for this product
  const productIncomingStock = await db
    .select()
    .from(incomingStock)
    .where(
      and(
        eq(incomingStock.productId, productId),
        eq(incomingStock.status, "PENDING")
      )
    );

  // Build weekly forecast
  const weeklyForecast = [];
  let runningStock: number = product[0].stockQuantity || 0;

  for (let i = 0; i < weeks; i++) {
    const { week, year } = addWeeks(currentWeek, currentYear, i);

    // Find incoming for this week
    const weekIncoming = productIncomingStock.filter(
      (stock: any) => stock.expectedWeek === week && stock.expectedYear === year
    );

    const incomingQuantity = weekIncoming.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0);

    // Update running stock
    runningStock += incomingQuantity;

    // Generate alerts
    const alerts: string[] = [];
    if (runningStock < 0) {
      alerts.push("RUPTURE");
    } else if (runningStock < 5) {
      alerts.push("STOCK_CRITIQUE");
    } else if (runningStock < 10) {
      alerts.push("STOCK_BAS");
    }

    weeklyForecast.push({
      weekNumber: week,
      year,
      weekLabel: `S${week} ${year}`,
      projectedStock: runningStock,
      incomingQuantity,
      incoming: (weekIncoming || []).map((stock: any) => ({
        id: stock.id,
        quantity: stock.quantity,
        notes: stock.notes,
      })),
      alerts,
    });
  }

  return {
    product: product[0],
    currentStock: product[0].stockQuantity,
    forecast: weeklyForecast,
  };
}

/**
 * Get summary statistics for stock forecast
 */
export async function getStockForecastSummary(weeks: number = 8) {
  const forecasts = await getStockForecast(weeks);

  const summary = {
    totalProducts: forecasts.length,
    productsWithAlerts: 0,
    productsWithRupture: 0,
    productsWithLowStock: 0,
    totalIncomingQuantity: 0,
    weeklyBreakdown: [] as Array<{
      weekLabel: string;
      totalIncoming: number;
      productsWithAlerts: number;
    }>,
  };

  // Calculate summary stats
  for (const forecast of forecasts) {
    let hasAlerts = false;
    let hasRupture = false;
    let hasLowStock = false;

    for (const week of forecast.weeks) {
      summary.totalIncomingQuantity += week.incomingQuantity;

      if (week.alerts.includes("RUPTURE")) {
        hasRupture = true;
        hasAlerts = true;
      } else if (week.alerts.includes("STOCK_CRITIQUE") || week.alerts.includes("STOCK_BAS")) {
        hasLowStock = true;
        hasAlerts = true;
      }
    }

    if (hasAlerts) summary.productsWithAlerts++;
    if (hasRupture) summary.productsWithRupture++;
    if (hasLowStock) summary.productsWithLowStock++;
  }

  // Build weekly breakdown
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();

  for (let i = 0; i < weeks; i++) {
    const { week, year } = addWeeks(currentWeek, currentYear, i);
    const weekLabel = `S${week} ${year}`;

    let totalIncoming = 0;
    let productsWithAlerts = 0;

    for (const forecast of forecasts) {
      const weekData = forecast.weeks[i];
      if (weekData) {
        totalIncoming += weekData.incomingQuantity;
        if (weekData.alerts.length > 0) {
          productsWithAlerts++;
        }
      }
    }

    summary.weeklyBreakdown.push({
      weekLabel,
      totalIncoming,
      productsWithAlerts,
    });
  }

  return summary;
}

/**
 * Helper function to add weeks to current week/year
 */
function addWeeks(currentWeek: number, currentYear: number, weeksToAdd: number): { week: number; year: number } {
  let week = currentWeek + weeksToAdd;
  let year = currentYear;

  while (week > 52) {
    week -= 52;
    year++;
  }

  return { week, year };
}

/**
 * Helper function to get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}


// ============================================
// TEAM MANAGEMENT
// ============================================

import { teamInvitations, teamMembers } from "../drizzle/schema";
import { getDefaultPermissions, generateInvitationToken } from "./team-permissions";

/**
 * Get all team members for a partner
 */
export async function getTeamMembers(partnerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      partnerId: teamMembers.partnerId,
      role: teamMembers.role,
      permissions: teamMembers.permissions,
      addedBy: teamMembers.addedBy,
      createdAt: teamMembers.createdAt,
      updatedAt: teamMembers.updatedAt,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
      },
    })
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.partnerId, partnerId))
    .orderBy(desc(teamMembers.createdAt));
}

/**
 * Get a specific team member
 */
export async function getTeamMember(userId: number, partnerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.partnerId, partnerId)))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Get all pending invitations for a partner
 */
export async function getTeamInvitations(partnerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select({
      id: teamInvitations.id,
      email: teamInvitations.email,
      partnerId: teamInvitations.partnerId,
      role: teamInvitations.role,
      permissions: teamInvitations.permissions,
      invitedBy: teamInvitations.invitedBy,
      status: teamInvitations.status,
      token: teamInvitations.token,
      expiresAt: teamInvitations.expiresAt,
      createdAt: teamInvitations.createdAt,
      acceptedAt: teamInvitations.acceptedAt,
      inviter: {
        id: users.id,
        email: users.email,
        name: users.name,
      },
    })
    .from(teamInvitations)
    .leftJoin(users, eq(teamInvitations.invitedBy, users.id))
    .where(eq(teamInvitations.partnerId, partnerId))
    .orderBy(desc(teamInvitations.createdAt));
}

/**
 * Create a team invitation
 */
export async function createTeamInvitation(data: {
  email: string;
  partnerId: number;
  role: string;
  permissions: string | null;
  invitedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

  // Get default permissions if not provided
  let permissionsJson = data.permissions;
  if (!permissionsJson) {
    const defaultPerms = getDefaultPermissions(data.role as any);
    permissionsJson = JSON.stringify(defaultPerms);
  }

  const result = await db.insert(teamInvitations).values({
    email: data.email,
    partnerId: data.partnerId,
    role: data.role as any,
    permissions: permissionsJson,
    invitedBy: data.invitedBy,
    status: "PENDING",
    token,
    expiresAt,
  });

  return {
    id: result[0].insertId,
    token,
    expiresAt,
  };
}

/**
 * Cancel a team invitation
 */
export async function cancelTeamInvitation(invitationId: number, partnerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(teamInvitations)
    .set({ status: "CANCELLED" })
    .where(and(eq(teamInvitations.id, invitationId), eq(teamInvitations.partnerId, partnerId)));

  return { success: true };
}

/**
 * Accept a team invitation
 */
export async function acceptTeamInvitation(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Find the invitation
  const invitation = await db
    .select()
    .from(teamInvitations)
    .where(and(eq(teamInvitations.token, token), eq(teamInvitations.status, "PENDING")))
    .limit(1);

  if (!invitation[0]) {
    throw new Error("Invitation not found or already used");
  }

  const inv = invitation[0];

  // Check if expired
  if (new Date() > inv.expiresAt) {
    await db
      .update(teamInvitations)
      .set({ status: "EXPIRED" })
      .where(eq(teamInvitations.id, inv.id));
    throw new Error("Invitation has expired");
  }

  // Check if user already exists with this email
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, inv.email))
    .limit(1);

  let userId: number;

  if (existingUser[0]) {
    userId = existingUser[0].id;

    // Check if already a member
    const existingMember = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, userId), eq(teamMembers.partnerId, inv.partnerId)))
      .limit(1);

    if (existingMember[0]) {
      throw new Error("User is already a team member");
    }
  } else {
    // Create a new user (they'll complete registration later)
    const newUser = await db.insert(users).values({
      openId: `team-invite-${inv.id}-${Date.now()}`, // Temporary openId
      email: inv.email,
      name: inv.email.split("@")[0],
      role: "PARTNER_USER",
      partnerId: inv.partnerId,
    });
    userId = newUser[0].insertId;
  }

  // Create team member
  await db.insert(teamMembers).values({
    userId,
    partnerId: inv.partnerId,
    role: inv.role,
    permissions: inv.permissions,
    addedBy: inv.invitedBy,
  });

  // Mark invitation as accepted
  await db
    .update(teamInvitations)
    .set({
      status: "ACCEPTED",
      acceptedAt: new Date(),
    })
    .where(eq(teamInvitations.id, inv.id));

  return {
    success: true,
    userId,
    partnerId: inv.partnerId,
  };
}

/**
 * Update team member permissions
 */
export async function updateTeamMemberPermissions(data: {
  id: number;
  partnerId: number;
  role: string;
  permissions: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get default permissions if not provided
  let permissionsJson = data.permissions;
  if (!permissionsJson) {
    const defaultPerms = getDefaultPermissions(data.role as any);
    permissionsJson = JSON.stringify(defaultPerms);
  }

  await db
    .update(teamMembers)
    .set({
      role: data.role as any,
      permissions: permissionsJson,
    })
    .where(and(eq(teamMembers.id, data.id), eq(teamMembers.partnerId, data.partnerId)));

  return { success: true };
}

/**
 * Remove a team member
 */
export async function removeTeamMember(memberId: number, partnerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.id, memberId), eq(teamMembers.partnerId, partnerId)));

  return { success: true };
}


// ============================================
// CSV IMPORT
// ============================================

export async function getProductBySKU(sku: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(products)
    .where(eq(products.sku, sku))
    .limit(1);
  
  return result[0] || null;
}

// ============================================
// RETURNS
// ============================================

export async function createReturn(data: {
  orderId: number;
  partnerId: number;
  items: Array<{
    productId: number;
    quantity: number;
    reason: string;
    reasonDetails?: string;
    unitPrice?: number;
  }>;
  notes?: string;
  photos?: Array<{ url: string; key: string; description?: string }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Calculate total amount
  const totalAmount = data.items.reduce((sum, item) => {
    return sum + (item.unitPrice || 0) * item.quantity;
  }, 0);
  
  // Import schema for returns
  const { returns: returnsTable, returnItems: returnItemsTable, returnPhotos: returnPhotosTable } = await import("../drizzle/schema");
  
  // Create return
  const [returnResult] = await db.insert(returnsTable).values({
    orderId: data.orderId,
    partnerId: data.partnerId,
    status: "REQUESTED",
    totalAmount: totalAmount.toString(),
    notes: data.notes,
  });
  
  const returnId = Number(returnResult.insertId);
  
  // Create return items
  if (data.items.length > 0) {
    await db.insert(returnItemsTable).values(
      data.items.map((item) => ({
        returnId,
        productId: item.productId,
        quantity: item.quantity,
        reason: item.reason as any,
        reasonDetails: item.reasonDetails,
        unitPrice: item.unitPrice?.toString(),
      }))
    );
  }
  
  // Create return photos
  if (data.photos && data.photos.length > 0) {
    await db.insert(returnPhotosTable).values(
      data.photos.map((photo) => ({
        returnId,
        photoUrl: photo.url,
        photoKey: photo.key,
        description: photo.description,
      }))
    );
  }
  
  return returnId;
}

export async function getReturns(filters?: {
  partnerId?: number;
  status?: string;
  orderId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const { returns: returnsTable } = await import("../drizzle/schema");
  
  let query = db
    .select({
      return: returnsTable,
      order: orders,
      partner: partners,
    })
    .from(returnsTable)
    .leftJoin(orders, eq(returnsTable.orderId, orders.id))
    .leftJoin(partners, eq(returnsTable.partnerId, partners.id));
  
  const conditions = [];
  if (filters?.partnerId) {
    conditions.push(eq(returnsTable.partnerId, filters.partnerId));
  }
  
  if (filters?.status) {
    conditions.push(eq(returnsTable.status, filters.status as any));
  }
  
  if (filters?.orderId) {
    conditions.push(eq(returnsTable.orderId, filters.orderId));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const results = await query;
  return results;
}

export async function getReturnById(returnId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { returns: returnsTable, returnItems: returnItemsTable, returnPhotos: returnPhotosTable } = await import("../drizzle/schema");
  
  const [returnData] = await db
    .select({
      return: returnsTable,
      order: orders,
      partner: partners,
    })
    .from(returnsTable)
    .leftJoin(orders, eq(returnsTable.orderId, orders.id))
    .leftJoin(partners, eq(returnsTable.partnerId, partners.id))
    .where(eq(returnsTable.id, returnId));
  
  if (!returnData) return null;
  
  // Get return items with product details
  const items = await db
    .select({
      item: returnItemsTable,
      product: products,
    })
    .from(returnItemsTable)
    .leftJoin(products, eq(returnItemsTable.productId, products.id))
    .where(eq(returnItemsTable.returnId, returnId));
  
  // Get return photos
  const photos = await db
    .select()
    .from(returnPhotosTable)
    .where(eq(returnPhotosTable.returnId, returnId));
  
  return {
    ...returnData,
    items,
    photos,
  };
}

export async function updateReturnStatus(
  returnId: number,
  status: string,
  adminNotes?: string,
  refundAmount?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { returns: returnsTable } = await import("../drizzle/schema");
  
  const updates: any = {
    status: status as any,
    updatedAt: new Date(),
  };
  
  if (adminNotes) {
    updates.adminNotes = adminNotes;
  }
  
  if (refundAmount !== undefined) {
    updates.refundAmount = refundAmount.toString();
  }
  
  // Set timestamp based on status
  if (status === "APPROVED") {
    updates.approvedAt = new Date();
  } else if (status === "REJECTED") {
    updates.rejectedAt = new Date();
  } else if (status === "RECEIVED") {
    updates.receivedAt = new Date();
  } else if (status === "REFUNDED") {
    updates.refundedAt = new Date();
  }
  
  await db
    .update(returnsTable)
    .set(updates)
    .where(eq(returnsTable.id, returnId));
  
  return true;
}

export async function addReturnNote(returnId: number, note: string, isAdmin: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { returns: returnsTable } = await import("../drizzle/schema");
  
  const [existing] = await db
    .select()
    .from(returnsTable)
    .where(eq(returnsTable.id, returnId));
  
  if (!existing) return false;
  
  if (isAdmin) {
    const currentNotes = existing.adminNotes || "";
    const newNotes = currentNotes
      ? `${currentNotes}\n---\n${new Date().toISOString()}: ${note}`
      : `${new Date().toISOString()}: ${note}`;
    
    await db
      .update(returnsTable)
      .set({ adminNotes: newNotes })
      .where(eq(returnsTable.id, returnId));
  } else {
    const currentNotes = existing.notes || "";
    const newNotes = currentNotes
      ? `${currentNotes}\n---\n${new Date().toISOString()}: ${note}`
      : `${new Date().toISOString()}: ${note}`;
    
    await db
      .update(returnsTable)
      .set({ notes: newNotes })
      .where(eq(returnsTable.id, returnId));
  }
  
  return true;
}

// ============================================
// AFTER-SALES SERVICE (SAV)
// ============================================

export async function createAfterSalesService(data: {
  partnerId: number;
  productId?: number;
  serialNumber: string;
  issueType: string;
  description: string;
  urgency: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  installationDate?: string;
  media?: Array<{ url: string; key: string; type: "IMAGE" | "VIDEO"; description?: string }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { afterSalesServices, afterSalesMedia } = await import("../drizzle/schema");
  
  // Generate unique ticket number
  const ticketNumber = `SAV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  // Create service
  const [result] = await db.insert(afterSalesServices).values({
    ticketNumber,
    partnerId: data.partnerId,
    productId: data.productId,
    serialNumber: data.serialNumber,
    issueType: data.issueType as any,
    description: data.description,
    urgency: data.urgency as any,
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

export async function getAfterSalesServices(filters?: {
  partnerId?: number;
  status?: string;
  urgency?: string;
  dateFrom?: string;
  dateTo?: string;
  customerName?: string;
  orderBy?: string;
  orderDirection?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const { afterSalesServices } = await import("../drizzle/schema");
  
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
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  // Apply sorting
  if (filters?.orderBy && filters?.orderDirection) {
    const column = filters.orderBy === 'createdAt' ? afterSalesServices.createdAt :
                   filters.orderBy === 'status' ? afterSalesServices.status :
                   filters.orderBy === 'urgency' ? afterSalesServices.urgency :
                   afterSalesServices.createdAt;
    
    query = (filters.orderDirection === 'asc' ? query.orderBy(asc(column)) : query.orderBy(desc(column))) as any;
  } else {
    // Default sort by createdAt desc
    query = query.orderBy(desc(afterSalesServices.createdAt)) as any;
  }
  
  const results = await query;
  return results;
}

export async function getAfterSalesServiceById(serviceId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { afterSalesServices, afterSalesMedia, afterSalesNotes } = await import("../drizzle/schema");
  
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
  
  return {
    ...serviceData,
    media,
    notes,
  };
}

export async function updateAfterSalesServiceStatus(
  serviceId: number,
  status: string,
  updates?: {
    assignedTechnicianId?: number;
    resolutionNotes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { afterSalesServices } = await import("../drizzle/schema");
  
  const updateData: any = {
    status: status as any,
    updatedAt: new Date(),
  };
  
  if (updates?.assignedTechnicianId) {
    updateData.assignedTechnicianId = updates.assignedTechnicianId;
    updateData.assignedAt = new Date();
  }
  
  if (updates?.resolutionNotes) {
    updateData.resolutionNotes = updates.resolutionNotes;
  }
  
  // Set timestamp based on status
  if (status === "RESOLVED") {
    updateData.resolvedAt = new Date();
  } else if (status === "CLOSED") {
    updateData.closedAt = new Date();
  }
  
  await db
    .update(afterSalesServices)
    .set(updateData)
    .where(eq(afterSalesServices.id, serviceId));
  
  return true;
}

export async function addAfterSalesNote(
  serviceId: number,
  userId: number,
  note: string,
  isInternal: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { afterSalesNotes } = await import("../drizzle/schema");
  
  await db.insert(afterSalesNotes).values({
    serviceId,
    userId,
    note,
    isInternal,
  });
  
  return true;
}


// ============================================
// AFTER SALES STATISTICS
// ============================================

export async function getAfterSalesStats() {
  const db = await getDb();
  if (!db) return null;
  
  const { afterSalesServices } = await import("../drizzle/schema");
  const { count, eq } = await import("drizzle-orm");
  
  // Total tickets
  const totalTickets = await db.select({ count: count() }).from(afterSalesServices);
  
  // Tickets by status
  const byStatus = await db
    .select({ 
      status: afterSalesServices.status, 
      count: count() 
    })
    .from(afterSalesServices)
    .groupBy(afterSalesServices.status);
  
  // Tickets by urgency
  const byUrgency = await db
    .select({ 
      urgency: afterSalesServices.urgency, 
      count: count() 
    })
    .from(afterSalesServices)
    .groupBy(afterSalesServices.urgency);
  
  // Tickets by partner
  const byPartner = await db
    .select({ 
      partnerId: afterSalesServices.partnerId, 
      count: count() 
    })
    .from(afterSalesServices)
    .groupBy(afterSalesServices.partnerId);
  
  return {
    totalTickets: totalTickets[0]?.count || 0,
    byStatus,
    byUrgency,
    byPartner,
  };
}

export async function getAfterSalesStatsByPartner(partnerId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { afterSalesServices } = await import("../drizzle/schema");
  const { count, eq } = await import("drizzle-orm");
  
  // Total tickets for partner
  const totalTickets = await db
    .select({ count: count() })
    .from(afterSalesServices)
    .where(eq(afterSalesServices.partnerId, partnerId));
  
  // Tickets by status for partner
  const byStatus = await db
    .select({ 
      status: afterSalesServices.status, 
      count: count() 
    })
    .from(afterSalesServices)
    .where(eq(afterSalesServices.partnerId, partnerId))
    .groupBy(afterSalesServices.status);
  
  // Tickets by urgency for partner
  const byUrgency = await db
    .select({ 
      urgency: afterSalesServices.urgency, 
      count: count() 
    })
    .from(afterSalesServices)
    .where(eq(afterSalesServices.partnerId, partnerId))
    .groupBy(afterSalesServices.urgency);
  
  return {
    totalTickets: totalTickets[0]?.count || 0,
    byStatus,
    byUrgency,
  };
}

export async function getAfterSalesWeeklyStats() {
  const db = await getDb();
  if (!db) return null;
  
  const { afterSalesServices } = await import("../drizzle/schema");
  const { count, sql } = await import("drizzle-orm");
  
  // Get weekly stats for the last 8 weeks
  // Use YEARWEEK() for TiDB compatibility
  const weeklyStats = await db
    .select({
      week: sql<string>`YEARWEEK(${afterSalesServices.createdAt}, 1)`,
      count: count(),
    })
    .from(afterSalesServices)
    .where(
      sql`${afterSalesServices.createdAt} >= DATE_SUB(NOW(), INTERVAL 8 WEEK)`
    )
    .groupBy(sql`YEARWEEK(${afterSalesServices.createdAt}, 1)`)
    .orderBy(sql`YEARWEEK(${afterSalesServices.createdAt}, 1)`);
  
  return weeklyStats;
}


// Get status history for a ticket
export async function getAfterSalesStatusHistory(serviceId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { afterSalesStatusHistory, users } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  return await db
    .select({
      id: afterSalesStatusHistory.id,
      serviceId: afterSalesStatusHistory.serviceId,
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
}

// Add status history entry
export async function addAfterSalesStatusHistory(
  serviceId: number,
  previousStatus: string | null,
  newStatus: string,
  changedBy: number,
  reason?: string
) {
  const db = await getDb();
  if (!db) return null;
  
  const { afterSalesStatusHistory } = await import("../drizzle/schema");
  
  return await db.insert(afterSalesStatusHistory).values({
    serviceId,
    previousStatus: previousStatus as any,
    newStatus: newStatus as any,
    changedBy,
    reason,
  });
}

// Get assignment history for a ticket
export async function getAfterSalesAssignmentHistory(serviceId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { afterSalesAssignmentHistory, users } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  return await db
    .select({
      id: afterSalesAssignmentHistory.id,
      serviceId: afterSalesAssignmentHistory.serviceId,
      previousTechnicianId: afterSalesAssignmentHistory.previousTechnicianId,
      newTechnicianId: afterSalesAssignmentHistory.newTechnicianId,
      reason: afterSalesAssignmentHistory.reason,
      assignedBy: afterSalesAssignmentHistory.assignedBy,
      assignedByName: users.name,
      createdAt: afterSalesAssignmentHistory.createdAt,
    })
    .from(afterSalesAssignmentHistory)
    .leftJoin(users, eq(afterSalesAssignmentHistory.assignedBy, users.id))
    .where(eq(afterSalesAssignmentHistory.serviceId, serviceId))
    .orderBy(desc(afterSalesAssignmentHistory.createdAt));
}

// Add assignment history entry
export async function addAfterSalesAssignmentHistory(
  serviceId: number,
  previousTechnicianId: number | null,
  newTechnicianId: number | null,
  assignedBy: number,
  reason?: string
) {
  const db = await getDb();
  if (!db) return null;
  
  const { afterSalesAssignmentHistory } = await import("../drizzle/schema");
  
  return await db.insert(afterSalesAssignmentHistory).values({
    serviceId,
    previousTechnicianId,
    newTechnicianId,
    assignedBy,
    reason,
  });
}

// Get response templates
export async function getResponseTemplates() {
  const db = await getDb();
  if (!db) return [];
  
  const { responseTemplates } = await import("../drizzle/schema");
  
  return await db.select().from(responseTemplates).orderBy(responseTemplates.category);
}

// Add response template
export async function addResponseTemplate(
  name: string,
  category: string,
  content: string,
  createdBy: number
) {
  const db = await getDb();
  if (!db) return null;
  
  const { responseTemplates } = await import("../drizzle/schema");
  
  return await db.insert(responseTemplates).values({
    name,
    category,
    content,
    createdBy,
  });
}

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

// Get notification preferences for a user
export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { notificationPreferences } = await import("../drizzle/schema");
  
  const result = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  
  return result[0] || null;
}

// Create default notification preferences for a user
export async function createDefaultNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { notificationPreferences } = await import("../drizzle/schema");
  
  const result = await db.insert(notificationPreferences).values({
    userId,
    // All preferences default to true
    orderStatusChangedToast: true,
    orderStatusChangedEmail: true,
    orderNewToast: true,
    orderNewEmail: true,
    savStatusChangedToast: true,
    savStatusChangedEmail: true,
    savNewToast: true,
    savNewEmail: true,
    leadNewToast: true,
    leadNewEmail: true,
    systemAlertToast: true,
    systemAlertEmail: true,
    stockLowToast: true,
    stockLowEmail: true,
    partnerNewToast: true,
    partnerNewEmail: true,
  });
  
  return result;
}

// Update notification preferences for a user
export async function updateNotificationPreferences(
  userId: number,
  preferences: Partial<{
    orderStatusChangedToast: boolean;
    orderStatusChangedEmail: boolean;
    orderNewToast: boolean;
    orderNewEmail: boolean;
    savStatusChangedToast: boolean;
    savStatusChangedEmail: boolean;
    savNewToast: boolean;
    savNewEmail: boolean;
    leadNewToast: boolean;
    leadNewEmail: boolean;
    systemAlertToast: boolean;
    systemAlertEmail: boolean;
    stockLowToast: boolean;
    stockLowEmail: boolean;
    partnerNewToast: boolean;
    partnerNewEmail: boolean;
  }>
) {
  const db = await getDb();
  if (!db) return null;
  
  const { notificationPreferences } = await import("../drizzle/schema");
  
  // Check if preferences exist
  const existing = await getNotificationPreferences(userId);
  
  if (!existing) {
    // Create new preferences with provided values
    return await db.insert(notificationPreferences).values({
      userId,
      ...preferences,
    });
  }
  
  // Update existing preferences
  return await db
    .update(notificationPreferences)
    .set(preferences)
    .where(eq(notificationPreferences.userId, userId));
}
