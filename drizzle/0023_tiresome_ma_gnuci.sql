CREATE TABLE `google_ad_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`googleUserId` varchar(100) NOT NULL,
	`googleUserEmail` varchar(255),
	`customerId` varchar(100) NOT NULL,
	`customerName` varchar(255),
	`currency` varchar(10) DEFAULT 'EUR',
	`timezone` varchar(100),
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`connectedBy` int NOT NULL,
	`isActive` boolean DEFAULT true,
	`lastSyncedAt` timestamp,
	`syncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_ad_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `customerId_idx` ON `google_ad_accounts` (`customerId`);--> statement-breakpoint
CREATE INDEX `connectedBy_idx` ON `google_ad_accounts` (`connectedBy`);