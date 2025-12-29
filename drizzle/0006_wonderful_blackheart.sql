CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`event_type` enum('PROMOTION','EVENT','ANNOUNCEMENT','TRAINING','WEBINAR') NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`allDay` boolean DEFAULT false,
	`discountPercent` decimal(5,2),
	`promoCode` varchar(50),
	`imageUrl` varchar(500),
	`attachmentUrl` varchar(500),
	`isPublished` boolean DEFAULT false,
	`targetPartnerLevels` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`lead_status` enum('NEW','ASSIGNED','CONTACTED','NO_RESPONSE','QUALIFIED','NOT_QUALIFIED','MEETING_SCHEDULED','QUOTE_SENT','NEGOTIATION','CONVERTED','LOST') NOT NULL DEFAULT 'NEW',
	`changedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`email` varchar(255),
	`phone` varchar(50),
	`address` varchar(255),
	`city` varchar(100),
	`postalCode` varchar(20),
	`country` varchar(100) DEFAULT 'Belgium',
	`lead_status` enum('NEW','ASSIGNED','CONTACTED','NO_RESPONSE','QUALIFIED','NOT_QUALIFIED','MEETING_SCHEDULED','QUOTE_SENT','NEGOTIATION','CONVERTED','LOST') NOT NULL DEFAULT 'NEW',
	`lead_source` enum('META_ADS','GOOGLE_ADS','WEBSITE','REFERRAL','PHONE','EMAIL','TRADE_SHOW','OTHER') NOT NULL DEFAULT 'META_ADS',
	`metaLeadgenId` varchar(100),
	`metaFormId` varchar(100),
	`metaAdId` varchar(100),
	`metaAdsetId` varchar(100),
	`metaCampaignId` varchar(100),
	`metaPageId` varchar(100),
	`productInterest` varchar(255),
	`budget` varchar(100),
	`timeline` varchar(100),
	`message` text,
	`customFields` text,
	`assignedPartnerId` int,
	`assignedAt` timestamp,
	`assignmentReason` varchar(255),
	`firstContactAt` timestamp,
	`lastContactAt` timestamp,
	`contactAttempts` int DEFAULT 0,
	`convertedAt` timestamp,
	`convertedOrderId` int,
	`estimatedValue` decimal(12,2),
	`actualValue` decimal(12,2),
	`notes` text,
	`lostReason` varchar(255),
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meta_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metaCampaignId` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`dailyBudget` decimal(12,2),
	`lifetimeBudget` decimal(12,2),
	`totalSpend` decimal(12,2) DEFAULT '0',
	`totalImpressions` int DEFAULT 0,
	`totalClicks` int DEFAULT 0,
	`totalLeads` int DEFAULT 0,
	`costPerLead` decimal(10,2),
	`status` varchar(50) DEFAULT 'ACTIVE',
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meta_campaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `meta_campaigns_metaCampaignId_unique` UNIQUE(`metaCampaignId`)
);
--> statement-breakpoint
CREATE TABLE `partner_postal_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`postalCode` varchar(20) NOT NULL,
	`priority` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_postal_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_partner_postal` UNIQUE(`partnerId`,`postalCode`)
);
--> statement-breakpoint
CREATE INDEX `startDate_idx` ON `events` (`startDate`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `events` (`event_type`);--> statement-breakpoint
CREATE INDEX `isPublished_idx` ON `events` (`isPublished`);--> statement-breakpoint
CREATE INDEX `leadId_idx` ON `lead_status_history` (`leadId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `lead_status_history` (`createdAt`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `leads` (`lead_status`);--> statement-breakpoint
CREATE INDEX `source_idx` ON `leads` (`lead_source`);--> statement-breakpoint
CREATE INDEX `assignedPartnerId_idx` ON `leads` (`assignedPartnerId`);--> statement-breakpoint
CREATE INDEX `postalCode_idx` ON `leads` (`postalCode`);--> statement-breakpoint
CREATE INDEX `metaLeadgenId_idx` ON `leads` (`metaLeadgenId`);--> statement-breakpoint
CREATE INDEX `receivedAt_idx` ON `leads` (`receivedAt`);--> statement-breakpoint
CREATE INDEX `metaCampaignId_idx` ON `meta_campaigns` (`metaCampaignId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `meta_campaigns` (`status`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `partner_postal_codes` (`partnerId`);--> statement-breakpoint
CREATE INDEX `postalCode_idx` ON `partner_postal_codes` (`postalCode`);