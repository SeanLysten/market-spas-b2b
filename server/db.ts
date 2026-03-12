import { eq, and, desc, sql, or, like, lte, gte, asc, ne, gt, lt, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, partners, products, orders, notifications, resources, productVariants, variantOptions, incomingStock, cartItems, favorites, events, leads, leadStatusHistory, payments, technicalResources, technicalResourceFolders, forumTopics, forumReplies, invitationTokens, metaAdAccounts, googleAdAccounts, ga4Accounts, partnerTerritories, scheduledNewsletters, savedRoutes, resourceFavorites } from "../drizzle/schema";
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

// ============================================
// PARTNER QUERIES
// ============================================

export async function getPartnerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
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
  addressStreet2?: string | null;
  addressCity?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  level?: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "VIP";
  discountPercent?: number;
  status?: "PENDING" | "APPROVED" | "SUSPENDED" | "TERMINATED";
  internalNotes?: string;
  website?: string | null;
  billingAddressSame?: boolean;
  billingStreet?: string | null;
  billingStreet2?: string | null;
  billingCity?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
  deliveryStreet?: string | null;
  deliveryStreet2?: string | null;
  deliveryCity?: string | null;
  deliveryPostalCode?: string | null;
  deliveryCountry?: string | null;
  [key: string]: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const insertData: typeof partners.$inferInsert = {
    companyName: data.companyName,
    vatNumber: data.vatNumber,
    primaryContactEmail: data.primaryContactEmail,
    tradeName: data.tradeName || null,
    addressStreet: data.addressStreet || "N/A",
    addressStreet2: data.addressStreet2 || null,
    addressCity: data.addressCity || "N/A",
    addressPostalCode: data.addressPostalCode || "N/A",
    addressCountry: data.addressCountry || "FR",
    primaryContactName: data.primaryContactName || "N/A",
    primaryContactPhone: data.primaryContactPhone || "N/A",
    website: data.website || null,
    level: data.level || "BRONZE",
    discountPercent: data.discountPercent?.toString() || "0",
    status: data.status || "PENDING",
    internalNotes: data.internalNotes || null,
    billingAddressSame: data.billingAddressSame ?? true,
    billingStreet: data.billingStreet || null,
    billingStreet2: data.billingStreet2 || null,
    billingCity: data.billingCity || null,
    billingPostalCode: data.billingPostalCode || null,
    billingCountry: data.billingCountry || null,
    deliveryStreet: data.deliveryStreet || null,
    deliveryStreet2: data.deliveryStreet2 || null,
    deliveryCity: data.deliveryCity || null,
    deliveryPostalCode: data.deliveryPostalCode || null,
    deliveryCountry: data.deliveryCountry || null,
  };

  const result = await db.insert(partners).values(insertData);
  // Return the inserted partner ID
  const [inserted] = await db.select({ id: partners.id })
    .from(partners)
    .where(eq(partners.vatNumber, data.vatNumber))
    .limit(1);
  return { ...result, partnerId: inserted?.id };
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

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      partnerId: users.partnerId,
      loginMethod: users.loginMethod,
      adminPermissions: users.adminPermissions,
      adminRolePreset: users.adminRolePreset,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      lastSignedIn: users.lastSignedIn,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      partnerCompanyName: partners.companyName,
      partnerStatus: partners.status,
      partnerLevel: partners.level,
      partnerVatNumber: partners.vatNumber,
    })
    .from(users)
    .leftJoin(partners, eq(users.partnerId, partners.id))
    .orderBy(desc(users.createdAt));

  return result;
}

export async function updateUserStatus(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}

/**
 * Deactivate all users linked to a partner
 * Returns the number of users deactivated
 */
export async function deactivateUsersByPartnerId(partnerId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const linkedUsers = await db.select({ id: users.id }).from(users).where(and(eq(users.partnerId, partnerId), eq(users.isActive, true)));
  if (linkedUsers.length > 0) {
    await db.update(users).set({ isActive: false }).where(and(eq(users.partnerId, partnerId), eq(users.isActive, true)));
  }
  return linkedUsers.length;
}

/**
 * Reactivate all users linked to a partner
 * Returns the number of users reactivated
 */
export async function reactivateUsersByPartnerId(partnerId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const linkedUsers = await db.select({ id: users.id }).from(users).where(and(eq(users.partnerId, partnerId), eq(users.isActive, false)));
  if (linkedUsers.length > 0) {
    await db.update(users).set({ isActive: true }).where(and(eq(users.partnerId, partnerId), eq(users.isActive, false)));
  }
  return linkedUsers.length;
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
  supplierProductCode?: string;
  ean13?: string;
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
    supplierProductCode: data.supplierProductCode || null,
    ean13: data.ean13 || null,
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
  supplierProductCode: string;
  ean13: string;
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
    updateData.pricePublicHT = data.priceHT.toString();
    updateData.pricePartnerHT = data.priceHT.toString();
  }
  if (data.vatRate !== undefined) updateData.vatRate = data.vatRate.toString();
  if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity;
  if (data.minOrderQuantity !== undefined) updateData.minOrderQuantity = data.minOrderQuantity;
  if (data.weight !== undefined) updateData.weight = data.weight;
  if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.supplierProductCode !== undefined) updateData.supplierProductCode = data.supplierProductCode;
  if (data.ean13 !== undefined) updateData.ean13 = data.ean13;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;

  // Guard: skip update if no fields to update
  if (Object.keys(updateData).length === 0) {
    return;
  }

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

  // Get user's partner discount from system settings (level-based)
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  let discountPercent = 0;
  let partnerLevel = "BRONZE";
  let discountSource: "level" | "custom" | "none" = "none";
  
  if (user[0]?.partnerId) {
    const resolved = await resolvePartnerDiscount(user[0].partnerId);
    discountPercent = resolved.discountPercent;
    partnerLevel = resolved.partnerLevel;
    discountSource = resolved.source;
  }

  // Calculate totals
  let subtotalHT = 0;
  for (const item of items) {
    const price = typeof item.unitPriceHT === 'string' ? parseFloat(item.unitPriceHT) : item.unitPriceHT;
    subtotalHT += price * item.quantity;
  }

  const discountAmount = (subtotalHT * discountPercent) / 100;
  const subtotalAfterDiscount = subtotalHT - discountAmount;
  
  // Calculate shipping from system settings
  const { shippingHT } = await calculateShippingCost(subtotalAfterDiscount, "standard");
  
  // Get dynamic VAT rate from system settings
  const taxConfig = await getTaxConfig();
  const vatRate = taxConfig.vatRate / 100; // Convert percentage to decimal
  
  const subtotalWithShipping = subtotalAfterDiscount + shippingHT;
  const vatAmount = subtotalAfterDiscount * vatRate;
  const shippingVAT = shippingHT * vatRate;
  const totalVAT = vatAmount + shippingVAT;
  const totalTTC = subtotalWithShipping + totalVAT;

  return {
    items,
    subtotalHT,
    discountPercent,
    discountAmount,
    partnerLevel,
    discountSource,
    shippingHT,
    shippingVAT,
    vatRate: taxConfig.vatRate,
    vatLabel: taxConfig.vatLabel,
    vatAmount: totalVAT,
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
  supplierProductCode?: string;
  ean13?: string;
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
    supplierProductCode: data.supplierProductCode || null,
    ean13: data.ean13 || null,
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
    supplierProductCode?: string;
    ean13?: string;
    imageUrl?: string | null;
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
  if (data.supplierProductCode !== undefined) updateData.supplierProductCode = data.supplierProductCode;
  if (data.ean13 !== undefined) updateData.ean13 = data.ean13;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
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
      variant: productVariants,
    })
    .from(incomingStock)
    .leftJoin(products, eq(incomingStock.productId, products.id))
    .leftJoin(productVariants, eq(incomingStock.variantId, productVariants.id));

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




export async function deletePartner(id: number): Promise<{ reassignedTo?: { partnerId: number; partnerName: string; distanceKm: number }; territoriesTransferred: number; leadsReassigned: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Récupérer les infos du partenaire à supprimer
  const [deletedPartner] = await db.select().from(partners).where(eq(partners.id, id));
  if (!deletedPartner) throw new Error("Partner not found");

  // Récupérer les territoires du partenaire supprimé
  const territories = await db.select().from(partnerTerritories).where(eq(partnerTerritories.partnerId, id));
  
  // Compter les leads assignés
  const leadsToReassign = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.assignedPartnerId, id), eq(leads.leadType, 'VENTE')));

  let result: { reassignedTo?: { partnerId: number; partnerName: string; distanceKm: number }; territoriesTransferred: number; leadsReassigned: number } = {
    territoriesTransferred: 0,
    leadsReassigned: 0
  };

  // Trouver le partenaire le plus proche géographiquement
  const { findNearestPartner } = await import('./geo-utils');
  const remainingPartners = await db.select({
    id: partners.id,
    companyName: partners.companyName,
    city: partners.addressCity,
    postalCode: partners.addressPostalCode,
    country: partners.addressCountry
  }).from(partners).where(and(
    ne(partners.id, id),
    eq(partners.status, 'APPROVED')
  ));

  const nearest = await findNearestPartner(
    { city: deletedPartner.addressCity, postalCode: deletedPartner.addressPostalCode, country: deletedPartner.addressCountry || 'FR' },
    remainingPartners.map(p => ({ ...p, country: p.country || 'FR' }))
  );

  if (nearest) {
    
    // 1. Transférer les territoires au partenaire le plus proche
    // Vérifier les doublons (le partenaire cible peut déjà avoir certains territoires)
    for (const territory of territories) {
      const existing = await db.select().from(partnerTerritories).where(and(
        eq(partnerTerritories.partnerId, nearest.partnerId),
        eq(partnerTerritories.regionId, territory.regionId)
      ));
      if (existing.length === 0) {
        // Transférer le territoire
        await db.update(partnerTerritories)
          .set({ partnerId: nearest.partnerId })
          .where(eq(partnerTerritories.id, territory.id));
        result.territoriesTransferred++;
      } else {
        // Le partenaire cible a déjà ce territoire, supprimer le doublon
        await db.delete(partnerTerritories).where(eq(partnerTerritories.id, territory.id));
      }
    }

    // 2. Réassigner les leads VENTE au partenaire le plus proche
    if (leadsToReassign.length > 0) {
      await db.update(leads)
        .set({ 
          assignedPartnerId: nearest.partnerId, 
          assignmentReason: `reassigned_from_deleted_partner_${id}_to_nearest` 
        })
        .where(and(eq(leads.assignedPartnerId, id), eq(leads.leadType, 'VENTE')));
      result.leadsReassigned = leadsToReassign.length;
    }

    // 3. Désassigner les leads non-VENTE (PARTENARIAT, SAV)
    await db.update(leads)
      .set({ assignedPartnerId: null, assignmentReason: 'partner_deleted' })
      .where(and(eq(leads.assignedPartnerId, id), ne(leads.leadType, 'VENTE')));

    result.reassignedTo = nearest;
  } else {
    // Aucun partenaire proche trouvé, supprimer les territoires et désassigner les leads
    await db.delete(partnerTerritories).where(eq(partnerTerritories.partnerId, id));
    await db.update(leads)
      .set({ assignedPartnerId: null, assignmentReason: 'partner_deleted' })
      .where(eq(leads.assignedPartnerId, id));
  }

  // 4. Désactiver les comptes utilisateurs associés (cascade)
  const deactivatedCount = await deactivateUsersByPartnerId(id);
  // Dissocier les utilisateurs du partenaire supprimé
  await db.update(users).set({ partnerId: null }).where(eq(users.partnerId, id));

  // 5. Supprimer le partenaire
  await db.delete(partners).where(eq(partners.id, id));
  
  return result;
}



// ============================================
// ORDER CREATION
// ============================================

import { orderItems } from "../drizzle/schema";

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
  shippingType?: "standard" | "express";
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
  const totalHTBeforeShipping = subtotalHT - orderDiscountAmount;
  
  // Calculate shipping cost from system settings
  const { shippingHT } = await calculateShippingCost(
    totalHTBeforeShipping,
    input.shippingType || "standard"
  );
  
  const totalHT = totalHTBeforeShipping + shippingHT;
  
  // Calculate VAT from dynamic system settings
  const taxConfig = await getTaxConfig();
  const vatRateDecimal = taxConfig.vatRate / 100;
  const productsVAT = totalHTBeforeShipping * vatRateDecimal;
  const shippingVAT = shippingHT * vatRateDecimal;
  const totalVAT = productsVAT + shippingVAT;
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
    shippingHT: shippingHT.toFixed(2),
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
    shippingHT,
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
  leadType?: 'VENTE' | 'PARTENARIAT' | 'SAV' | 'all';
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select()
  .from(leads)
  .leftJoin(partners, eq(leads.assignedPartnerId, partners.id));
  
  const conditions = [];
  
  // Par défaut, ne montrer que les leads VENTE (sauf si leadType spécifié)
  if (filters?.leadType && filters.leadType !== 'all') {
    conditions.push(eq(leads.leadType, filters.leadType as any));
  } else if (!filters?.leadType) {
    conditions.push(eq(leads.leadType, 'VENTE' as any));
  }
  
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
  
  return query.orderBy(desc(leads.receivedAt), desc(leads.id));
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

export async function createLead(data: {
  metaLeadgenId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  leadType?: 'VENTE' | 'PARTENARIAT' | 'SAV';
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
    leadType: data.leadType || 'VENTE',
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
  
  const inProgressStatuses = ['ASSIGNED', 'CONTACTED', 'NO_RESPONSE', 'QUALIFIED', 'MEETING_SCHEDULED', 'QUOTE_SENT', 'NEGOTIATION'];
  
  const stats = {
    total: allLeads.length,
    new: allLeads.filter(l => l.status === 'NEW').length,
    assigned: allLeads.filter(l => l.status === 'ASSIGNED').length,
    contacted: allLeads.filter(l => l.firstContactAt !== null).length,
    qualified: allLeads.filter(l => l.status === 'QUALIFIED').length,
    converted: allLeads.filter(l => l.status === 'CONVERTED').length,
    lost: allLeads.filter(l => l.status === 'LOST').length,
    inProgress: allLeads.filter(l => inProgressStatuses.includes(l.status)).length,
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

// ============================================
// TECHNICAL RESOURCE FOLDERS
// ============================================

export async function getAllTechFolders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(technicalResourceFolders).orderBy(asc(technicalResourceFolders.sortOrder));
}

export async function createTechFolder(data: { name: string; slug: string; description?: string; icon?: string; sortOrder?: number; parentId?: number; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(technicalResourceFolders).values(data as any);
}

export async function updateTechFolder(id: number, data: Partial<{ name: string; slug: string; description: string; icon: string; sortOrder: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(technicalResourceFolders).set(data).where(eq(technicalResourceFolders.id, id));
}

export async function deleteTechFolder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Move resources in this folder to "uncategorized" (folderId = null)
  await db.update(technicalResources).set({ folderId: null }).where(eq(technicalResources.folderId, id));
  return await db.delete(technicalResourceFolders).where(eq(technicalResourceFolders.id, id));
}

// ============================================
// TECHNICAL RESOURCES
// ============================================

export async function getAllTechnicalResources(filters?: {
  type?: string;
  category?: string;
  folderId?: number | null;
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
  if (filters?.folderId !== undefined) {
    if (filters.folderId === null) {
      conditions.push(isNull(technicalResources.folderId));
    } else if (filters.folderId) {
      conditions.push(eq(technicalResources.folderId, filters.folderId));
    }
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
  description?: string;
  type: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  category?: string;
  folderId?: number | null;
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
    downloadCount: 0,
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
    fileName: string;
    fileSize: number;
    fileType: string;
    category: string;
    folderId: number | null;
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

export async function incrementTechResourceViewCount(id: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(technicalResources)
    .set({ viewCount: sql`${technicalResources.viewCount} + 1` })
    .where(eq(technicalResources.id, id));
}

export async function incrementTechResourceDownloadCount(id: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(technicalResources)
    .set({ downloadCount: sql`${technicalResources.downloadCount} + 1` })
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

// Get response templates
export async function getResponseTemplates() {
  const db = await getDb();
  if (!db) return [];
  
  const { responseTemplates } = await import("../drizzle/schema");
  
  return await db.select().from(responseTemplates).orderBy(responseTemplates.category);
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


// ============================================
// LOCAL AUTHENTICATION
// ============================================

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createLocalUser(data: {
  openId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  name: string;
  phone?: string;
  loginMethod: string;
  role?: string;
  partnerId?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { role, partnerId, ...rest } = data;
  const [result] = await db
    .insert(users)
    .values({
      ...rest,
      role: role || 'PARTNER_USER',
      partnerId: partnerId || null,
      isActive: true,
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();
  
  return { id: result.id };
}

export async function linkUserToPartner(userId: number, partnerId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ partnerId, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateUserLastLogin(userId: number, ip: string) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      lastSignedIn: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function setPasswordResetToken(
  userId: number,
  token: string,
  expires: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { passwordResetTokens } = await import("../drizzle/schema");

  // Delete any existing tokens for this user
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));

  // Create new token
  await db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt: expires,
  });
}

export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const { passwordResetTokens } = await import("../drizzle/schema");

  const result = await db
    .select({
      user: users,
      token: passwordResetTokens,
    })
    .from(passwordResetTokens)
    .innerJoin(users, eq(users.id, passwordResetTokens.userId))
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gte(passwordResetTokens.expiresAt, new Date()),
        sql`${passwordResetTokens.usedAt} IS NULL`
      )
    )
    .limit(1);

  return result.length > 0 ? result[0].user : undefined;
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function clearPasswordResetToken(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { passwordResetTokens } = await import("../drizzle/schema");

  // Mark token as used
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.userId, userId));
}

// ============================================
// INVITATION TOKENS
// ============================================

export async function createInvitationToken(
  email: string,
  invitedBy: number,
  expiresInDays: number = 7,
  firstName?: string,
  lastName?: string,
  partnerId?: number,
  role?: string
) {
  const db = await getDb();
  if (!db) return undefined;

  // Generate a secure random token
  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const result = await db.insert(invitationTokens).values({
    email,
    firstName,
    lastName,
    token,
    invitedBy,
    partnerId: partnerId || null,
    role: role || null,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function getInvitationTokenByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(invitationTokens)
    .where(eq(invitationTokens.token, token))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function validateInvitationToken(token: string, email: string) {
  const db = await getDb();
  if (!db) return { valid: false, message: 'Database unavailable' };

  const invitationToken = await getInvitationTokenByToken(token);

  if (!invitationToken) {
    return { valid: false, message: 'Token invalide' };
  }

  if (invitationToken.usedAt) {
    return { valid: false, message: 'Cette invitation a déjà été utilisée' };
  }

  if (new Date() > new Date(invitationToken.expiresAt)) {
    return { valid: false, message: 'Cette invitation a expiré' };
  }

  // Verify that the email matches exactly
  if (invitationToken.email.toLowerCase() !== email.toLowerCase()) {
    return { valid: false, message: 'Cette invitation n\'est pas pour cette adresse email' };
  }

  return { valid: true, invitationToken };
}

export async function markInvitationTokenAsUsed(token: string) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(invitationTokens)
    .set({ usedAt: new Date() })
    .where(eq(invitationTokens.token, token));
}

export async function getInvitationTokenInfo(token: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(invitationTokens)
    .where(
      and(
        eq(invitationTokens.token, token),
        isNull(invitationTokens.usedAt),
        gt(invitationTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}




export async function updateUserRole(userId: number, role: 'SUPER_ADMIN' | 'ADMIN' | 'PARTNER' | 'SALES_MANAGER' | 'SALES_REP' | 'PARTNER_ADMIN' | 'PARTNER_USER') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserRoleWithPermissions(
  userId: number,
  role: string,
  adminRolePreset: string | null,
  adminPermissions: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({
    role: role as any,
    adminRolePreset,
    adminPermissions,
  }).where(eq(users.id, userId));
}

export async function updateUserAdminPermissions(
  userId: number,
  adminRolePreset: string,
  adminPermissions: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({
    adminRolePreset,
    adminPermissions,
  }).where(eq(users.id, userId));
}


// Get all admin emails for notifications
export async function getAdminEmails(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const admins = await db
    .select({ email: users.email })
    .from(users)
    .where(
      or(
        eq(users.role, "SUPER_ADMIN"),
        eq(users.role, "ADMIN")
      )
    );

  return admins.map(a => a.email).filter((email): email is string => email !== null);
}


// ============================================
// DEPOSIT REMINDER FUNCTIONS
// ============================================

interface PendingDepositOrder {
  id: number;
  orderNumber: string;
  partnerId: number;
  depositAmount: string;
  totalTTC: string;
  createdAt: Date;
  depositReminderSentAt: Date | null;
  depositReminderCount: number | null;
  hoursOverdue: number;
}

/**
 * Get orders with PENDING_DEPOSIT status that are older than the specified hours
 * and haven't received a reminder in the last 24 hours
 */
export async function getOrdersPendingDepositReminder(hoursThreshold: number = 48): Promise<PendingDepositOrder[]> {
  const db = await getDb();
  if (!db) return [];

  const thresholdDate = new Date();
  thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

  // Get orders that:
  // 1. Have status PENDING_DEPOSIT
  // 2. Were created more than hoursThreshold ago
  // 3. Haven't received a reminder in the last 24 hours (or never received one)
  const reminderCooldown = new Date();
  reminderCooldown.setHours(reminderCooldown.getHours() - 24);

  const result = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      partnerId: orders.partnerId,
      depositAmount: orders.depositAmount,
      totalTTC: orders.totalTTC,
      createdAt: orders.createdAt,
      depositReminderSentAt: orders.depositReminderSentAt,
      depositReminderCount: orders.depositReminderCount,
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "PENDING_DEPOSIT"),
        lt(orders.createdAt, thresholdDate),
        isNull(orders.deletedAt),
        or(
          isNull(orders.depositReminderSentAt),
          lt(orders.depositReminderSentAt, reminderCooldown)
        )
      )
    );

  // Calculate hours overdue for each order
  const now = new Date();
  return result.map(order => ({
    ...order,
    hoursOverdue: Math.floor((now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60)),
  }));
}

/**
 * Mark an order as having received a deposit reminder
 */
export async function markDepositReminderSent(orderId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(orders)
    .set({
      depositReminderSentAt: new Date(),
      depositReminderCount: sql`COALESCE(${orders.depositReminderCount}, 0) + 1`,
    })
    .where(eq(orders.id, orderId));
}

// ============================================
// META AD ACCOUNTS
// ============================================

/**
 * Connect a Meta ad account (upsert)
 */
export async function connectMetaAdAccount(data: {
  metaUserId: string;
  metaUserName: string;
  adAccountId: string;
  adAccountName: string;
  currency: string;
  timezone?: string | null;
  accessToken: string;
  tokenExpiresAt?: Date | null;
  connectedBy: number;
}): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if this ad account is already connected
  const existing = await db
    .select()
    .from(metaAdAccounts)
    .where(eq(metaAdAccounts.adAccountId, data.adAccountId));

  if (existing.length > 0) {
    // Update existing connection
    await db
      .update(metaAdAccounts)
      .set({
        metaUserId: data.metaUserId,
        metaUserName: data.metaUserName,
        adAccountName: data.adAccountName,
        currency: data.currency,
        timezone: data.timezone,
        accessToken: data.accessToken,
        tokenExpiresAt: data.tokenExpiresAt,
        isActive: true,
        syncError: null,
        connectedBy: data.connectedBy,
      })
      .where(eq(metaAdAccounts.adAccountId, data.adAccountId));
    return { id: existing[0].id };
  }

  // Create new connection
  const insertResult = await db.insert(metaAdAccounts).values({
    metaUserId: data.metaUserId,
    metaUserName: data.metaUserName,
    adAccountId: data.adAccountId,
    adAccountName: data.adAccountName,
    currency: data.currency,
    timezone: data.timezone,
    accessToken: data.accessToken,
    tokenExpiresAt: data.tokenExpiresAt,
    connectedBy: data.connectedBy,
    isActive: true,
  });

  // drizzle-orm with mysql2 returns [ResultSetHeader, ...]
  const result = insertResult[0];
  const insertId = (result as any).insertId ?? 0;
  return { id: insertId };
}

/**
 * Disconnect a Meta ad account
 */
export async function disconnectMetaAdAccount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(metaAdAccounts)
    .set({ isActive: false, accessToken: "" })
    .where(eq(metaAdAccounts.id, id));
}

/**
 * Get all connected Meta ad accounts
 */
export async function getConnectedMetaAdAccounts() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(metaAdAccounts)
    .where(eq(metaAdAccounts.isActive, true));
}

/**
 * Update last synced timestamp for a Meta ad account
 */
export async function updateMetaAdAccountLastSynced(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(metaAdAccounts)
    .set({ lastSyncedAt: new Date(), syncError: null })
    .where(eq(metaAdAccounts.id, id));
}

/**
 * Update sync error for a Meta ad account
 */
export async function updateMetaAdAccountSyncError(id: number, error: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(metaAdAccounts)
    .set({ syncError: error })
    .where(eq(metaAdAccounts.id, id));
}

// ============================================
// GOOGLE ADS ACCOUNT FUNCTIONS
// ============================================

/**
 * Connect a Google Ads account (upsert)
 */
export async function connectGoogleAdAccount(data: {
  googleUserId: string;
  googleUserEmail: string | null;
  customerId: string;
  customerName: string | null;
  currency: string;
  timezone?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  connectedBy: number;
}): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if this customer ID is already connected
  const existing = await db
    .select()
    .from(googleAdAccounts)
    .where(eq(googleAdAccounts.customerId, data.customerId));

  if (existing.length > 0) {
    // Update existing connection
    await db
      .update(googleAdAccounts)
      .set({
        googleUserId: data.googleUserId,
        googleUserEmail: data.googleUserEmail,
        customerName: data.customerName,
        currency: data.currency,
        timezone: data.timezone,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        isActive: true,
        syncError: null,
        connectedBy: data.connectedBy,
      })
      .where(eq(googleAdAccounts.customerId, data.customerId));
    return { id: existing[0].id };
  }

  // Create new connection
  const insertResult = await db.insert(googleAdAccounts).values({
    googleUserId: data.googleUserId,
    googleUserEmail: data.googleUserEmail,
    customerId: data.customerId,
    customerName: data.customerName,
    currency: data.currency,
    timezone: data.timezone,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    tokenExpiresAt: data.tokenExpiresAt,
    connectedBy: data.connectedBy,
    isActive: true,
  });

  // drizzle-orm with mysql2 returns [ResultSetHeader, ...]
  const result = insertResult[0];
  const insertId = (result as any).insertId ?? 0;
  return { id: insertId };
}

/**
 * Disconnect a Google Ads account
 */
export async function disconnectGoogleAdAccount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(googleAdAccounts)
    .set({ isActive: false, accessToken: "", refreshToken: null })
    .where(eq(googleAdAccounts.id, id));
}

/**
 * Get all connected Google Ads accounts
 */
export async function getConnectedGoogleAdAccounts() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(googleAdAccounts)
    .where(eq(googleAdAccounts.isActive, true));
}

/**
 * Update last synced timestamp for a Google Ads account
 */
export async function updateGoogleAdAccountLastSynced(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(googleAdAccounts)
    .set({ lastSyncedAt: new Date(), syncError: null })
    .where(eq(googleAdAccounts.id, id));
}

/**
 * Update sync error for a Google Ads account
 */
export async function updateGoogleAdAccountSyncError(id: number, error: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(googleAdAccounts)
    .set({ syncError: error })
    .where(eq(googleAdAccounts.id, id));
}

export async function updateGoogleAdAccountCustomer(
  id: number,
  data: {
    customerId: string;
    customerName: string;
    currency: string;
    timezone: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(googleAdAccounts)
    .set({
      customerId: data.customerId,
      customerName: data.customerName,
      currency: data.currency,
      timezone: data.timezone,
    })
    .where(eq(googleAdAccounts.id, id));
}

/**
 * Upsert Meta Ads campaign stats
 * Creates or updates campaign statistics received from Make webhooks
 */
export async function upsertMetaCampaignStats(data: {
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  spend: number;
  date: Date;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Use MySQL ON DUPLICATE KEY UPDATE syntax via raw query
  await db.execute(sql`
    INSERT INTO meta_campaign_stats 
      (campaign_id, campaign_name, impressions, clicks, spend, date, updated_at)
    VALUES 
      (${data.campaignId}, ${data.campaignName}, ${data.impressions}, ${data.clicks}, ${data.spend}, ${data.date}, NOW())
    ON DUPLICATE KEY UPDATE
      campaign_name = VALUES(campaign_name),
      impressions = impressions + VALUES(impressions),
      clicks = clicks + VALUES(clicks),
      spend = spend + VALUES(spend),
      updated_at = NOW()
  `);
}

/**
 * Get all pending invitations (for admin view)
 */
export async function getPendingInvitations(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const invitations = await db
    .select({
      id: invitationTokens.id,
      email: invitationTokens.email,
      firstName: invitationTokens.firstName,
      lastName: invitationTokens.lastName,
      token: invitationTokens.token,
      invitedBy: invitationTokens.invitedBy,
      expiresAt: invitationTokens.expiresAt,
      usedAt: invitationTokens.usedAt,
      createdAt: invitationTokens.createdAt,
      inviterName: users.name,
      inviterEmail: users.email,
    })
    .from(invitationTokens)
    .leftJoin(users, eq(invitationTokens.invitedBy, users.id))
    .orderBy(desc(invitationTokens.createdAt));

  return invitations.map(inv => ({
    ...inv,
    status: inv.usedAt 
      ? 'ACCEPTED' 
      : new Date() > new Date(inv.expiresAt) 
        ? 'EXPIRED' 
        : 'PENDING'
  }));
}

/**
 * Cancel an invitation
 */
export async function cancelInvitation(tokenId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Delete the invitation token
  await db
    .delete(invitationTokens)
    .where(eq(invitationTokens.id, tokenId));
}

/**
 * Resend an invitation email
 * Returns the invitation data needed to send email
 */
export async function getInvitationForResend(tokenId: number): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  const [invitation] = await db
    .select()
    .from(invitationTokens)
    .where(eq(invitationTokens.id, tokenId))
    .limit(1);

  if (!invitation) return null;

  // Check if not already used
  if (invitation.usedAt) {
    throw new Error('Cette invitation a déjà été acceptée');
  }

  // Check if expired
  if (new Date() > new Date(invitation.expiresAt)) {
    // Create a new token with extended expiration
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await db
      .update(invitationTokens)
      .set({ 
        expiresAt: newExpiresAt,
        createdAt: new Date() // Update sent date
      })
      .where(eq(invitationTokens.id, tokenId));

    return {
      ...invitation,
      expiresAt: newExpiresAt,
      createdAt: new Date()
    };
  }

  return invitation;
}


// ============================================
// SCHEDULED NEWSLETTERS
// ============================================

export async function createScheduledNewsletter(data: {
  subject: string;
  title: string;
  htmlContent: string;
  recipients: 'ALL' | 'PARTNERS_ONLY' | 'ADMINS_ONLY';
  scheduledAt: Date;
  createdById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scheduledNewsletters).values({
    subject: data.subject,
    title: data.title,
    htmlContent: data.htmlContent,
    recipients: data.recipients,
    scheduledAt: data.scheduledAt,
    createdById: data.createdById,
    status: 'PENDING',
  });
  return { id: result[0].insertId };
}

export async function getScheduledNewsletters() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduledNewsletters).orderBy(desc(scheduledNewsletters.createdAt));
}

export async function getPendingScheduledNewsletters() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(scheduledNewsletters)
    .where(and(
      eq(scheduledNewsletters.status, 'PENDING'),
      lte(scheduledNewsletters.scheduledAt, now)
    ));
}

export async function updateScheduledNewsletterStatus(id: number, status: 'SENT' | 'CANCELLED' | 'FAILED', extra?: {
  sentAt?: Date;
  cancelledAt?: Date;
  totalRecipients?: number;
  successCount?: number;
  failureCount?: number;
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scheduledNewsletters)
    .set({ status, ...extra })
    .where(eq(scheduledNewsletters.id, id));
}

export async function cancelScheduledNewsletter(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(scheduledNewsletters)
    .set({ status: 'CANCELLED', cancelledAt: new Date() })
    .where(and(
      eq(scheduledNewsletters.id, id),
      eq(scheduledNewsletters.status, 'PENDING')
    ));
}

export async function deleteScheduledNewsletter(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(scheduledNewsletters).where(eq(scheduledNewsletters.id, id));
}

// ==================== UPDATE EVENT ====================

export async function updateEvent(id: number, data: {
  title?: string;
  description?: string | null;
  type?: 'PROMOTION' | 'EVENT' | 'ANNOUNCEMENT' | 'TRAINING' | 'WEBINAR';
  startDate?: Date;
  endDate?: Date | null;
  allDay?: boolean;
  imageUrl?: string | null;
  discountPercent?: string | null;
  promoCode?: string | null;
  isPublished?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(events).set(data).where(eq(events.id, id));
}


// ============================================
// SAVED ROUTES
// ============================================

export async function getSavedRoutes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedRoutes).where(eq(savedRoutes.userId, userId)).orderBy(desc(savedRoutes.updatedAt));
}

export async function getSavedRouteById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(savedRoutes).where(and(eq(savedRoutes.id, id), eq(savedRoutes.userId, userId)));
  return rows[0] || null;
}

export async function createSavedRoute(data: { userId: number; name: string; type: string; points: string; totalDistance?: string; totalDuration?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(savedRoutes).values({
    userId: data.userId,
    name: data.name,
    type: data.type,
    points: data.points,
    totalDistance: data.totalDistance || null,
    totalDuration: data.totalDuration || null,
    notes: data.notes || null,
  });
  return { id: result[0].insertId };
}

export async function updateSavedRoute(id: number, userId: number, data: { name?: string; points?: string; totalDistance?: string; totalDuration?: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(savedRoutes).set(data).where(and(eq(savedRoutes.id, id), eq(savedRoutes.userId, userId)));
}

export async function deleteSavedRoute(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(savedRoutes).where(and(eq(savedRoutes.id, id), eq(savedRoutes.userId, userId)));
}

// ============================================
// GOOGLE ANALYTICS 4 ACCOUNTS
// ============================================

export async function connectGa4Account(data: {
  googleUserId: string;
  googleUserEmail: string | null;
  propertyId: string;
  propertyName: string | null;
  websiteUrl?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  connectedBy: number;
}): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(ga4Accounts)
    .where(eq(ga4Accounts.propertyId, data.propertyId));

  if (existing.length > 0) {
    await db
      .update(ga4Accounts)
      .set({
        googleUserId: data.googleUserId,
        googleUserEmail: data.googleUserEmail,
        propertyName: data.propertyName,
        websiteUrl: data.websiteUrl,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        isActive: true,
        syncError: null,
        connectedBy: data.connectedBy,
      })
      .where(eq(ga4Accounts.propertyId, data.propertyId));
    return { id: existing[0].id };
  }

  const insertResult = await db.insert(ga4Accounts).values({
    googleUserId: data.googleUserId,
    googleUserEmail: data.googleUserEmail,
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    websiteUrl: data.websiteUrl,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    tokenExpiresAt: data.tokenExpiresAt,
    connectedBy: data.connectedBy,
    isActive: true,
  });

  const result = insertResult[0];
  const insertId = (result as any).insertId ?? 0;
  return { id: insertId };
}

export async function disconnectGa4Account(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(ga4Accounts)
    .set({ isActive: false, accessToken: "", refreshToken: null })
    .where(eq(ga4Accounts.id, id));
}

export async function getConnectedGa4Accounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ga4Accounts).where(eq(ga4Accounts.isActive, true));
}

export async function updateGa4AccountLastSynced(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(ga4Accounts)
    .set({ lastSyncedAt: new Date(), syncError: null })
    .where(eq(ga4Accounts.id, id));
}

export async function updateGa4AccountSyncError(id: number, error: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(ga4Accounts)
    .set({ syncError: error })
    .where(eq(ga4Accounts.id, id));
}

export async function updateGa4AccountTokens(
  id: number,
  accessToken: string,
  tokenExpiresAt: Date | null
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(ga4Accounts)
    .set({ accessToken, tokenExpiresAt })
    .where(eq(ga4Accounts.id, id));
}


// ============================================
// SHOPIFY ACCOUNTS QUERIES
// ============================================

export interface ShopifyAccountRow {
  id: number;
  userId: number;
  shopDomain: string;
  accessToken: string;
  scope: string | null;
  shopName: string | null;
  shopEmail: string | null;
  currency: string | null;
  connectedAt: Date;
  updatedAt: Date;
}

export async function getShopifyAccount(userId: number): Promise<ShopifyAccountRow | null> {
  const db = await getDb();
  if (!db) return null;
  const [rows] = await db.execute(
    sql`SELECT id, user_id as userId, shop_domain as shopDomain, access_token as accessToken, scope, shop_name as shopName, shop_email as shopEmail, currency, connected_at as connectedAt, updated_at as updatedAt FROM shopify_accounts WHERE user_id = ${userId} LIMIT 1`
  ) as any;
  return (rows as ShopifyAccountRow[])[0] || null;
}

export async function upsertShopifyAccount(
  userId: number,
  shopDomain: string,
  accessToken: string,
  scope: string,
  shopName?: string,
  shopEmail?: string,
  currency?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const shopNameVal = shopName || null;
  const shopEmailVal = shopEmail || null;
  const currencyVal = currency || 'EUR';
  await db.execute(
    sql`INSERT INTO shopify_accounts (user_id, shop_domain, access_token, scope, shop_name, shop_email, currency)
     VALUES (${userId}, ${shopDomain}, ${accessToken}, ${scope}, ${shopNameVal}, ${shopEmailVal}, ${currencyVal})
     ON DUPLICATE KEY UPDATE
       shop_domain = VALUES(shop_domain),
       access_token = VALUES(access_token),
       scope = VALUES(scope),
       shop_name = COALESCE(VALUES(shop_name), shop_name),
       shop_email = COALESCE(VALUES(shop_email), shop_email),
       currency = COALESCE(VALUES(currency), currency),
       updated_at = CURRENT_TIMESTAMP`
  );
}

export async function deleteShopifyAccount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`DELETE FROM shopify_accounts WHERE user_id = ${userId}`);
}


// ============================================
// SYSTEM SETTINGS QUERIES
// ============================================

export async function getSystemSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const { systemSettings } = await import("../drizzle/schema");
  const result = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  return result.length > 0 ? result[0].value : null;
}

export async function getAllSystemSettings(): Promise<Record<string, any>> {
  const db = await getDb();
  if (!db) return {};
  const { systemSettings } = await import("../drizzle/schema");
  const rows = await db.select().from(systemSettings);
  const result: Record<string, any> = {};
  for (const row of rows) {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      result[row.key] = row.value;
    }
  }
  return result;
}

export async function upsertSystemSetting(key: string, value: string, userId?: number, description?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { systemSettings } = await import("../drizzle/schema");
  
  // Check if setting exists
  const existing = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  
  if (existing.length > 0) {
    await db.update(systemSettings)
      .set({ value, updatedBy: userId ?? null })
      .where(eq(systemSettings.key, key));
  } else {
    await db.insert(systemSettings).values({
      key,
      value,
      description: description ?? null,
      updatedBy: userId ?? null,
    });
  }
}

export async function upsertMultipleSystemSettings(
  settings: Array<{ key: string; value: string; description?: string }>,
  userId?: number
): Promise<void> {
  for (const setting of settings) {
    await upsertSystemSetting(setting.key, setting.value, userId, setting.description);
  }
}


// ============================================
// ORDER PRICING CONFIG (dynamic from system_settings)
// ============================================

export interface PartnerLevelConfig {
  level: string;
  discount: number;
  minOrders: number;
}

export interface ShippingConfig {
  defaultShippingCost: number;
  expressShippingCost: number;
  estimatedDeliveryDays: number;
}

export interface TaxConfig {
  vatRate: number;
  vatLabel: string;
}

const DEFAULT_TAX: TaxConfig = {
  vatRate: 0,
  vatLabel: "TVA",
};

const DEFAULT_PARTNER_LEVELS: PartnerLevelConfig[] = [
  { level: "BRONZE", discount: 0, minOrders: 0 },
  { level: "SILVER", discount: 5, minOrders: 5 },
  { level: "GOLD", discount: 10, minOrders: 15 },
  { level: "PLATINUM", discount: 15, minOrders: 30 },
  { level: "VIP", discount: 20, minOrders: 50 },
];

const DEFAULT_SHIPPING: ShippingConfig = {
  defaultShippingCost: 150,
  expressShippingCost: 300,
  estimatedDeliveryDays: 14,
};

/**
 * Get the discount percent for a given partner level from system settings.
 * Falls back to the partner's own discountPercent field if no level config found.
 */
export async function getDiscountForPartnerLevel(partnerLevel: string): Promise<number> {
  const raw = await getSystemSetting("partner_levels");
  let levels: PartnerLevelConfig[] = DEFAULT_PARTNER_LEVELS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) levels = parsed;
    } catch {}
  }
  const match = levels.find((l) => l.level === partnerLevel);
  return match ? match.discount : 0;
}

/**
 * Get shipping config from system settings.
 */
export async function getShippingConfig(): Promise<ShippingConfig> {
  const raw = await getSystemSetting("shipping");
  if (!raw) return DEFAULT_SHIPPING;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SHIPPING, ...parsed };
  } catch {
    return DEFAULT_SHIPPING;
  }
}

/**
 * Get tax config from system settings.
 */
export async function getTaxConfig(): Promise<TaxConfig> {
  const raw = await getSystemSetting("tax");
  if (!raw) return DEFAULT_TAX;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_TAX, ...parsed };
  } catch {
    return DEFAULT_TAX;
  }
}

/**
 * Calculate shipping cost based on shipping type.
 */
export async function calculateShippingCost(
  subtotalHT: number,
  shippingType: "standard" | "express" = "standard"
): Promise<{ shippingHT: number; config: ShippingConfig }> {
  const config = await getShippingConfig();

  const shippingHT = shippingType === "express"
    ? config.expressShippingCost
    : config.defaultShippingCost;

  return { shippingHT, config };
}

/**
 * Resolve the effective discount for a partner:
 * 1. Use the level-based discount from system_settings (partner_levels)
 * 2. If the partner has a custom discountPercent override, use the higher of the two
 */
export async function resolvePartnerDiscount(partnerId: number): Promise<{
  discountPercent: number;
  partnerLevel: string;
  source: "level" | "custom" | "none";
}> {
  const partner = await getPartnerById(partnerId);
  if (!partner) return { discountPercent: 0, partnerLevel: "BRONZE", source: "none" };

  const levelDiscount = await getDiscountForPartnerLevel(partner.level);
  const customDiscount = partner.discountPercent ? parseFloat(partner.discountPercent) : 0;

  // Use the higher discount (level-based or custom override)
  if (customDiscount > 0 && customDiscount > levelDiscount) {
    return { discountPercent: customDiscount, partnerLevel: partner.level, source: "custom" };
  }
  return { discountPercent: levelDiscount, partnerLevel: partner.level, source: "level" };
}


// ============================================
// RESOURCE FAVORITES
// ============================================

export async function toggleResourceFavorite(userId: number, resourceId: number): Promise<{ isFavorite: boolean }> {
  const db = await getDb();
  // Check if already favorited
  const existing = await db
    .select()
    .from(resourceFavorites)
    .where(and(eq(resourceFavorites.userId, userId), eq(resourceFavorites.resourceId, resourceId)));

  if (existing.length > 0) {
    // Remove favorite
    await db
      .delete(resourceFavorites)
      .where(and(eq(resourceFavorites.userId, userId), eq(resourceFavorites.resourceId, resourceId)));
    return { isFavorite: false };
  } else {
    // Add favorite
    await db.insert(resourceFavorites).values({ userId, resourceId });
    return { isFavorite: true };
  }
}

export async function getUserResourceFavorites(userId: number): Promise<number[]> {
  const db = await getDb();
  const rows = await db
    .select({ resourceId: resourceFavorites.resourceId })
    .from(resourceFavorites)
    .where(eq(resourceFavorites.userId, userId))
    .orderBy(desc(resourceFavorites.createdAt));
  return rows.map((r) => r.resourceId);
}

export async function getUserFavoriteResources(userId: number) {
  const db = await getDb();
  const rows = await db
    .select({
      resourceId: resourceFavorites.resourceId,
      favoritedAt: resourceFavorites.createdAt,
    })
    .from(resourceFavorites)
    .where(eq(resourceFavorites.userId, userId))
    .orderBy(desc(resourceFavorites.createdAt));

  if (rows.length === 0) return [];

  const resourceIds = rows.map((r) => r.resourceId);
  const resources_list = await db
    .select()
    .from(technicalResources)
    .where(or(...resourceIds.map((id) => eq(technicalResources.id, id))));

  // Maintain favorite order
  return rows
    .map((fav) => {
      const resource = resources_list.find((r) => r.id === fav.resourceId);
      return resource ? { ...resource, favoritedAt: fav.favoritedAt } : null;
    })
    .filter(Boolean);
}
