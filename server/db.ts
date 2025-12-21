import { eq, and, desc, sql, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, partners, products, orders, notifications, resources, productVariants, variantOptions, incomingStock } from "../drizzle/schema";
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
// CART FUNCTIONS (Simple in-memory implementation)
// ============================================

// Simple cart storage (in production, use Redis or database)
const cartStorage = new Map<number, Array<{ productId: number; quantity: number; isPreorder?: boolean; variantId?: number }>>();

export async function getCart(userId: number) {
  const db = await getDb();
  if (!db) return { items: [], subtotalHT: 0, discountPercent: 0, discountAmount: 0, vatAmount: 0, totalTTC: 0 };

  const cartItems = cartStorage.get(userId) || [];
  
  if (cartItems.length === 0) {
    return { items: [], subtotalHT: 0, discountPercent: 0, discountAmount: 0, vatAmount: 0, totalTTC: 0 };
  }

  // Get product details
  const items = [];
  for (const item of cartItems) {
    const product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    if (product[0]) {
      items.push({
        id: item.productId,
        productId: item.productId,
        quantity: item.quantity,
        product: product[0],
        unitPriceHT: product[0].pricePublicHT || 0,
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
  const cartItems = cartStorage.get(userId) || [];
  const existing = cartItems.find(item => 
    item.productId === productId && 
    item.isPreorder === isPreorder && 
    item.variantId === variantId
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    cartItems.push({ productId, quantity, isPreorder, variantId });
  }

  cartStorage.set(userId, cartItems);
  return { success: true };
}

export async function updateCartQuantity(userId: number, productId: number, quantity: number) {
  const cartItems = cartStorage.get(userId) || [];
  const existing = cartItems.find(item => item.productId === productId);

  if (existing) {
    existing.quantity = quantity;
    cartStorage.set(userId, cartItems);
  }

  return { success: true };
}

export async function removeFromCart(userId: number, productId: number) {
  const cartItems = cartStorage.get(userId) || [];
  const filtered = cartItems.filter(item => item.productId !== productId);
  cartStorage.set(userId, filtered);
  return { success: true };
}

export async function clearCart(userId: number) {
  cartStorage.delete(userId);
  return { success: true };
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

  let query = db.select().from(incomingStock);

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

  return await query.orderBy(desc(incomingStock.expectedYear), desc(incomingStock.expectedWeek));
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

export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(orders)
    .set({ status: status as any })
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
