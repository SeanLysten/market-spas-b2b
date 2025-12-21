-- Drop existing tables
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS email_verification_tokens;
DROP TABLE IF EXISTS partners;
DROP TABLE IF EXISTS partner_addresses;
DROP TABLE IF EXISTS partner_contacts;
DROP TABLE IF EXISTS partner_documents;
DROP TABLE IF EXISTS product_categories;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS product_arrivals;
DROP TABLE IF EXISTS price_lists;
DROP TABLE IF EXISTS product_price_overrides;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS activity_logs;
SET FOREIGN_KEY_CHECKS = 1;

-- Users table
CREATE TABLE `users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `openId` varchar(64) NOT NULL UNIQUE,
  `email` varchar(320),
  `emailVerified` timestamp,
  `passwordHash` varchar(255),
  `firstName` varchar(100),
  `lastName` varchar(100),
  `name` text,
  `phone` varchar(50),
  `avatar` varchar(500),
  `locale` varchar(10) DEFAULT 'fr',
  `timezone` varchar(50) DEFAULT 'Europe/Brussels',
  `role` enum('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'SALES_REP', 'PARTNER_ADMIN', 'PARTNER_USER') DEFAULT 'PARTNER_USER' NOT NULL,
  `partnerId` int,
  `loginMethod` varchar(64),
  `twoFactorEnabled` boolean DEFAULT false,
  `twoFactorSecret` varchar(255),
  `lastLoginAt` timestamp,
  `lastLoginIp` varchar(50),
  `failedLoginAttempts` int DEFAULT 0,
  `lockedUntil` timestamp,
  `isActive` boolean DEFAULT true,
  `mustChangePassword` boolean DEFAULT false,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `lastSignedIn` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `deletedAt` timestamp,
  INDEX `email_idx` (`email`),
  INDEX `partnerId_idx` (`partnerId`),
  INDEX `role_idx` (`role`)
);

-- Sessions table
CREATE TABLE `sessions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `token` varchar(255) NOT NULL UNIQUE,
  `expiresAt` timestamp NOT NULL,
  `userAgent` text,
  `ipAddress` varchar(50),
  `deviceType` varchar(20),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `lastActiveAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `userId_idx` (`userId`),
  INDEX `token_idx` (`token`)
);

-- Password reset tokens
CREATE TABLE `password_reset_tokens` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `token` varchar(255) NOT NULL UNIQUE,
  `expiresAt` timestamp NOT NULL,
  `usedAt` timestamp,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `token_idx` (`token`)
);

-- Email verification tokens
CREATE TABLE `email_verification_tokens` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `email` varchar(320) NOT NULL,
  `token` varchar(255) NOT NULL UNIQUE,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `token_idx` (`token`)
);

-- Partners table
CREATE TABLE `partners` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `companyName` varchar(255) NOT NULL,
  `tradeName` varchar(255),
  `legalForm` varchar(50),
  `vatNumber` varchar(50) NOT NULL UNIQUE,
  `registrationNumber` varchar(100),
  `addressStreet` varchar(255) NOT NULL,
  `addressStreet2` varchar(255),
  `addressCity` varchar(100) NOT NULL,
  `addressPostalCode` varchar(20) NOT NULL,
  `addressCountry` varchar(2) DEFAULT 'BE',
  `addressRegion` varchar(100),
  `billingAddressSame` boolean DEFAULT true,
  `billingStreet` varchar(255),
  `billingStreet2` varchar(255),
  `billingCity` varchar(100),
  `billingPostalCode` varchar(20),
  `billingCountry` varchar(2),
  `deliveryStreet` varchar(255),
  `deliveryStreet2` varchar(255),
  `deliveryCity` varchar(100),
  `deliveryPostalCode` varchar(20),
  `deliveryCountry` varchar(2),
  `deliveryInstructions` text,
  `primaryContactName` varchar(255) NOT NULL,
  `primaryContactEmail` varchar(320) NOT NULL,
  `primaryContactPhone` varchar(50) NOT NULL,
  `accountingEmail` varchar(320),
  `orderEmail` varchar(320),
  `website` varchar(500),
  `level` enum('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'VIP') DEFAULT 'BRONZE' NOT NULL,
  `discountPercent` decimal(5, 2) DEFAULT 0,
  `paymentTermsDays` int DEFAULT 30,
  `creditLimit` decimal(12, 2) DEFAULT 0,
  `creditUsed` decimal(12, 2) DEFAULT 0,
  `useCustomPricing` boolean DEFAULT false,
  `customPriceListId` int,
  `salesRepId` int,
  `territory` varchar(100),
  `odooPartnerId` int,
  `stripeCustomerId` varchar(255),
  `status` enum('PENDING', 'APPROVED', 'SUSPENDED', 'TERMINATED') DEFAULT 'PENDING' NOT NULL,
  `approvedAt` timestamp,
  `approvedById` int,
  `suspendedAt` timestamp,
  `suspendedReason` text,
  `preferredLanguage` varchar(10) DEFAULT 'fr',
  `preferredCurrency` varchar(3) DEFAULT 'EUR',
  `newsletterOptIn` boolean DEFAULT true,
  `totalOrders` int DEFAULT 0,
  `totalRevenue` decimal(12, 2) DEFAULT 0,
  `lastOrderAt` timestamp,
  `internalNotes` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `deletedAt` timestamp,
  INDEX `vatNumber_idx` (`vatNumber`),
  INDEX `status_idx` (`status`),
  INDEX `level_idx` (`level`),
  INDEX `salesRepId_idx` (`salesRepId`)
);

-- Partner addresses
CREATE TABLE `partner_addresses` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `partnerId` int NOT NULL,
  `label` varchar(255) NOT NULL,
  `isDefault` boolean DEFAULT false,
  `street` varchar(255) NOT NULL,
  `street2` varchar(255),
  `city` varchar(100) NOT NULL,
  `postalCode` varchar(20) NOT NULL,
  `country` varchar(2) NOT NULL,
  `region` varchar(100),
  `contactName` varchar(255),
  `contactPhone` varchar(50),
  `instructions` text,
  `deliveryHours` varchar(255),
  `closedDays` varchar(255),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `partnerId_idx` (`partnerId`)
);

-- Partner contacts
CREATE TABLE `partner_contacts` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `partnerId` int NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `role` varchar(100),
  `email` varchar(320) NOT NULL,
  `phone` varchar(50),
  `mobile` varchar(50),
  `isPrimary` boolean DEFAULT false,
  `receiveOrders` boolean DEFAULT true,
  `receiveInvoices` boolean DEFAULT true,
  `receiveMarketing` boolean DEFAULT true,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `partnerId_idx` (`partnerId`)
);

-- Partner documents
CREATE TABLE `partner_documents` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `partnerId` int NOT NULL,
  `type` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `fileUrl` varchar(500) NOT NULL,
  `fileSize` int NOT NULL,
  `mimeType` varchar(100) NOT NULL,
  `expiresAt` timestamp,
  `uploadedById` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `partnerId_idx` (`partnerId`)
);

-- Product categories
CREATE TABLE `product_categories` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL UNIQUE,
  `description` text,
  `imageUrl` varchar(500),
  `parentId` int,
  `sortOrder` int DEFAULT 0,
  `isActive` boolean DEFAULT true,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `parentId_idx` (`parentId`),
  INDEX `slug_idx` (`slug`)
);

-- Products
CREATE TABLE `products` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `sku` varchar(100) NOT NULL UNIQUE,
  `name` varchar(255) NOT NULL,
  `shortDescription` text,
  `description` text,
  `categoryId` int,
  `type` varchar(50) DEFAULT 'physical',
  `pricePublicHT` decimal(10, 2) NOT NULL,
  `pricePartnerHT` decimal(10, 2) NOT NULL,
  `vatRate` decimal(5, 2) DEFAULT 21,
  `costPrice` decimal(10, 2),
  `trackStock` boolean DEFAULT true,
  `stockQuantity` int DEFAULT 0,
  `stockReserved` int DEFAULT 0,
  `lowStockThreshold` int DEFAULT 5,
  `weight` decimal(10, 3),
  `length` decimal(10, 2),
  `width` decimal(10, 2),
  `height` decimal(10, 2),
  `sheetsRowId` int,
  `odooProductId` int,
  `metaTitle` varchar(255),
  `metaDescription` text,
  `isActive` boolean DEFAULT true,
  `isVisible` boolean DEFAULT true,
  `isFeatured` boolean DEFAULT false,
  `lastSyncedAt` timestamp,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `deletedAt` timestamp,
  INDEX `sku_idx` (`sku`),
  INDEX `categoryId_idx` (`categoryId`),
  INDEX `active_visible_idx` (`isActive`, `isVisible`)
);

-- Product variants
CREATE TABLE `product_variants` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `productId` int NOT NULL,
  `sku` varchar(100) NOT NULL UNIQUE,
  `name` varchar(255) NOT NULL,
  `color` varchar(50),
  `size` varchar(50),
  `voltage` varchar(50),
  `material` varchar(100),
  `pricePublicHT` decimal(10, 2),
  `pricePartnerHT` decimal(10, 2),
  `stockQuantity` int DEFAULT 0,
  `stockReserved` int DEFAULT 0,
  `sheetsRowId` int,
  `odooProductId` int,
  `isActive` boolean DEFAULT true,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `productId_idx` (`productId`),
  INDEX `sku_idx` (`sku`)
);

-- Product images
CREATE TABLE `product_images` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `productId` int,
  `variantId` int,
  `url` varchar(500) NOT NULL,
  `altText` varchar(255),
  `sortOrder` int DEFAULT 0,
  `isPrimary` boolean DEFAULT false,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `productId_idx` (`productId`),
  INDEX `variantId_idx` (`variantId`)
);

-- Product arrivals
CREATE TABLE `product_arrivals` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `productId` int,
  `variantId` int,
  `arrivalWeek` varchar(20) NOT NULL,
  `expectedDate` timestamp,
  `quantity` int NOT NULL,
  `status` varchar(50) DEFAULT 'expected',
  `receivedDate` timestamp,
  `receivedQty` int,
  `notes` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `productId_idx` (`productId`),
  INDEX `variantId_idx` (`variantId`),
  INDEX `arrivalWeek_idx` (`arrivalWeek`)
);

-- Price lists
CREATE TABLE `price_lists` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `description` text,
  `discountPercent` decimal(5, 2) DEFAULT 0,
  `isActive` boolean DEFAULT true,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Product price overrides
CREATE TABLE `product_price_overrides` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `productId` int NOT NULL,
  `partnerId` int NOT NULL,
  `priceHT` decimal(10, 2) NOT NULL,
  `validFrom` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `validTo` timestamp,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY `product_partner_uniq` (`productId`, `partnerId`),
  INDEX `partnerId_idx` (`partnerId`)
);

-- Orders
CREATE TABLE `orders` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `orderNumber` varchar(50) NOT NULL UNIQUE,
  `partnerId` int NOT NULL,
  `createdById` int,
  `subtotalHT` decimal(12, 2) NOT NULL,
  `discountAmount` decimal(12, 2) DEFAULT 0,
  `discountPercent` decimal(5, 2) DEFAULT 0,
  `shippingHT` decimal(12, 2) DEFAULT 0,
  `totalHT` decimal(12, 2) NOT NULL,
  `totalVAT` decimal(12, 2) NOT NULL,
  `totalTTC` decimal(12, 2) NOT NULL,
  `depositPercent` decimal(5, 2) DEFAULT 30,
  `depositAmount` decimal(12, 2) NOT NULL,
  `depositPaid` boolean DEFAULT false,
  `depositPaidAt` timestamp,
  `balanceAmount` decimal(12, 2) NOT NULL,
  `balancePaid` boolean DEFAULT false,
  `balancePaidAt` timestamp,
  `currency` varchar(3) DEFAULT 'EUR',
  `deliveryAddressId` int,
  `deliveryStreet` varchar(255),
  `deliveryStreet2` varchar(255),
  `deliveryCity` varchar(100),
  `deliveryPostalCode` varchar(20),
  `deliveryCountry` varchar(2),
  `deliveryContactName` varchar(255),
  `deliveryContactPhone` varchar(50),
  `deliveryInstructions` text,
  `deliveryRequestedWeek` varchar(20),
  `deliveryRequestedDate` timestamp,
  `deliveryConfirmedDate` timestamp,
  `shippingMethod` varchar(100),
  `shippingCarrier` varchar(100),
  `trackingNumber` varchar(255),
  `trackingUrl` varchar(500),
  `shippedAt` timestamp,
  `deliveredAt` timestamp,
  `paymentMethod` varchar(50),
  `stripePaymentIntentId` varchar(255),
  `stripePaymentStatus` enum('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'),
  `odooQuoteId` int,
  `odooQuoteNumber` varchar(100),
  `status` enum('DRAFT', 'PENDING_APPROVAL', 'PENDING_DEPOSIT', 'DEPOSIT_PAID', 'IN_PRODUCTION', 'READY_TO_SHIP', 'PARTIALLY_SHIPPED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED') DEFAULT 'DRAFT' NOT NULL,
  `internalNotes` text,
  `customerNotes` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  `deletedAt` timestamp,
  INDEX `orderNumber_idx` (`orderNumber`),
  INDEX `partnerId_idx` (`partnerId`),
  INDEX `status_idx` (`status`),
  INDEX `createdAt_idx` (`createdAt`)
);

-- Order items
CREATE TABLE `order_items` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `orderId` int NOT NULL,
  `productId` int,
  `variantId` int,
  `sku` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `quantity` int NOT NULL,
  `unitPriceHT` decimal(10, 2) NOT NULL,
  `discountPercent` decimal(5, 2) DEFAULT 0,
  `discountAmount` decimal(10, 2) DEFAULT 0,
  `totalHT` decimal(12, 2) NOT NULL,
  `vatRate` decimal(5, 2) NOT NULL,
  `totalVAT` decimal(12, 2) NOT NULL,
  `totalTTC` decimal(12, 2) NOT NULL,
  `quantityShipped` int DEFAULT 0,
  `quantityDelivered` int DEFAULT 0,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `orderId_idx` (`orderId`),
  INDEX `productId_idx` (`productId`)
);

-- Invoices
CREATE TABLE `invoices` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `invoiceNumber` varchar(50) NOT NULL UNIQUE,
  `type` enum('QUOTE', 'DEPOSIT', 'FINAL', 'CREDIT_NOTE') NOT NULL,
  `status` enum('DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED') DEFAULT 'DRAFT' NOT NULL,
  `partnerId` int NOT NULL,
  `orderId` int,
  `subtotalHT` decimal(12, 2) NOT NULL,
  `discountAmount` decimal(12, 2) DEFAULT 0,
  `totalHT` decimal(12, 2) NOT NULL,
  `totalVAT` decimal(12, 2) NOT NULL,
  `totalTTC` decimal(12, 2) NOT NULL,
  `amountPaid` decimal(12, 2) DEFAULT 0,
  `amountDue` decimal(12, 2) NOT NULL,
  `currency` varchar(3) DEFAULT 'EUR',
  `issueDate` timestamp NOT NULL,
  `dueDate` timestamp,
  `paidAt` timestamp,
  `odooInvoiceId` int,
  `odooInvoiceNumber` varchar(100),
  `pdfUrl` varchar(500),
  `notes` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `invoiceNumber_idx` (`invoiceNumber`),
  INDEX `partnerId_idx` (`partnerId`),
  INDEX `orderId_idx` (`orderId`),
  INDEX `status_idx` (`status`)
);

-- Payments
CREATE TABLE `payments` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `partnerId` int NOT NULL,
  `orderId` int,
  `invoiceId` int,
  `amount` decimal(12, 2) NOT NULL,
  `currency` varchar(3) DEFAULT 'EUR',
  `method` varchar(50) NOT NULL,
  `status` enum('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED') DEFAULT 'PENDING' NOT NULL,
  `stripePaymentIntentId` varchar(255),
  `stripeChargeId` varchar(255),
  `paidAt` timestamp,
  `failedAt` timestamp,
  `refundedAt` timestamp,
  `refundAmount` decimal(12, 2) DEFAULT 0,
  `refundReason` text,
  `notes` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `partnerId_idx` (`partnerId`),
  INDEX `orderId_idx` (`orderId`),
  INDEX `status_idx` (`status`)
);

-- Resources
CREATE TABLE `resources` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `title` varchar(255) NOT NULL,
  `description` text,
  `category` enum('TECHNICAL_DOC', 'VIDEO_TUTORIAL', 'TROUBLESHOOTING', 'MARKETING_IMAGE', 'CATALOG', 'PLV', 'SALES_GUIDE', 'INSTALLATION', 'WARRANTY', 'CERTIFICATE') NOT NULL,
  `fileUrl` varchar(500) NOT NULL,
  `fileType` varchar(50) NOT NULL,
  `fileSize` int NOT NULL,
  `thumbnailUrl` varchar(500),
  `isPublic` boolean DEFAULT false,
  `requiredPartnerLevel` enum('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'VIP'),
  `tags` text,
  `language` varchar(10) DEFAULT 'fr',
  `downloadCount` int DEFAULT 0,
  `viewCount` int DEFAULT 0,
  `isActive` boolean DEFAULT true,
  `uploadedById` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `category_idx` (`category`),
  INDEX `isActive_idx` (`isActive`)
);

-- Notifications
CREATE TABLE `notifications` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `type` enum('ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'INVOICE_READY', 'STOCK_LOW', 'NEW_PARTNER', 'PARTNER_APPROVED', 'NEW_RESOURCE', 'SYSTEM_ALERT') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `linkUrl` varchar(500),
  `linkText` varchar(100),
  `orderId` int,
  `partnerId` int,
  `invoiceId` int,
  `isRead` boolean DEFAULT false,
  `readAt` timestamp,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `userId_idx` (`userId`),
  INDEX `isRead_idx` (`isRead`),
  INDEX `createdAt_idx` (`createdAt`)
);

-- Activity logs
CREATE TABLE `activity_logs` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int,
  `partnerId` int,
  `action` varchar(100) NOT NULL,
  `entityType` varchar(50),
  `entityId` int,
  `description` text,
  `metadata` text,
  `ipAddress` varchar(50),
  `userAgent` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `userId_idx` (`userId`),
  INDEX `partnerId_idx` (`partnerId`),
  INDEX `createdAt_idx` (`createdAt`)
);
