CREATE TABLE `ga4_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`googleUserId` varchar(100) NOT NULL,
	`googleUserEmail` varchar(255),
	`propertyId` varchar(100) NOT NULL,
	`propertyName` varchar(255),
	`websiteUrl` varchar(500),
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`connectedBy` int NOT NULL,
	`isActive` boolean DEFAULT true,
	`lastSyncedAt` timestamp,
	`syncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ga4_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ga4_propertyId_idx` ON `ga4_accounts` (`propertyId`);--> statement-breakpoint
CREATE INDEX `ga4_connectedBy_idx` ON `ga4_accounts` (`connectedBy`);