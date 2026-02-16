CREATE TABLE `sav_spare_parts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`sparePartId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(10,2) NOT NULL,
	`isCoveredByWarranty` boolean DEFAULT false,
	`coveragePercentage` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sav_spare_parts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spare_parts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`sparePartCategory` enum('PUMPS','ELECTRONICS','JETS','SCREENS','HEATING','PLUMBING','COVERS','CABINETS','LIGHTING','AUDIO','OZONE_UVC','OTHER') NOT NULL,
	`priceHT` decimal(10,2) NOT NULL,
	`vatRate` decimal(5,2) DEFAULT '21',
	`stockQuantity` int DEFAULT 0,
	`lowStockThreshold` int DEFAULT 3,
	`imageUrl` varchar(512),
	`weight` decimal(10,3),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spare_parts_id` PRIMARY KEY(`id`),
	CONSTRAINT `spare_parts_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `spare_parts_compatibility` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sparePartId` int NOT NULL,
	`brand` enum('MARKET_SPAS','WELLIS_CLASSIC','WELLIS_LIFE','WELLIS_WIBES','PASSION_SPAS','PLATINUM_SPAS') NOT NULL,
	`productLine` varchar(100),
	`modelName` varchar(255),
	`component` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spare_parts_compatibility_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warranty_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brand` enum('MARKET_SPAS','WELLIS_CLASSIC','WELLIS_LIFE','WELLIS_WIBES','PASSION_SPAS','PLATINUM_SPAS') NOT NULL,
	`productLine` varchar(100),
	`component` varchar(255) NOT NULL,
	`warrantyMonths` int NOT NULL,
	`coveragePercentage` int NOT NULL DEFAULT 100,
	`coverageRules` text,
	`exclusions` text,
	`warrantyStartType` enum('PURCHASE_DATE','DELIVERY_DATE') NOT NULL DEFAULT 'PURCHASE_DATE',
	`notes` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warranty_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `after_sales_services` MODIFY COLUMN `issueType` enum('LEAK','CRACK_BLISTER_DELAMINATION','ELECTRICAL_FAILURE','MALFUNCTION','ABNORMAL_NOISE','BREAKAGE','DISCOLORATION_WEAR','HEATING_ISSUE','PEELING_SHRINKAGE','OTHER') NOT NULL;--> statement-breakpoint
ALTER TABLE `after_sales_services` MODIFY COLUMN `status` enum('NEW','ANALYZING','INFO_REQUIRED','QUOTE_PENDING','PAYMENT_CONFIRMED','PREPARING','SHIPPED','RESOLVED','CLOSED') NOT NULL DEFAULT 'NEW';--> statement-breakpoint
ALTER TABLE `after_sales_status_history` MODIFY COLUMN `status` enum('NEW','ANALYZING','INFO_REQUIRED','QUOTE_PENDING','PAYMENT_CONFIRMED','PREPARING','SHIPPED','RESOLVED','CLOSED') NOT NULL DEFAULT 'NEW';--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `brand` enum('MARKET_SPAS','WELLIS_CLASSIC','WELLIS_LIFE','WELLIS_WIBES','PASSION_SPAS','PLATINUM_SPAS');--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `productLine` varchar(100);--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `modelName` varchar(255);--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `component` varchar(255);--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `defectType` varchar(255);--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `purchaseDate` date;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `deliveryDate` date;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `usageType` enum('PRIVATE','COMMERCIAL','HOLIDAY_LET') DEFAULT 'PRIVATE';--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `isOriginalBuyer` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `isModified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `isMaintenanceConform` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `isChemistryConform` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `usesHydrogenPeroxide` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `warrantyStatus` enum('COVERED','PARTIAL','EXPIRED','EXCLUDED','REVIEW_NEEDED') DEFAULT 'REVIEW_NEEDED';--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `warrantyPercentage` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `warrantyExpiryDate` date;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `warrantyAnalysisDetails` text;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `adminWarrantyOverride` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `adminWarrantyNotes` text;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `shippingCost` decimal(10,2);--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `totalAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `stripePaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `paidAt` timestamp;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `trackingNumber` varchar(255);--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `trackingCarrier` enum('BPOST','DHL','UPS','GLS','MONDIAL_RELAY','OTHER');--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `trackingUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `shippedAt` timestamp;--> statement-breakpoint
CREATE INDEX `ssp_serviceId_idx` ON `sav_spare_parts` (`serviceId`);--> statement-breakpoint
CREATE INDEX `ssp_sparePartId_idx` ON `sav_spare_parts` (`sparePartId`);--> statement-breakpoint
CREATE INDEX `sp_reference_idx` ON `spare_parts` (`reference`);--> statement-breakpoint
CREATE INDEX `sp_category_idx` ON `spare_parts` (`sparePartCategory`);--> statement-breakpoint
CREATE INDEX `spc_sparePartId_idx` ON `spare_parts_compatibility` (`sparePartId`);--> statement-breakpoint
CREATE INDEX `spc_brand_idx` ON `spare_parts_compatibility` (`brand`);--> statement-breakpoint
CREATE INDEX `spc_component_idx` ON `spare_parts_compatibility` (`component`);--> statement-breakpoint
CREATE INDEX `wr_brand_idx` ON `warranty_rules` (`brand`);--> statement-breakpoint
CREATE INDEX `wr_component_idx` ON `warranty_rules` (`component`);--> statement-breakpoint
CREATE INDEX `wr_brand_component_idx` ON `warranty_rules` (`brand`,`component`);--> statement-breakpoint
CREATE INDEX `brand_idx` ON `after_sales_services` (`brand`);--> statement-breakpoint
CREATE INDEX `warrantyStatus_idx` ON `after_sales_services` (`warrantyStatus`);