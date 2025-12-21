CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`partnerId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50),
	`entityId` int,
	`description` text,
	`metadata` text,
	`ipAddress` varchar(50),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_verification_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_verification_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_verification_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`invoice_type` enum('QUOTE','DEPOSIT','FINAL','CREDIT_NOTE') NOT NULL,
	`invoice_status` enum('DRAFT','SENT','PAID','PARTIALLY_PAID','OVERDUE','CANCELLED') NOT NULL DEFAULT 'DRAFT',
	`partnerId` int NOT NULL,
	`orderId` int,
	`subtotalHT` decimal(12,2) NOT NULL,
	`discountAmount` decimal(12,2) DEFAULT '0',
	`totalHT` decimal(12,2) NOT NULL,
	`totalVAT` decimal(12,2) NOT NULL,
	`totalTTC` decimal(12,2) NOT NULL,
	`amountPaid` decimal(12,2) DEFAULT '0',
	`amountDue` decimal(12,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'EUR',
	`issueDate` timestamp NOT NULL,
	`dueDate` timestamp,
	`paidAt` timestamp,
	`odooInvoiceId` int,
	`odooInvoiceNumber` varchar(100),
	`pdfUrl` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('ORDER_CREATED','ORDER_STATUS_CHANGED','PAYMENT_RECEIVED','PAYMENT_FAILED','INVOICE_READY','STOCK_LOW','NEW_PARTNER','PARTNER_APPROVED','NEW_RESOURCE','SYSTEM_ALERT') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`linkUrl` varchar(500),
	`linkText` varchar(100),
	`orderId` int,
	`partnerId` int,
	`invoiceId` int,
	`isRead` boolean DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int,
	`variantId` int,
	`sku` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`quantity` int NOT NULL,
	`unitPriceHT` decimal(10,2) NOT NULL,
	`discountPercent` decimal(5,2) DEFAULT '0',
	`discountAmount` decimal(10,2) DEFAULT '0',
	`totalHT` decimal(12,2) NOT NULL,
	`vatRate` decimal(5,2) NOT NULL,
	`totalVAT` decimal(12,2) NOT NULL,
	`totalTTC` decimal(12,2) NOT NULL,
	`quantityShipped` int DEFAULT 0,
	`quantityDelivered` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`partnerId` int NOT NULL,
	`createdById` int,
	`subtotalHT` decimal(12,2) NOT NULL,
	`discountAmount` decimal(12,2) DEFAULT '0',
	`discountPercent` decimal(5,2) DEFAULT '0',
	`shippingHT` decimal(12,2) DEFAULT '0',
	`totalHT` decimal(12,2) NOT NULL,
	`totalVAT` decimal(12,2) NOT NULL,
	`totalTTC` decimal(12,2) NOT NULL,
	`depositPercent` decimal(5,2) DEFAULT '30',
	`depositAmount` decimal(12,2) NOT NULL,
	`depositPaid` boolean DEFAULT false,
	`depositPaidAt` timestamp,
	`balanceAmount` decimal(12,2) NOT NULL,
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
	`stripePaymentStatus` enum('PENDING','PROCESSING','SUCCEEDED','FAILED','REFUNDED','PARTIALLY_REFUNDED'),
	`odooQuoteId` int,
	`odooQuoteNumber` varchar(100),
	`status` enum('DRAFT','PENDING_APPROVAL','PENDING_DEPOSIT','DEPOSIT_PAID','IN_PRODUCTION','READY_TO_SHIP','PARTIALLY_SHIPPED','SHIPPED','DELIVERED','COMPLETED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'DRAFT',
	`internalNotes` text,
	`customerNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `partner_addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`expiresAt` timestamp,
	`uploadedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`tradeName` varchar(255),
	`legalForm` varchar(50),
	`vatNumber` varchar(50) NOT NULL,
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
	`partner_level` enum('BRONZE','SILVER','GOLD','PLATINUM','VIP') NOT NULL DEFAULT 'BRONZE',
	`discountPercent` decimal(5,2) DEFAULT '0',
	`paymentTermsDays` int DEFAULT 30,
	`creditLimit` decimal(12,2) DEFAULT '0',
	`creditUsed` decimal(12,2) DEFAULT '0',
	`useCustomPricing` boolean DEFAULT false,
	`customPriceListId` int,
	`salesRepId` int,
	`territory` varchar(100),
	`odooPartnerId` int,
	`stripeCustomerId` varchar(255),
	`partner_status` enum('PENDING','APPROVED','SUSPENDED','TERMINATED') NOT NULL DEFAULT 'PENDING',
	`approvedAt` timestamp,
	`approvedById` int,
	`suspendedAt` timestamp,
	`suspendedReason` text,
	`preferredLanguage` varchar(10) DEFAULT 'fr',
	`preferredCurrency` varchar(3) DEFAULT 'EUR',
	`newsletterOptIn` boolean DEFAULT true,
	`totalOrders` int DEFAULT 0,
	`totalRevenue` decimal(12,2) DEFAULT '0',
	`lastOrderAt` timestamp,
	`internalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`),
	CONSTRAINT `partners_vatNumber_unique` UNIQUE(`vatNumber`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`orderId` int,
	`invoiceId` int,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'EUR',
	`method` varchar(50) NOT NULL,
	`payment_status` enum('PENDING','PROCESSING','SUCCEEDED','FAILED','REFUNDED','PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING',
	`stripePaymentIntentId` varchar(255),
	`stripeChargeId` varchar(255),
	`paidAt` timestamp,
	`failedAt` timestamp,
	`refundedAt` timestamp,
	`refundAmount` decimal(12,2) DEFAULT '0',
	`refundReason` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`discountPercent` decimal(5,2) DEFAULT '0',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `price_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_arrivals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int,
	`variantId` int,
	`arrivalWeek` varchar(20) NOT NULL,
	`expectedDate` timestamp,
	`quantity` int NOT NULL,
	`status` varchar(50) DEFAULT 'expected',
	`receivedDate` timestamp,
	`receivedQty` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_arrivals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` varchar(500),
	`parentId` int,
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int,
	`variantId` int,
	`url` varchar(500) NOT NULL,
	`altText` varchar(255),
	`sortOrder` int DEFAULT 0,
	`isPrimary` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_price_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`partnerId` int NOT NULL,
	`priceHT` decimal(10,2) NOT NULL,
	`validFrom` timestamp NOT NULL DEFAULT (now()),
	`validTo` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_price_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_partner_uniq` UNIQUE(`productId`,`partnerId`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`sku` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`color` varchar(50),
	`size` varchar(50),
	`voltage` varchar(50),
	`material` varchar(100),
	`pricePublicHT` decimal(10,2),
	`pricePartnerHT` decimal(10,2),
	`stockQuantity` int DEFAULT 0,
	`stockReserved` int DEFAULT 0,
	`sheetsRowId` int,
	`odooProductId` int,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_variants_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`shortDescription` text,
	`description` text,
	`categoryId` int,
	`type` varchar(50) DEFAULT 'physical',
	`pricePublicHT` decimal(10,2) NOT NULL,
	`pricePartnerHT` decimal(10,2) NOT NULL,
	`vatRate` decimal(5,2) DEFAULT '21',
	`costPrice` decimal(10,2),
	`trackStock` boolean DEFAULT true,
	`stockQuantity` int DEFAULT 0,
	`stockReserved` int DEFAULT 0,
	`lowStockThreshold` int DEFAULT 5,
	`weight` decimal(10,3),
	`length` decimal(10,2),
	`width` decimal(10,2),
	`height` decimal(10,2),
	`sheetsRowId` int,
	`odooProductId` int,
	`metaTitle` varchar(255),
	`metaDescription` text,
	`isActive` boolean DEFAULT true,
	`isVisible` boolean DEFAULT true,
	`isFeatured` boolean DEFAULT false,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('TECHNICAL_DOC','VIDEO_TUTORIAL','TROUBLESHOOTING','MARKETING_IMAGE','CATALOG','PLV','SALES_GUIDE','INSTALLATION','WARRANTY','CERTIFICATE') NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileSize` int NOT NULL,
	`thumbnailUrl` varchar(500),
	`isPublic` boolean DEFAULT false,
	`requiredPartnerLevel` enum('BRONZE','SILVER','GOLD','PLATINUM','VIP'),
	`tags` text,
	`language` varchar(10) DEFAULT 'fr',
	`downloadCount` int DEFAULT 0,
	`viewCount` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`uploadedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`userAgent` text,
	`ipAddress` varchar(50),
	`deviceType` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('SUPER_ADMIN','ADMIN','SALES_MANAGER','SALES_REP','PARTNER_ADMIN','PARTNER_USER') NOT NULL DEFAULT 'PARTNER_USER';--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `firstName` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `lastName` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `locale` varchar(10) DEFAULT 'fr';--> statement-breakpoint
ALTER TABLE `users` ADD `timezone` varchar(50) DEFAULT 'Europe/Brussels';--> statement-breakpoint
ALTER TABLE `users` ADD `partnerId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorSecret` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `lastLoginAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `lastLoginIp` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `failedLoginAttempts` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `lockedUntil` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `mustChangePassword` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `deletedAt` timestamp;--> statement-breakpoint
CREATE INDEX `userId_idx` ON `activity_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `activity_logs` (`partnerId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `activity_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `email_verification_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `invoiceNumber_idx` ON `invoices` (`invoiceNumber`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `invoices` (`partnerId`);--> statement-breakpoint
CREATE INDEX `orderId_idx` ON `invoices` (`orderId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `invoices` (`invoice_status`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `isRead_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `orderId_idx` ON `order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `productId_idx` ON `order_items` (`productId`);--> statement-breakpoint
CREATE INDEX `orderNumber_idx` ON `orders` (`orderNumber`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `orders` (`partnerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `orders` (`createdAt`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `partner_addresses` (`partnerId`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `partner_contacts` (`partnerId`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `partner_documents` (`partnerId`);--> statement-breakpoint
CREATE INDEX `vatNumber_idx` ON `partners` (`vatNumber`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `partners` (`partner_status`);--> statement-breakpoint
CREATE INDEX `level_idx` ON `partners` (`partner_level`);--> statement-breakpoint
CREATE INDEX `salesRepId_idx` ON `partners` (`salesRepId`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `payments` (`partnerId`);--> statement-breakpoint
CREATE INDEX `orderId_idx` ON `payments` (`orderId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `payments` (`payment_status`);--> statement-breakpoint
CREATE INDEX `productId_idx` ON `product_arrivals` (`productId`);--> statement-breakpoint
CREATE INDEX `variantId_idx` ON `product_arrivals` (`variantId`);--> statement-breakpoint
CREATE INDEX `arrivalWeek_idx` ON `product_arrivals` (`arrivalWeek`);--> statement-breakpoint
CREATE INDEX `parentId_idx` ON `product_categories` (`parentId`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `product_categories` (`slug`);--> statement-breakpoint
CREATE INDEX `productId_idx` ON `product_images` (`productId`);--> statement-breakpoint
CREATE INDEX `variantId_idx` ON `product_images` (`variantId`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `product_price_overrides` (`partnerId`);--> statement-breakpoint
CREATE INDEX `productId_idx` ON `product_variants` (`productId`);--> statement-breakpoint
CREATE INDEX `sku_idx` ON `product_variants` (`sku`);--> statement-breakpoint
CREATE INDEX `sku_idx` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `categoryId_idx` ON `products` (`categoryId`);--> statement-breakpoint
CREATE INDEX `active_visible_idx` ON `products` (`isActive`,`isVisible`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `resources` (`category`);--> statement-breakpoint
CREATE INDEX `isActive_idx` ON `resources` (`isActive`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `users` (`partnerId`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);