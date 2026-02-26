import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  unique,
  index,
  date,
} from "drizzle-orm/mysql-core";

// ============================================
// ENUMS
// ============================================

export const userRoleEnum = mysqlEnum("user_role", [
  "SUPER_ADMIN",
  "ADMIN",
  "SALES_MANAGER",
  "SALES_REP",
  "PARTNER_ADMIN",
  "PARTNER_USER",
  "PARTNER",
]);

export const partnerStatusEnum = mysqlEnum("partner_status", [
  "PENDING",
  "APPROVED",
  "SUSPENDED",
  "TERMINATED",
]);

export const partnerLevelEnum = mysqlEnum("partner_level", [
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "VIP",
]);

export const orderStatusEnum = mysqlEnum("order_status", [
  "DRAFT",
  "PENDING_APPROVAL",
  "PENDING_DEPOSIT",
  "DEPOSIT_PAID",
  "IN_PRODUCTION",
  "READY_TO_SHIP",
  "PARTIALLY_SHIPPED",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
]);

export const paymentStatusEnum = mysqlEnum("payment_status", [
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

export const invoiceTypeEnum = mysqlEnum("invoice_type", [
  "QUOTE",
  "DEPOSIT",
  "FINAL",
  "CREDIT_NOTE",
]);

export const invoiceStatusEnum = mysqlEnum("invoice_status", [
  "DRAFT",
  "SENT",
  "PAID",
  "PARTIALLY_PAID",
  "OVERDUE",
  "CANCELLED",
]);

export const notificationTypeEnum = mysqlEnum("notification_type", [
  "ORDER_CREATED",
  "ORDER_STATUS_CHANGED",
  "PAYMENT_RECEIVED",
  "PAYMENT_FAILED",
  "INVOICE_READY",
  "STOCK_LOW",
  "NEW_PARTNER",
  "PARTNER_APPROVED",
  "NEW_RESOURCE",
  "SYSTEM_ALERT",
]);

export const resourceCategoryEnum = mysqlEnum("resource_category", [
  "TECHNICAL_DOC",
  "VIDEO_TUTORIAL",
  "TROUBLESHOOTING",
  "MARKETING_IMAGE",
  "CATALOG",
  "PLV",
  "SALES_GUIDE",
  "INSTALLATION",
  "WARRANTY",
  "CERTIFICATE",
]);

export const productCategoryEnum = mysqlEnum("product_category", [
  "SPAS",
  "SWIM_SPAS",
  "MAINTENANCE",
  "COVERS",
  "ACCESSORIES",
  "OTHER",
]);

// ============================================
// AUTHENTICATION & USERS
// ============================================

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    email: varchar("email", { length: 320 }),
    emailVerified: timestamp("emailVerified"),
    passwordHash: varchar("passwordHash", { length: 255 }),

    // Profile
    firstName: varchar("firstName", { length: 100 }),
    lastName: varchar("lastName", { length: 100 }),
    name: text("name"),
    phone: varchar("phone", { length: 50 }),
    avatar: varchar("avatar", { length: 500 }),
    locale: varchar("locale", { length: 10 }).default("fr"),
    timezone: varchar("timezone", { length: 50 }).default("Europe/Brussels"),

    // Role & Access
    role: mysqlEnum("role", [
      "SUPER_ADMIN",
      "ADMIN",
      "SALES_MANAGER",
      "SALES_REP",
      "PARTNER_ADMIN",
      "PARTNER_USER",
      "PARTNER",
    ]).default("PARTNER_USER").notNull(),
    partnerId: int("partnerId"),
    loginMethod: varchar("loginMethod", { length: 64 }),

    // Security
    twoFactorEnabled: boolean("twoFactorEnabled").default(false),
    twoFactorSecret: varchar("twoFactorSecret", { length: 255 }),
    lastLoginAt: timestamp("lastLoginAt"),
    lastLoginIp: varchar("lastLoginIp", { length: 50 }),
    failedLoginAttempts: int("failedLoginAttempts").default(0),
    lockedUntil: timestamp("lockedUntil"),

    // Status
    isActive: boolean("isActive").default(true),
    mustChangePassword: boolean("mustChangePassword").default(false),

    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
    roleIdx: index("role_idx").on(table.role),
  })
);

export const sessions = mysqlTable(
  "sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),

    // Device info
    userAgent: text("userAgent"),
    ipAddress: varchar("ipAddress", { length: 50 }),
    deviceType: varchar("deviceType", { length: 20 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    tokenIdx: index("token_idx").on(table.token),
  })
);

export const passwordResetTokens = mysqlTable(
  "password_reset_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: index("token_idx").on(table.token),
  })
);

export const emailVerificationTokens = mysqlTable(
  "email_verification_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: index("token_idx").on(table.token),
  })
);

export const invitationTokens = mysqlTable(
  "invitation_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    firstName: varchar("firstName", { length: 100 }),
    lastName: varchar("lastName", { length: 100 }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    invitedBy: int("invitedBy").notNull(), // Admin user ID who sent the invitation
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: index("token_idx").on(table.token),
    emailIdx: index("email_idx").on(table.email),
  })
);

// ============================================
// PARTNERS
// ============================================

export const partners = mysqlTable(
  "partners",
  {
    id: int("id").autoincrement().primaryKey(),

    // Company info
    companyName: varchar("companyName", { length: 255 }).notNull(),
    tradeName: varchar("tradeName", { length: 255 }),
    legalForm: varchar("legalForm", { length: 50 }),
    vatNumber: varchar("vatNumber", { length: 50 }).notNull().unique(),
    registrationNumber: varchar("registrationNumber", { length: 100 }),

    // Primary address
    addressStreet: varchar("addressStreet", { length: 255 }).notNull(),
    addressStreet2: varchar("addressStreet2", { length: 255 }),
    addressCity: varchar("addressCity", { length: 100 }).notNull(),
    addressPostalCode: varchar("addressPostalCode", { length: 20 }).notNull(),
    addressCountry: varchar("addressCountry", { length: 2 }).default("BE"),
    addressRegion: varchar("addressRegion", { length: 100 }),

    // Billing address
    billingAddressSame: boolean("billingAddressSame").default(true),
    billingStreet: varchar("billingStreet", { length: 255 }),
    billingStreet2: varchar("billingStreet2", { length: 255 }),
    billingCity: varchar("billingCity", { length: 100 }),
    billingPostalCode: varchar("billingPostalCode", { length: 20 }),
    billingCountry: varchar("billingCountry", { length: 2 }),

    // Default delivery address
    deliveryStreet: varchar("deliveryStreet", { length: 255 }),
    deliveryStreet2: varchar("deliveryStreet2", { length: 255 }),
    deliveryCity: varchar("deliveryCity", { length: 100 }),
    deliveryPostalCode: varchar("deliveryPostalCode", { length: 20 }),
    deliveryCountry: varchar("deliveryCountry", { length: 2 }),
    deliveryInstructions: text("deliveryInstructions"),

    // Contacts
    primaryContactName: varchar("primaryContactName", { length: 255 }).notNull(),
    primaryContactEmail: varchar("primaryContactEmail", { length: 320 }).notNull(),
    primaryContactPhone: varchar("primaryContactPhone", { length: 50 }).notNull(),
    accountingEmail: varchar("accountingEmail", { length: 320 }),
    orderEmail: varchar("orderEmail", { length: 320 }),
    website: varchar("website", { length: 500 }),

    // Commercial conditions
    level: partnerLevelEnum.default("BRONZE").notNull(),
    discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("0"),
    paymentTermsDays: int("paymentTermsDays").default(30),
    creditLimit: decimal("creditLimit", { precision: 12, scale: 2 }).default("0"),
    creditUsed: decimal("creditUsed", { precision: 12, scale: 2 }).default("0"),

    // Pricing
    useCustomPricing: boolean("useCustomPricing").default(false),
    customPriceListId: int("customPriceListId"),

    // Sales assignment
    salesRepId: int("salesRepId"),
    territory: varchar("territory", { length: 100 }),

    // External IDs
    odooPartnerId: int("odooPartnerId"),
    stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),

    // Status
    status: partnerStatusEnum.default("PENDING").notNull(),
    approvedAt: timestamp("approvedAt"),
    approvedById: int("approvedById"),
    suspendedAt: timestamp("suspendedAt"),
    suspendedReason: text("suspendedReason"),

    // Preferences
    preferredLanguage: varchar("preferredLanguage", { length: 10 }).default("fr"),
    preferredCurrency: varchar("preferredCurrency", { length: 3 }).default("EUR"),
    newsletterOptIn: boolean("newsletterOptIn").default(true),

    // Stats
    totalOrders: int("totalOrders").default(0),
    totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).default("0"),
    lastOrderAt: timestamp("lastOrderAt"),

    // Notes
    internalNotes: text("internalNotes"),

    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    vatNumberIdx: index("vatNumber_idx").on(table.vatNumber),
    statusIdx: index("status_idx").on(table.status),
    levelIdx: index("level_idx").on(table.level),
    salesRepIdIdx: index("salesRepId_idx").on(table.salesRepId),
  })
);

export const partnerAddresses = mysqlTable(
  "partner_addresses",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").notNull(),

    label: varchar("label", { length: 255 }).notNull(),
    isDefault: boolean("isDefault").default(false),

    street: varchar("street", { length: 255 }).notNull(),
    street2: varchar("street2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    postalCode: varchar("postalCode", { length: 20 }).notNull(),
    country: varchar("country", { length: 2 }).notNull(),
    region: varchar("region", { length: 100 }),

    contactName: varchar("contactName", { length: 255 }),
    contactPhone: varchar("contactPhone", { length: 50 }),
    instructions: text("instructions"),

    deliveryHours: varchar("deliveryHours", { length: 255 }),
    closedDays: varchar("closedDays", { length: 255 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
  })
);

export const partnerContacts = mysqlTable(
  "partner_contacts",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").notNull(),

    firstName: varchar("firstName", { length: 100 }).notNull(),
    lastName: varchar("lastName", { length: 100 }).notNull(),
    role: varchar("role", { length: 100 }),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    mobile: varchar("mobile", { length: 50 }),

    isPrimary: boolean("isPrimary").default(false),
    receiveOrders: boolean("receiveOrders").default(true),
    receiveInvoices: boolean("receiveInvoices").default(true),
    receiveMarketing: boolean("receiveMarketing").default(true),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
  })
);

export const partnerDocuments = mysqlTable(
  "partner_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").notNull(),

    type: varchar("type", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
    fileSize: int("fileSize").notNull(),
    mimeType: varchar("mimeType", { length: 100 }).notNull(),

    expiresAt: timestamp("expiresAt"),
    uploadedById: int("uploadedById"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
  })
);

// ============================================
// PRODUCTS & CATALOG
// ============================================

export const productCategories = mysqlTable(
  "product_categories",
  {
    id: int("id").autoincrement().primaryKey(),

    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    imageUrl: varchar("imageUrl", { length: 500 }),

    parentId: int("parentId"),
    sortOrder: int("sortOrder").default(0),
    isActive: boolean("isActive").default(true),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    parentIdIdx: index("parentId_idx").on(table.parentId),
    slugIdx: index("slug_idx").on(table.slug),
  })
);

export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),

    // Basic info
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    shortDescription: text("shortDescription"),
    description: text("description"),

    // Category
    category: mysqlEnum("category", ["SPAS", "SWIM_SPAS", "MAINTENANCE", "COVERS", "ACCESSORIES", "OTHER"]).default("OTHER"),

    // Type
    type: varchar("type", { length: 50 }).default("physical"),

    // Pricing
    pricePublicHT: decimal("pricePublicHT", { precision: 10, scale: 2 }).notNull(),
    pricePartnerHT: decimal("pricePartnerHT", { precision: 10, scale: 2 }).notNull(),
    vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("21"),

    // Cost
    costPrice: decimal("costPrice", { precision: 10, scale: 2 }),

    // Stock
    trackStock: boolean("trackStock").default(true),
    stockQuantity: int("stockQuantity").default(0),
    stockReserved: int("stockReserved").default(0),
    lowStockThreshold: int("lowStockThreshold").default(5),

    // Shipping
    weight: decimal("weight", { precision: 10, scale: 3 }),
    length: decimal("length", { precision: 10, scale: 2 }),
    width: decimal("width", { precision: 10, scale: 2 }),
    height: decimal("height", { precision: 10, scale: 2 }),

    // Image
    imageUrl: text("imageUrl"),

    // External IDs
    sheetsRowId: int("sheetsRowId"),
    odooProductId: int("odooProductId"),

    // SEO
    metaTitle: varchar("metaTitle", { length: 255 }),
    metaDescription: text("metaDescription"),

    // Status
    isActive: boolean("isActive").default(true),
    isVisible: boolean("isVisible").default(true),
    isFeatured: boolean("isFeatured").default(false),

    // Sync
    lastSyncedAt: timestamp("lastSyncedAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    skuIdx: index("sku_idx").on(table.sku),
    categoryIdx: index("category_idx").on(table.category),
    activeVisibleIdx: index("active_visible_idx").on(table.isActive, table.isVisible),
  })
);

export const productVariants = mysqlTable(
  "product_variants",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull(),

    sku: varchar("sku", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),

    // Variant options
    color: varchar("color", { length: 50 }),
    size: varchar("size", { length: 50 }),
    voltage: varchar("voltage", { length: 50 }),
    material: varchar("material", { length: 100 }),

    // Pricing
    pricePublicHT: decimal("pricePublicHT", { precision: 10, scale: 2 }),
    pricePartnerHT: decimal("pricePartnerHT", { precision: 10, scale: 2 }),

    // Stock
    stockQuantity: int("stockQuantity").default(0),
    stockReserved: int("stockReserved").default(0),

    // External
    sheetsRowId: int("sheetsRowId"),
    odooProductId: int("odooProductId"),

    // Image
    imageUrl: text("imageUrl"),

    // Status
    isActive: boolean("isActive").default(true),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("productId_idx").on(table.productId),
    skuIdx: index("sku_idx").on(table.sku),
  })
);

export const variantOptions = mysqlTable(
  "variant_options",
  {
    id: int("id").autoincrement().primaryKey(),
    variantId: int("variantId").notNull(),
    optionName: varchar("optionName", { length: 100 }).notNull(),
    optionValue: varchar("optionValue", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    variantIdIdx: index("variantId_idx").on(table.variantId),
    optionNameIdx: index("optionName_idx").on(table.optionName),
  })
);

export const productImages = mysqlTable(
  "product_images",
  {
    id: int("id").autoincrement().primaryKey(),

    productId: int("productId"),
    variantId: int("variantId"),

    url: varchar("url", { length: 500 }).notNull(),
    altText: varchar("altText", { length: 255 }),
    sortOrder: int("sortOrder").default(0),
    isPrimary: boolean("isPrimary").default(false),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("productId_idx").on(table.productId),
    variantIdIdx: index("variantId_idx").on(table.variantId),
  })
);

export const productArrivals = mysqlTable(
  "product_arrivals",
  {
    id: int("id").autoincrement().primaryKey(),

    productId: int("productId"),
    variantId: int("variantId"),

    arrivalWeek: varchar("arrivalWeek", { length: 20 }).notNull(),
    expectedDate: timestamp("expectedDate"),
    quantity: int("quantity").notNull(),

    // Status
    status: varchar("status", { length: 50 }).default("expected"),
    receivedDate: timestamp("receivedDate"),
    receivedQty: int("receivedQty"),

    notes: text("notes"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("productId_idx").on(table.productId),
    variantIdIdx: index("variantId_idx").on(table.variantId),
    arrivalWeekIdx: index("arrivalWeek_idx").on(table.arrivalWeek),
  })
);

export const priceLists = mysqlTable("price_lists", {
  id: int("id").autoincrement().primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("0"),

  isActive: boolean("isActive").default(true),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const productPriceOverrides = mysqlTable(
  "product_price_overrides",
  {
    id: int("id").autoincrement().primaryKey(),

    productId: int("productId").notNull(),
    partnerId: int("partnerId").notNull(),

    priceHT: decimal("priceHT", { precision: 10, scale: 2 }).notNull(),

    validFrom: timestamp("validFrom").defaultNow().notNull(),
    validTo: timestamp("validTo"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    productPartnerUniq: unique("product_partner_uniq").on(table.productId, table.partnerId),
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
  })
);

// ============================================
// ORDERS
// ============================================

export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),

    // Partner
    partnerId: int("partnerId").notNull(),

    // Created by
    createdById: int("createdById"),

    // Amounts
    subtotalHT: decimal("subtotalHT", { precision: 12, scale: 2 }).notNull(),
    discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0"),
    discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("0"),
    shippingHT: decimal("shippingHT", { precision: 12, scale: 2 }).default("0"),
    totalHT: decimal("totalHT", { precision: 12, scale: 2 }).notNull(),
    totalVAT: decimal("totalVAT", { precision: 12, scale: 2 }).notNull(),
    totalTTC: decimal("totalTTC", { precision: 12, scale: 2 }).notNull(),

    // Deposit
    depositPercent: decimal("depositPercent", { precision: 5, scale: 2 }).default("30"),
    depositAmount: decimal("depositAmount", { precision: 12, scale: 2 }).notNull(),
    depositPaid: boolean("depositPaid").default(false),
    depositPaidAt: timestamp("depositPaidAt"),
    depositReminderSentAt: timestamp("depositReminderSentAt"),
    depositReminderCount: int("depositReminderCount").default(0),

    // Balance
    balanceAmount: decimal("balanceAmount", { precision: 12, scale: 2 }).notNull(),
    balancePaid: boolean("balancePaid").default(false),
    balancePaidAt: timestamp("balancePaidAt"),

    // Currency
    currency: varchar("currency", { length: 3 }).default("EUR"),

    // Delivery
    deliveryAddressId: int("deliveryAddressId"),

    // Custom address
    deliveryStreet: varchar("deliveryStreet", { length: 255 }),
    deliveryStreet2: varchar("deliveryStreet2", { length: 255 }),
    deliveryCity: varchar("deliveryCity", { length: 100 }),
    deliveryPostalCode: varchar("deliveryPostalCode", { length: 20 }),
    deliveryCountry: varchar("deliveryCountry", { length: 2 }),
    deliveryContactName: varchar("deliveryContactName", { length: 255 }),
    deliveryContactPhone: varchar("deliveryContactPhone", { length: 50 }),
    deliveryInstructions: text("deliveryInstructions"),

    // Requested delivery
    deliveryRequestedWeek: varchar("deliveryRequestedWeek", { length: 20 }),
    deliveryRequestedDate: timestamp("deliveryRequestedDate"),
    deliveryConfirmedDate: timestamp("deliveryConfirmedDate"),

    // Shipping info
    shippingMethod: varchar("shippingMethod", { length: 100 }),
    shippingCarrier: varchar("shippingCarrier", { length: 100 }),
    trackingNumber: varchar("trackingNumber", { length: 255 }),
    trackingUrl: varchar("trackingUrl", { length: 500 }),
    shippedAt: timestamp("shippedAt"),
    deliveredAt: timestamp("deliveredAt"),

    // Payment
    paymentMethod: varchar("paymentMethod", { length: 50 }),
    stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
    stripePaymentStatus: mysqlEnum("stripePaymentStatus", [
      "PENDING",
      "PROCESSING",
      "SUCCEEDED",
      "FAILED",
      "REFUNDED",
      "PARTIALLY_REFUNDED",
    ]),

    // Odoo
    odooQuoteId: int("odooQuoteId"),
    odooQuoteNumber: varchar("odooQuoteNumber", { length: 100 }),

    // Status
    status: mysqlEnum("status", [
      "DRAFT",
      "PENDING_APPROVAL",
      "PENDING_DEPOSIT",
      "DEPOSIT_PAID",
      "IN_PRODUCTION",
      "READY_TO_SHIP",
      "PARTIALLY_SHIPPED",
      "SHIPPED",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
      "REFUNDED",
    ]).default("DRAFT").notNull(),

    // Notes
    internalNotes: text("internalNotes"),
    customerNotes: text("customerNotes"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    orderNumberIdx: index("orderNumber_idx").on(table.orderNumber),
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
    statusIdx: index("status_idx").on(table.status),
    createdAtIdx: index("createdAt_idx").on(table.createdAt),
  })
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),

    productId: int("productId"),
    variantId: int("variantId"),

    sku: varchar("sku", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),

    quantity: int("quantity").notNull(),
    unitPriceHT: decimal("unitPriceHT", { precision: 10, scale: 2 }).notNull(),
    discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("0"),
    discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).default("0"),
    totalHT: decimal("totalHT", { precision: 12, scale: 2 }).notNull(),
    vatRate: decimal("vatRate", { precision: 5, scale: 2 }).notNull(),
    totalVAT: decimal("totalVAT", { precision: 12, scale: 2 }).notNull(),
    totalTTC: decimal("totalTTC", { precision: 12, scale: 2 }).notNull(),

    // Shipping
    quantityShipped: int("quantityShipped").default(0),
    quantityDelivered: int("quantityDelivered").default(0),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index("orderId_idx").on(table.orderId),
    productIdIdx: index("productId_idx").on(table.productId),
  })
);

// ============================================
// INVOICES & PAYMENTS
// ============================================

export const invoices = mysqlTable(
  "invoices",
  {
    id: int("id").autoincrement().primaryKey(),
    invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),

    type: invoiceTypeEnum.notNull(),
    status: invoiceStatusEnum.default("DRAFT").notNull(),

    // Relations
    partnerId: int("partnerId").notNull(),
    orderId: int("orderId"),

    // Amounts
    subtotalHT: decimal("subtotalHT", { precision: 12, scale: 2 }).notNull(),
    discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0"),
    totalHT: decimal("totalHT", { precision: 12, scale: 2 }).notNull(),
    totalVAT: decimal("totalVAT", { precision: 12, scale: 2 }).notNull(),
    totalTTC: decimal("totalTTC", { precision: 12, scale: 2 }).notNull(),

    // Payment
    amountPaid: decimal("amountPaid", { precision: 12, scale: 2 }).default("0"),
    amountDue: decimal("amountDue", { precision: 12, scale: 2 }).notNull(),

    currency: varchar("currency", { length: 3 }).default("EUR"),

    // Dates
    issueDate: timestamp("issueDate").notNull(),
    dueDate: timestamp("dueDate"),
    paidAt: timestamp("paidAt"),

    // Odoo
    odooInvoiceId: int("odooInvoiceId"),
    odooInvoiceNumber: varchar("odooInvoiceNumber", { length: 100 }),

    // File
    pdfUrl: varchar("pdfUrl", { length: 500 }),

    // Notes
    notes: text("notes"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    invoiceNumberIdx: index("invoiceNumber_idx").on(table.invoiceNumber),
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
    orderIdIdx: index("orderId_idx").on(table.orderId),
    statusIdx: index("status_idx").on(table.status),
  })
);

export const payments = mysqlTable(
  "payments",
  {
    id: int("id").autoincrement().primaryKey(),

    partnerId: int("partnerId").notNull(),
    orderId: int("orderId"),
    invoiceId: int("invoiceId"),

    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("EUR"),

    method: varchar("method", { length: 50 }).notNull(),
    status: paymentStatusEnum.default("PENDING").notNull(),

    // Stripe
    stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
    stripeChargeId: varchar("stripeChargeId", { length: 255 }),

    // Dates
    paidAt: timestamp("paidAt"),
    failedAt: timestamp("failedAt"),
    refundedAt: timestamp("refundedAt"),

    // Refund
    refundAmount: decimal("refundAmount", { precision: 12, scale: 2 }).default("0"),
    refundReason: text("refundReason"),

    // Notes
    notes: text("notes"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
    orderIdIdx: index("orderId_idx").on(table.orderId),
    statusIdx: index("status_idx").on(table.status),
  })
);

// ============================================
// RESOURCES
// ============================================

export const resources = mysqlTable(
  "resources",
  {
    id: int("id").autoincrement().primaryKey(),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: mysqlEnum("category", [
      "TECHNICAL_DOC",
      "VIDEO_TUTORIAL",
      "TROUBLESHOOTING",
      "MARKETING_IMAGE",
      "CATALOG",
      "PLV",
      "SALES_GUIDE",
      "INSTALLATION",
      "WARRANTY",
      "CERTIFICATE",
    ]).notNull(),

    // File
    fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
    fileType: varchar("fileType", { length: 50 }).notNull(),
    fileSize: int("fileSize").notNull(),
    thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),

    // Access control
    isPublic: boolean("isPublic").default(false),
    requiredPartnerLevel: mysqlEnum("requiredPartnerLevel", [
      "BRONZE",
      "SILVER",
      "GOLD",
      "PLATINUM",
      "VIP",
    ]),

    // Metadata
    tags: text("tags"),
    language: varchar("language", { length: 10 }).default("fr"),

    // Stats
    downloadCount: int("downloadCount").default(0),
    viewCount: int("viewCount").default(0),

    // Status
    isActive: boolean("isActive").default(true),

    // Relations
    uploadedById: int("uploadedById"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("category_idx").on(table.category),
    isActiveIdx: index("isActive_idx").on(table.isActive),
  })
);

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),

    userId: int("userId").notNull(),
    type: mysqlEnum("type", [
      "ORDER_CREATED",
      "ORDER_STATUS_CHANGED",
      "PAYMENT_RECEIVED",
      "PAYMENT_FAILED",
      "INVOICE_READY",
      "STOCK_LOW",
      "NEW_PARTNER",
      "PARTNER_APPROVED",
      "NEW_RESOURCE",
      "SYSTEM_ALERT",
    ]).notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),

    // Links
    linkUrl: varchar("linkUrl", { length: 500 }),
    linkText: varchar("linkText", { length: 100 }),

    // Related entities
    orderId: int("orderId"),
    partnerId: int("partnerId"),
    invoiceId: int("invoiceId"),

    // Status
    isRead: boolean("isRead").default(false),
    readAt: timestamp("readAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    isReadIdx: index("isRead_idx").on(table.isRead),
    createdAtIdx: index("createdAt_idx").on(table.createdAt),
  })
);

// ============================================
// ACTIVITY LOGS
// ============================================

export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: int("id").autoincrement().primaryKey(),

    userId: int("userId"),
    partnerId: int("partnerId"),

    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entityType", { length: 50 }),
    entityId: int("entityId"),

    description: text("description"),
    metadata: text("metadata"),

    ipAddress: varchar("ipAddress", { length: 50 }),
    userAgent: text("userAgent"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
    createdAtIdx: index("createdAt_idx").on(table.createdAt),
  })
);

// ============================================
// CART (PANIER)
// ============================================

export const cartItems = mysqlTable(
  "cart_items",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    productId: int("productId").notNull(),
    variantId: int("variantId"),
    quantity: int("quantity").notNull().default(1),
    isPreorder: boolean("isPreorder").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    productIdIdx: index("productId_idx").on(table.productId),
    userProductUniq: unique("user_product_variant_uniq").on(table.userId, table.productId, table.variantId),
  })
);

// ============================================
// FAVORITES (FAVORIS)
// ============================================

export const favorites = mysqlTable(
  "favorites",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    productId: int("productId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    userProductUniq: unique("user_product_uniq").on(table.userId, table.productId),
  })
);

// ============================================
// INCOMING STOCK (ARRIVAGES)
// ============================================

export const incomingStock = mysqlTable(
  "incoming_stock",
  {
    id: int("id").autoincrement().primaryKey(),

    productId: int("productId"),
    variantId: int("variantId"),

    quantity: int("quantity").notNull(),
    expectedWeek: int("expectedWeek").notNull(),
    expectedYear: int("expectedYear").notNull(),

    status: mysqlEnum("status", ["PENDING", "ARRIVED", "CANCELLED"]).default("PENDING"),
    notes: text("notes"),

    arrivedAt: timestamp("arrivedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("productId_idx").on(table.productId),
    variantIdIdx: index("variantId_idx").on(table.variantId),
    expectedWeekIdx: index("expectedWeek_idx").on(table.expectedWeek, table.expectedYear),
    statusIdx: index("status_idx").on(table.status),
  })
);

// ============================================
// EVENTS & CALENDAR
// ============================================

export const eventTypeEnum = mysqlEnum("event_type", [
  "PROMOTION",
  "EVENT",
  "ANNOUNCEMENT",
  "TRAINING",
  "WEBINAR",
]);

export const events = mysqlTable(
  "events",
  {
    id: int("id").autoincrement().primaryKey(),
    
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    type: mysqlEnum("type", ["PROMOTION", "EVENT", "ANNOUNCEMENT", "TRAINING", "WEBINAR"]).notNull(),
    
    // Dates
    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate"),
    allDay: boolean("allDay").default(false),
    
    // Promotion details
    discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }),
    promoCode: varchar("promoCode", { length: 50 }),
    
    // Media
    imageUrl: varchar("imageUrl", { length: 500 }),
    attachmentUrl: varchar("attachmentUrl", { length: 500 }),
    
    // Visibility
    isPublished: boolean("isPublished").default(false),
    targetPartnerLevels: text("targetPartnerLevels"), // JSON array of levels
    
    // Metadata
    createdBy: int("createdBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    startDateIdx: index("startDate_idx").on(table.startDate),
    typeIdx: index("type_idx").on(table.type),
    isPublishedIdx: index("isPublished_idx").on(table.isPublished),
  })
);

// ============================================
// LEADS MANAGEMENT (Meta Ads Integration)
// ============================================

export const leadStatusEnum = mysqlEnum("status", [
  "NEW",
  "ASSIGNED",
  "CONTACTED",
  "NO_RESPONSE",
  "QUALIFIED",
  "NOT_QUALIFIED",
  "MEETING_SCHEDULED",
  "QUOTE_SENT",
  "NEGOTIATION",
  "CONVERTED",
  "LOST",
]);

export const leadSourceEnum = mysqlEnum("source", [
  "META_ADS",
  "GOOGLE_ADS",
  "WEBSITE",
  "REFERRAL",
  "PHONE",
  "EMAIL",
  "TRADE_SHOW",
  "OTHER",
]);

export const leads = mysqlTable(
  "leads",
  {
    id: int("id").autoincrement().primaryKey(),
    
    // Contact info
    firstName: varchar("firstName", { length: 100 }),
    lastName: varchar("lastName", { length: 100 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    
    // Address
    address: varchar("address", { length: 255 }),
    city: varchar("city", { length: 100 }),
    postalCode: varchar("postalCode", { length: 20 }),
    country: varchar("country", { length: 100 }).default("Belgium"),
    
    // Lead details
    status: leadStatusEnum.default("NEW").notNull(),
    source: leadSourceEnum.default("META_ADS").notNull(),
    
    // Meta Ads specific
    metaLeadgenId: varchar("metaLeadgenId", { length: 100 }),
    metaFormId: varchar("metaFormId", { length: 100 }),
    metaAdId: varchar("metaAdId", { length: 100 }),
    metaAdsetId: varchar("metaAdsetId", { length: 100 }),
    metaCampaignId: varchar("metaCampaignId", { length: 100 }),
    metaPageId: varchar("metaPageId", { length: 100 }),
    
    // Custom fields from form
    productInterest: varchar("productInterest", { length: 255 }),
    budget: varchar("budget", { length: 100 }),
    timeline: varchar("timeline", { length: 100 }),
    message: text("message"),
    customFields: text("customFields"), // JSON for additional form fields
    
    // Assignment
    assignedPartnerId: int("assignedPartnerId"),
    assignedAt: timestamp("assignedAt"),
    assignmentReason: varchar("assignmentReason", { length: 255 }), // e.g., "postal_code_match"
    
    // Tracking
    firstContactAt: timestamp("firstContactAt"),
    lastContactAt: timestamp("lastContactAt"),
    contactAttempts: int("contactAttempts").default(0),
    
    // Conversion
    convertedAt: timestamp("convertedAt"),
    convertedOrderId: int("convertedOrderId"),
    estimatedValue: decimal("estimatedValue", { precision: 12, scale: 2 }),
    actualValue: decimal("actualValue", { precision: 12, scale: 2 }),
    
    // Notes
    notes: text("notes"),
    lostReason: varchar("lostReason", { length: 255 }),
    
    // Timestamps
    receivedAt: timestamp("receivedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    statusIdx: index("status_idx").on(table.status),
    sourceIdx: index("source_idx").on(table.source),
    assignedPartnerIdIdx: index("assignedPartnerId_idx").on(table.assignedPartnerId),
    postalCodeIdx: index("postalCode_idx").on(table.postalCode),
    metaLeadgenIdIdx: index("metaLeadgenId_idx").on(table.metaLeadgenId),
    receivedAtIdx: index("receivedAt_idx").on(table.receivedAt),
  })
);

export const leadStatusHistory = mysqlTable(
  "lead_status_history",
  {
    id: int("id").autoincrement().primaryKey(),
    leadId: int("leadId").notNull(),
    
    previousStatus: leadStatusEnum,
    newStatus: leadStatusEnum.notNull(),
    
    changedBy: int("changedBy"), // userId
    notes: text("notes"),
    
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    leadIdIdx: index("leadId_idx").on(table.leadId),
    createdAtIdx: index("createdAt_idx").on(table.createdAt),
  })
);

// Partner postal code coverage for lead distribution
export const partnerPostalCodes = mysqlTable(
  "partner_postal_codes",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").notNull(),
    postalCode: varchar("postalCode", { length: 20 }).notNull(),
    priority: int("priority").default(1), // Higher = preferred
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
    postalCodeIdx: index("postalCode_idx").on(table.postalCode),
    uniquePartnerPostal: unique("unique_partner_postal").on(table.partnerId, table.postalCode),
  })
);

// Meta Ads campaign tracking
export const metaCampaigns = mysqlTable(
  "meta_campaigns",
  {
    id: int("id").autoincrement().primaryKey(),
    
    metaCampaignId: varchar("metaCampaignId", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    
    // Budget
    dailyBudget: decimal("dailyBudget", { precision: 12, scale: 2 }),
    lifetimeBudget: decimal("lifetimeBudget", { precision: 12, scale: 2 }),
    
    // Stats (updated periodically)
    totalSpend: decimal("totalSpend", { precision: 12, scale: 2 }).default("0"),
    totalImpressions: int("totalImpressions").default(0),
    totalClicks: int("totalClicks").default(0),
    totalLeads: int("totalLeads").default(0),
    costPerLead: decimal("costPerLead", { precision: 10, scale: 2 }),
    
    // Status
    status: varchar("status", { length: 50 }).default("ACTIVE"),
    
    // Sync
    lastSyncedAt: timestamp("lastSyncedAt"),
    
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    metaCampaignIdIdx: index("metaCampaignId_idx").on(table.metaCampaignId),
    statusIdx: index("status_idx").on(table.status),
  })
);

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type IncomingStock = typeof incomingStock.$inferSelect;
export type InsertIncomingStock = typeof incomingStock.$inferInsert;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export type LeadStatusHistory = typeof leadStatusHistory.$inferSelect;
export type InsertLeadStatusHistory = typeof leadStatusHistory.$inferInsert;

export type PartnerPostalCode = typeof partnerPostalCodes.$inferSelect;
export type InsertPartnerPostalCode = typeof partnerPostalCodes.$inferInsert;

export type MetaCampaign = typeof metaCampaigns.$inferSelect;
export type InsertMetaCampaign = typeof metaCampaigns.$inferInsert;

// ============================================
// META AD ACCOUNTS (OAuth connected)
// ============================================

export const metaAdAccounts = mysqlTable(
  "meta_ad_accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    
    // Meta identifiers
    metaUserId: varchar("metaUserId", { length: 100 }).notNull(),
    metaUserName: varchar("metaUserName", { length: 255 }),
    adAccountId: varchar("adAccountId", { length: 100 }).notNull(),
    adAccountName: varchar("adAccountName", { length: 255 }),
    currency: varchar("currency", { length: 10 }).default("EUR"),
    timezone: varchar("timezone", { length: 100 }),
    
    // OAuth tokens
    accessToken: text("accessToken").notNull(),
    tokenExpiresAt: timestamp("tokenExpiresAt"),
    
    // Connection info
    connectedBy: int("connectedBy").notNull(), // userId who connected
    isActive: boolean("isActive").default(true),
    lastSyncedAt: timestamp("lastSyncedAt"),
    syncError: text("syncError"),
    
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    adAccountIdIdx: index("adAccountId_idx").on(table.adAccountId),
    connectedByIdx: index("connectedBy_idx").on(table.connectedBy),
  })
);

export type MetaAdAccount = typeof metaAdAccounts.$inferSelect;
export type InsertMetaAdAccount = typeof metaAdAccounts.$inferInsert;

// ============================================
// GOOGLE AD ACCOUNTS (OAuth connected)
// ============================================

export const googleAdAccounts = mysqlTable(
  "google_ad_accounts",
  {
    id: int("id").autoincrement().primaryKey(),
    
    // Google identifiers
    googleUserId: varchar("googleUserId", { length: 100 }).notNull(),
    googleUserEmail: varchar("googleUserEmail", { length: 255 }),
    customerId: varchar("customerId", { length: 100 }).notNull(), // Google Ads Customer ID
    customerName: varchar("customerName", { length: 255 }),
    currency: varchar("currency", { length: 10 }).default("EUR"),
    timezone: varchar("timezone", { length: 100 }),
    
    // OAuth tokens
    accessToken: text("accessToken").notNull(),
    refreshToken: text("refreshToken"), // Google provides refresh tokens
    tokenExpiresAt: timestamp("tokenExpiresAt"),
    
    // Connection info
    connectedBy: int("connectedBy").notNull(), // userId who connected
    isActive: boolean("isActive").default(true),
    lastSyncedAt: timestamp("lastSyncedAt"),
    syncError: text("syncError"),
    
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  },
  (table) => ({
    customerIdIdx: index("customerId_idx").on(table.customerId),
    connectedByIdx: index("connectedBy_idx").on(table.connectedBy),
  })
);

export type GoogleAdAccount = typeof googleAdAccounts.$inferSelect;
export type InsertGoogleAdAccount = typeof googleAdAccounts.$inferInsert;

// ============================================
// TERRITORY MANAGEMENT
// ============================================

// Countries table
export const countries = mysqlTable(
  "countries",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 2 }).notNull().unique(), // ISO 3166-1 alpha-2 (BE, CH, ES, FR, DE)
    name: varchar("name", { length: 100 }).notNull(),
    nameEn: varchar("nameEn", { length: 100 }).notNull(),
    nameFr: varchar("nameFr", { length: 100 }).notNull(),
    nameNl: varchar("nameNl", { length: 100 }).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: index("code_idx").on(table.code),
  })
);

// Regions table (provinces, cantons, etc.)
export const regions = mysqlTable(
  "regions",
  {
    id: int("id").autoincrement().primaryKey(),
    countryId: int("countryId").notNull(),
    code: varchar("code", { length: 10 }).notNull(), // Ex: WAL, FLA, ZH, GE
    name: varchar("name", { length: 100 }).notNull(),
    nameEn: varchar("nameEn", { length: 100 }),
    nameFr: varchar("nameFr", { length: 100 }),
    nameNl: varchar("nameNl", { length: 100 }),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    countryIdIdx: index("countryId_idx").on(table.countryId),
    uniqueCountryCode: unique("unique_country_code").on(table.countryId, table.code),
  })
);

// Postal code ranges by region
export const postalCodeRanges = mysqlTable(
  "postal_code_ranges",
  {
    id: int("id").autoincrement().primaryKey(),
    regionId: int("regionId").notNull(),
    startCode: varchar("startCode", { length: 20 }).notNull(),
    endCode: varchar("endCode", { length: 20 }).notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    regionIdIdx: index("regionId_idx").on(table.regionId),
    startCodeIdx: index("startCode_idx").on(table.startCode),
  })
);

// Partner territories (replaces partnerPostalCodes)
// EXCLUSIVE SYSTEM: 1 region = 1 partner only
export const partnerTerritories = mysqlTable(
  "partner_territories",
  {
    id: int("id").autoincrement().primaryKey(),
    partnerId: int("partnerId").notNull(),
    regionId: int("regionId").notNull(),
    assignedAt: timestamp("assignedAt").defaultNow().notNull(),
    assignedBy: int("assignedBy"), // User ID who assigned
    notes: text("notes"),
  },
  (table) => ({
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
    regionIdIdx: index("regionId_idx").on(table.regionId),
    uniqueRegion: unique("unique_region").on(table.regionId), // ONE region = ONE partner
  })
);

export type Country = typeof countries.$inferSelect;
export type InsertCountry = typeof countries.$inferInsert;

export type Region = typeof regions.$inferSelect;
export type InsertRegion = typeof regions.$inferInsert;

export type PostalCodeRange = typeof postalCodeRanges.$inferSelect;
export type InsertPostalCodeRange = typeof postalCodeRanges.$inferInsert;

export type PartnerTerritory = typeof partnerTerritories.$inferSelect;
export type InsertPartnerTerritory = typeof partnerTerritories.$inferInsert;


// ============================================
// TECHNICAL RESOURCES & FORUM
// ============================================

// Enums for technical resources and forum
const technicalResourceTypeEnum = ["PDF", "VIDEO", "LINK"] as const;
const forumTopicStatusEnum = ["OPEN", "RESOLVED", "CLOSED"] as const;

// Technical resources (PDFs, videos, links)
export const technicalResources = mysqlTable(
  "technical_resources",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    type: mysqlEnum("type", technicalResourceTypeEnum).notNull(),
    fileUrl: text("fileUrl"), // S3 URL or external link
    category: varchar("category", { length: 100 }), // e.g., "Installation", "Troubleshooting", "Maintenance"
    productCategory: mysqlEnum("productCategory", ["SPAS", "SWIM_SPAS", "MAINTENANCE", "COVERS", "ACCESSORIES", "OTHER"]),
    tags: text("tags"), // JSON array of tags
    viewCount: int("viewCount").default(0).notNull(),
    isPublic: boolean("isPublic").default(true).notNull(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    typeIdx: index("type_idx").on(table.type),
    categoryIdx: index("category_idx").on(table.category),
    productCategoryIdx: index("productCategory_idx").on(table.productCategory),
    createdByIdx: index("createdBy_idx").on(table.createdBy),
  })
);

// Forum topics
export const forumTopics = mysqlTable(
  "forum_topics",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 100 }), // e.g., "Installation", "Troubleshooting", "General"
    productCategory: mysqlEnum("productCategory", ["SPAS", "SWIM_SPAS", "MAINTENANCE", "COVERS", "ACCESSORIES", "OTHER"]),
    status: mysqlEnum("status", forumTopicStatusEnum).default("OPEN").notNull(),
    authorId: int("authorId").notNull(),
    viewCount: int("viewCount").default(0).notNull(),
    replyCount: int("replyCount").default(0).notNull(),
    lastReplyAt: timestamp("lastReplyAt"),
    lastReplyBy: int("lastReplyBy"),
    isPinned: boolean("isPinned").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("category_idx").on(table.category),
    productCategoryIdx: index("productCategory_idx").on(table.productCategory),
    statusIdx: index("status_idx").on(table.status),
    authorIdIdx: index("authorId_idx").on(table.authorId),
    lastReplyAtIdx: index("lastReplyAt_idx").on(table.lastReplyAt),
  })
);

// Forum replies
export const forumReplies = mysqlTable(
  "forum_replies",
  {
    id: int("id").autoincrement().primaryKey(),
    topicId: int("topicId").notNull(),
    authorId: int("authorId").notNull(),
    content: text("content").notNull(),
    isAdminReply: boolean("isAdminReply").default(false).notNull(),
    isHelpful: boolean("isHelpful").default(false).notNull(), // Marked as helpful by topic author
    helpfulCount: int("helpfulCount").default(0).notNull(), // Number of users who found this helpful
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    topicIdIdx: index("topicId_idx").on(table.topicId),
    authorIdIdx: index("authorId_idx").on(table.authorId),
    createdAtIdx: index("createdAt_idx").on(table.createdAt),
  })
);

export type TechnicalResource = typeof technicalResources.$inferSelect;
export type InsertTechnicalResource = typeof technicalResources.$inferInsert;

export type ForumTopic = typeof forumTopics.$inferSelect;
export type InsertForumTopic = typeof forumTopics.$inferInsert;

export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = typeof forumReplies.$inferInsert;

// ============================================
// TEAM MANAGEMENT
// ============================================

export const teamRoleEnum = mysqlEnum("team_role", [
  "OWNER",
  "SALES_REP",
  "ORDER_MANAGER",
  "ACCOUNTANT",
  "FULL_MANAGER",
]);

export const invitationStatusEnum = mysqlEnum("invitation_status", [
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "CANCELLED",
]);

// Team invitations
export const teamInvitations = mysqlTable(
  "team_invitations",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    partnerId: int("partnerId").notNull(),
    role: teamRoleEnum.notNull(),
    permissions: text("permissions"), // JSON string for custom permissions
    invitedBy: int("invitedBy").notNull(),
    status: invitationStatusEnum.default("PENDING").notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    acceptedAt: timestamp("acceptedAt"),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
    tokenIdx: index("token_idx").on(table.token),
    statusIdx: index("status_idx").on(table.status),
  })
);

// Team members (users linked to partners with specific roles)
export const teamMembers = mysqlTable(
  "team_members",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    partnerId: int("partnerId").notNull(),
    role: teamRoleEnum.notNull(),
    permissions: text("permissions"), // JSON string for granular permissions
    addedBy: int("addedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
    uniqueUserPartner: unique("unique_user_partner").on(table.userId, table.partnerId),
  })
);

export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = typeof teamInvitations.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ============================================
// RETURNS
// ============================================

// Return status enum
export const returnStatusEnum = mysqlEnum("return_status", [
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "IN_TRANSIT",
  "RECEIVED",
  "REFUNDED",
]);

// Return reason enum
export const returnReasonEnum = mysqlEnum("return_reason", [
  "DEFECTIVE",
  "WRONG_ITEM",
  "NOT_AS_DESCRIBED",
  "CHANGED_MIND",
  "OTHER",
]);

// Returns table
export const returns = mysqlTable(
  "returns",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    partnerId: int("partnerId").notNull(),
    status: returnStatusEnum.default("REQUESTED").notNull(),
    totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }),
    notes: text("notes"),
    adminNotes: text("adminNotes"),
    trackingNumber: varchar("trackingNumber", { length: 255 }),
    refundAmount: decimal("refundAmount", { precision: 10, scale: 2 }),
    refundedAt: timestamp("refundedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    approvedAt: timestamp("approvedAt"),
    rejectedAt: timestamp("rejectedAt"),
    receivedAt: timestamp("receivedAt"),
  },
  (table) => ({
    orderIdIdx: index("orderId_idx").on(table.orderId),
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
    statusIdx: index("status_idx").on(table.status),
  })
);

// Return items table
export const returnItems = mysqlTable(
  "return_items",
  {
    id: int("id").autoincrement().primaryKey(),
    returnId: int("returnId").notNull(),
    productId: int("productId").notNull(),
    quantity: int("quantity").notNull(),
    reason: returnReasonEnum.notNull(),
    reasonDetails: text("reasonDetails"),
    unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    returnIdIdx: index("returnId_idx").on(table.returnId),
    productIdIdx: index("productId_idx").on(table.productId),
  })
);

// Return photos table
export const returnPhotos = mysqlTable(
  "return_photos",
  {
    id: int("id").autoincrement().primaryKey(),
    returnId: int("returnId").notNull(),
    photoUrl: varchar("photoUrl", { length: 512 }).notNull(),
    photoKey: varchar("photoKey", { length: 512 }).notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    returnIdIdx: index("returnId_idx").on(table.returnId),
  })
);

export type Return = typeof returns.$inferSelect;
export type InsertReturn = typeof returns.$inferInsert;

export type ReturnItem = typeof returnItems.$inferSelect;
export type InsertReturnItem = typeof returnItems.$inferInsert;

export type ReturnPhoto = typeof returnPhotos.$inferSelect;
export type InsertReturnPhoto = typeof returnPhotos.$inferInsert;


// ============================================
// AFTER-SALES SERVICE (SAV)
// ============================================

// SAV status enum (9 statuts)
export const savStatusEnum = mysqlEnum("status", [
  "NEW",
  "ANALYZING",
  "INFO_REQUIRED",
  "QUOTE_PENDING",
  "PAYMENT_CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "RESOLVED",
  "CLOSED",
]);

// SAV urgency enum
export const savUrgencyEnum = mysqlEnum("urgency", [
  "NORMAL",
  "URGENT",
  "CRITICAL",
]);

// SAV issue type enum (types de défaut)
export const savIssueTypeEnum = mysqlEnum("issueType", [
  "LEAK",
  "CRACK_BLISTER_DELAMINATION",
  "ELECTRICAL_FAILURE",
  "MALFUNCTION",
  "ABNORMAL_NOISE",
  "BREAKAGE",
  "DISCOLORATION_WEAR",
  "HEATING_ISSUE",
  "PEELING_SHRINKAGE",
  "OTHER",
]);

// SAV brand enum
export const savBrandEnum = mysqlEnum("brand", [
  "MARKET_SPAS",
  "WELLIS_CLASSIC",
  "WELLIS_LIFE",
  "WELLIS_WIBES",
  "PASSION_SPAS",
  "PLATINUM_SPAS",
]);

// SAV usage type enum
export const savUsageTypeEnum = mysqlEnum("usageType", [
  "PRIVATE",
  "COMMERCIAL",
  "HOLIDAY_LET",
]);

// SAV warranty status enum
export const savWarrantyStatusEnum = mysqlEnum("warrantyStatus", [
  "COVERED",
  "PARTIAL",
  "EXPIRED",
  "EXCLUDED",
  "REVIEW_NEEDED",
]);

// SAV tracking carrier enum
export const savTrackingCarrierEnum = mysqlEnum("trackingCarrier", [
  "BPOST",
  "DHL",
  "UPS",
  "GLS",
  "MONDIAL_RELAY",
  "OTHER",
]);

// Spare part category enum
export const sparePartCategoryEnum = mysqlEnum("category", [
  "PUMPS",
  "ELECTRONICS",
  "JETS",
  "SCREENS",
  "HEATING",
  "PLUMBING",
  "COVERS",
  "CABINETS",
  "LIGHTING",
  "AUDIO",
  "OZONE_UVC",
  "OTHER",
]);

// Warranty start type enum
export const warrantyStartTypeEnum = mysqlEnum("warrantyStartType", [
  "PURCHASE_DATE",
  "DELIVERY_DATE",
]);

// After-sales services table (refonte SAV intelligent)
export const afterSalesServices = mysqlTable(
  "after_sales_services",
  {
    id: int("id").autoincrement().primaryKey(),
    ticketNumber: varchar("ticketNumber", { length: 50 }).notNull().unique(),
    partnerId: int("partnerId").notNull(),
    productId: int("productId"),
    serialNumber: varchar("serialNumber", { length: 100 }).notNull(),
    issueType: savIssueTypeEnum.notNull(),
    description: text("description").notNull(),
    urgency: savUrgencyEnum.notNull().default("NORMAL"),
    status: savStatusEnum.notNull().default("NEW"),

    // Product identification
    brand: savBrandEnum,
    productLine: varchar("productLine", { length: 100 }),
    modelName: varchar("modelName", { length: 255 }),
    component: varchar("component", { length: 255 }),
    defectType: varchar("defectType", { length: 255 }),

    // Dates for warranty calculation
    purchaseDate: date("purchaseDate"),
    deliveryDate: date("deliveryDate"),

    // Usage and conditions
    usageType: savUsageTypeEnum.default("PRIVATE"),
    isOriginalBuyer: boolean("isOriginalBuyer").default(true),
    isModified: boolean("isModified").default(false),
    isMaintenanceConform: boolean("isMaintenanceConform").default(true),
    isChemistryConform: boolean("isChemistryConform").default(true),
    usesHydrogenPeroxide: boolean("usesHydrogenPeroxide").default(false),

    // Warranty analysis
    warrantyStatus: savWarrantyStatusEnum.default("REVIEW_NEEDED"),
    warrantyPercentage: int("warrantyPercentage").default(0),
    warrantyExpiryDate: date("warrantyExpiryDate"),
    warrantyAnalysisDetails: text("warrantyAnalysisDetails"), // JSON string
    adminWarrantyOverride: boolean("adminWarrantyOverride").default(false),
    adminWarrantyNotes: text("adminWarrantyNotes"),

    // Customer information
    customerName: varchar("customerName", { length: 255 }),
    customerPhone: varchar("customerPhone", { length: 50 }),
    customerEmail: varchar("customerEmail", { length: 255 }),
    customerAddress: text("customerAddress"),
    installationDate: date("installationDate"),

    // Assignment
    assignedTechnicianId: int("assignedTechnicianId"),
    assignedAt: timestamp("assignedAt"),

    // Payment (hors garantie)
    shippingCost: decimal("shippingCost", { precision: 10, scale: 2 }),
    totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }),
    stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
    paidAt: timestamp("paidAt"),

    // Shipping / tracking
    trackingNumber: varchar("trackingNumber", { length: 255 }),
    trackingCarrier: savTrackingCarrierEnum,
    trackingUrl: varchar("trackingUrl", { length: 512 }),
    shippedAt: timestamp("shippedAt"),

    // Resolution
    resolutionNotes: text("resolutionNotes"),
    resolvedAt: timestamp("resolvedAt"),
    closedAt: timestamp("closedAt"),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    partnerIdIdx: index("partnerId_idx").on(table.partnerId),
    statusIdx: index("status_idx").on(table.status),
    urgencyIdx: index("urgency_idx").on(table.urgency),
    ticketNumberIdx: index("ticketNumber_idx").on(table.ticketNumber),
    brandIdx: index("brand_idx").on(table.brand),
    warrantyStatusIdx: index("warrantyStatus_idx").on(table.warrantyStatus),
  })
);

// After-sales media table (photos and videos)
export const afterSalesMedia = mysqlTable(
  "after_sales_media",
  {
    id: int("id").autoincrement().primaryKey(),
    serviceId: int("serviceId").notNull(),
    mediaUrl: varchar("mediaUrl", { length: 512 }).notNull(),
    mediaKey: varchar("mediaKey", { length: 512 }).notNull(),
    mediaType: mysqlEnum("mediaType", ["IMAGE", "VIDEO"]).notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    serviceIdIdx: index("serviceId_idx").on(table.serviceId),
  })
);

// After-sales notes table
export const afterSalesNotes = mysqlTable(
  "after_sales_notes",
  {
    id: int("id").autoincrement().primaryKey(),
    serviceId: int("serviceId").notNull(),
    userId: int("userId").notNull(),
    note: text("note").notNull(),
    isInternal: boolean("isInternal").notNull().default(false), // Internal notes only visible to admins
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    serviceIdIdx: index("serviceId_idx").on(table.serviceId),
  })
);

export type AfterSalesService = typeof afterSalesServices.$inferSelect;
export type InsertAfterSalesService = typeof afterSalesServices.$inferInsert;

export type AfterSalesMedia = typeof afterSalesMedia.$inferSelect;
export type InsertAfterSalesMedia = typeof afterSalesMedia.$inferInsert;

export type AfterSalesNote = typeof afterSalesNotes.$inferSelect;
export type InsertAfterSalesNote = typeof afterSalesNotes.$inferInsert;


// Separate enums for status history columns (must use correct column names)
const savPreviousStatusEnum = mysqlEnum("previousStatus", [
  "NEW",
  "ANALYZING",
  "INFO_REQUIRED",
  "QUOTE_PENDING",
  "PAYMENT_CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "RESOLVED",
  "CLOSED",
  "IN_PROGRESS",
  "WAITING_PARTS",
]);

const savNewStatusEnum = mysqlEnum("newStatus", [
  "NEW",
  "ANALYZING",
  "INFO_REQUIRED",
  "QUOTE_PENDING",
  "PAYMENT_CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "RESOLVED",
  "CLOSED",
  "IN_PROGRESS",
  "WAITING_PARTS",
]);

// After-sales status history (track all status changes)
export const afterSalesStatusHistory = mysqlTable(
  "after_sales_status_history",
  {
    id: int("id").autoincrement().primaryKey(),
    serviceId: int("serviceId").notNull(),
    previousStatus: savPreviousStatusEnum,
    newStatus: savNewStatusEnum.notNull(),
    changedBy: int("changedBy").notNull(),
    reason: text("reason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    serviceIdIdx: index("serviceId_history_idx").on(table.serviceId),
  })
);

// After-sales assignment history (track technician assignments)
export const afterSalesAssignmentHistory = mysqlTable(
  "after_sales_assignment_history",
  {
    id: int("id").autoincrement().primaryKey(),
    serviceId: int("serviceId").notNull(),
    previousTechnicianId: int("previousTechnicianId"),
    newTechnicianId: int("newTechnicianId"),
    assignedBy: int("assignedBy").notNull(),
    reason: text("reason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    serviceIdIdx: index("serviceId_assignment_idx").on(table.serviceId),
  })
);

// Response templates for quick replies
export const responseTemplates = mysqlTable(
  "response_templates",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    content: text("content").notNull(),
    createdBy: int("createdBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  }
);

export type AfterSalesStatusHistory = typeof afterSalesStatusHistory.$inferSelect;
export type InsertAfterSalesStatusHistory = typeof afterSalesStatusHistory.$inferInsert;

export type AfterSalesAssignmentHistory = typeof afterSalesAssignmentHistory.$inferSelect;
export type InsertAfterSalesAssignmentHistory = typeof afterSalesAssignmentHistory.$inferInsert;

export type ResponseTemplate = typeof responseTemplates.$inferSelect;
export type InsertResponseTemplate = typeof responseTemplates.$inferInsert;

// ============================================
// WARRANTY RULES (Matrice de garantie)
// ============================================

export const warrantyRules = mysqlTable(
  "warranty_rules",
  {
    id: int("id").autoincrement().primaryKey(),
    brand: savBrandEnum.notNull(),
    productLine: varchar("productLine", { length: 100 }),
    component: varchar("component", { length: 255 }).notNull(),
    warrantyMonths: int("warrantyMonths").notNull(), // 999 = à vie
    coveragePercentage: int("coveragePercentage").notNull().default(100),
    coverageRules: text("coverageRules"), // JSON: {"12": 100, "24": 80, "36": 60}
    exclusions: text("exclusions"),
    warrantyStartType: warrantyStartTypeEnum.notNull().default("PURCHASE_DATE"),
    notes: text("notes"),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    brandIdx: index("wr_brand_idx").on(table.brand),
    componentIdx: index("wr_component_idx").on(table.component),
    brandComponentIdx: index("wr_brand_component_idx").on(table.brand, table.component),
  })
);

export type WarrantyRule = typeof warrantyRules.$inferSelect;
export type InsertWarrantyRule = typeof warrantyRules.$inferInsert;

// ============================================
// SPARE PARTS (Pièces détachées)
// ============================================

export const spareParts = mysqlTable(
  "spare_parts",
  {
    id: int("id").autoincrement().primaryKey(),
    reference: varchar("reference", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: sparePartCategoryEnum.notNull(),
    priceHT: decimal("priceHT", { precision: 10, scale: 2 }).notNull(),
    vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("21"),
    stockQuantity: int("stockQuantity").default(0),
    lowStockThreshold: int("lowStockThreshold").default(3),
    imageUrl: varchar("imageUrl", { length: 512 }),
    weight: decimal("weight", { precision: 10, scale: 3 }),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    referenceIdx: index("sp_reference_idx").on(table.reference),
    categoryIdx: index("sp_category_idx").on(table.category),
  })
);

export type SparePart = typeof spareParts.$inferSelect;
export type InsertSparePart = typeof spareParts.$inferInsert;

// Spare parts compatibility (which parts fit which models)
export const sparePartsCompatibility = mysqlTable(
  "spare_parts_compatibility",
  {
    id: int("id").autoincrement().primaryKey(),
    sparePartId: int("sparePartId").notNull(),
    brand: savBrandEnum.notNull(),
    productLine: varchar("productLine", { length: 100 }),
    modelName: varchar("modelName", { length: 255 }),
    component: varchar("component", { length: 255 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    sparePartIdIdx: index("spc_sparePartId_idx").on(table.sparePartId),
    brandIdx: index("spc_brand_idx").on(table.brand),
    componentIdx: index("spc_component_idx").on(table.component),
  })
);

export type SparePartCompatibility = typeof sparePartsCompatibility.$inferSelect;
export type InsertSparePartCompatibility = typeof sparePartsCompatibility.$inferInsert;

// SAV spare parts (pièces liées à un ticket SAV)
export const savSpareParts = mysqlTable(
  "sav_spare_parts",
  {
    id: int("id").autoincrement().primaryKey(),
    serviceId: int("serviceId").notNull(),
    sparePartId: int("sparePartId").notNull(),
    quantity: int("quantity").notNull().default(1),
    unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
    isCoveredByWarranty: boolean("isCoveredByWarranty").default(false),
    coveragePercentage: int("coveragePercentage").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    serviceIdIdx: index("ssp_serviceId_idx").on(table.serviceId),
    sparePartIdIdx: index("ssp_sparePartId_idx").on(table.sparePartId),
  })
);

export type SavSparePart = typeof savSpareParts.$inferSelect;
export type InsertSavSparePart = typeof savSpareParts.$inferInsert;

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export const notificationPreferences = mysqlTable(
  "notification_preferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),

    // Order notifications
    orderStatusChangedToast: boolean("orderStatusChangedToast").default(true),
    orderStatusChangedEmail: boolean("orderStatusChangedEmail").default(true),
    orderNewToast: boolean("orderNewToast").default(true),
    orderNewEmail: boolean("orderNewEmail").default(true),

    // After-sales notifications
    savStatusChangedToast: boolean("savStatusChangedToast").default(true),
    savStatusChangedEmail: boolean("savStatusChangedEmail").default(true),
    savNewToast: boolean("savNewToast").default(true),
    savNewEmail: boolean("savNewEmail").default(true),

    // Lead notifications
    leadNewToast: boolean("leadNewToast").default(true),
    leadNewEmail: boolean("leadNewEmail").default(true),

    // System notifications
    systemAlertToast: boolean("systemAlertToast").default(true),
    systemAlertEmail: boolean("systemAlertEmail").default(true),

    // Stock notifications (admin only)
    stockLowToast: boolean("stockLowToast").default(true),
    stockLowEmail: boolean("stockLowEmail").default(true),

    // Partner notifications (admin only)
    partnerNewToast: boolean("partnerNewToast").default(true),
    partnerNewEmail: boolean("partnerNewEmail").default(true),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_pref_idx").on(table.userId),
  })
);

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;

// ============================================
// PARTNER CANDIDATES (Prospection commerciale)
// ============================================

export const candidateStatusEnum = mysqlEnum("candidate_status", [
  "non_contacte",
  "en_cours",
  "valide",
  "archive",
]);

export const partnerCandidates = mysqlTable(
  "partner_candidates",
  {
    id: int("id").autoincrement().primaryKey(),

    // Company info
    companyName: varchar("companyName", { length: 255 }).notNull(),
    fullName: varchar("fullName", { length: 255 }).notNull(),
    city: varchar("city", { length: 255 }).notNull(),
    phoneNumber: varchar("phoneNumber", { length: 50 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),

    // Priority scoring (1-8)
    priorityScore: int("priorityScore").notNull().default(0),
    showroom: varchar("showroom", { length: 100 }).notNull().default("non"),
    vendSpa: varchar("vendSpa", { length: 100 }).notNull().default("non"),
    autreMarque: varchar("autreMarque", { length: 100 }).notNull().default("non"),
    domaineSimilaire: varchar("domaineSimilaire", { length: 100 }).notNull().default("non"),

    // Notes
    notes: text("notes"),

    // Source tracking (Meta Lead Ads integration)
    metaLeadId: int("metaLeadId"), // Reference to leads table if created from a Meta lead
    source: varchar("source", { length: 50 }).default("manual"), // 'manual', 'meta_lead', 'csv_import'

    // Status
    status: candidateStatusEnum.default("non_contacte").notNull(),

    // Geolocation
    latitude: varchar("latitude", { length: 50 }),
    longitude: varchar("longitude", { length: 50 }),

    // Contact tracking
    phoneCallsCount: int("phoneCallsCount").default(0).notNull(),
    emailsSentCount: int("emailsSentCount").default(0).notNull(),
    lastContactDate: timestamp("lastContactDate"),

    // Visit tracking
    visited: int("visited").default(0).notNull(),
    visitDate: timestamp("visitDate"),

    // Timestamps
    dateAdded: timestamp("dateAdded").defaultNow().notNull(),
    lastContact: timestamp("lastContact"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    statusIdx: index("candidate_status_idx").on(table.status),
    priorityIdx: index("candidate_priority_idx").on(table.priorityScore),
    cityIdx: index("candidate_city_idx").on(table.city),
  })
);

export type PartnerCandidate = typeof partnerCandidates.$inferSelect;
export type InsertPartnerCandidate = typeof partnerCandidates.$inferInsert;

// Contact history for partner candidates
export const candidateContactHistory = mysqlTable(
  "candidate_contact_history",
  {
    id: int("id").autoincrement().primaryKey(),
    candidateId: int("candidateId").notNull(),
    date: timestamp("date").defaultNow().notNull(),
    type: mysqlEnum("contact_type", ["appel", "email", "visite", "note"]).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    candidateIdIdx: index("candidateId_idx").on(table.candidateId),
  })
);

export type CandidateContactHistory = typeof candidateContactHistory.$inferSelect;
export type InsertCandidateContactHistory = typeof candidateContactHistory.$inferInsert;

