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
    categoryId: int("categoryId"),

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
    categoryIdIdx: index("categoryId_idx").on(table.categoryId),
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
