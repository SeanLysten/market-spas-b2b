CREATE TABLE `meta_ad_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metaUserId` varchar(100) NOT NULL,
	`metaUserName` varchar(255),
	`adAccountId` varchar(100) NOT NULL,
	`adAccountName` varchar(255),
	`currency` varchar(10) DEFAULT 'EUR',
	`timezone` varchar(100),
	`accessToken` text NOT NULL,
	`tokenExpiresAt` timestamp,
	`connectedBy` int NOT NULL,
	`isActive` boolean DEFAULT true,
	`lastSyncedAt` timestamp,
	`syncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meta_ad_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `adAccountId_idx` ON `meta_ad_accounts` (`adAccountId`);--> statement-breakpoint
CREATE INDEX `connectedBy_idx` ON `meta_ad_accounts` (`connectedBy`);