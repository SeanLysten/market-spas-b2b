CREATE TABLE `device_push_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pushToken` varchar(512) NOT NULL,
	`platform` varchar(20) NOT NULL,
	`deviceId` varchar(255),
	`deviceName` varchar(255),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `device_push_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mobile_refresh_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(512) NOT NULL,
	`deviceId` varchar(255),
	`deviceName` varchar(255),
	`platform` varchar(20),
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mobile_refresh_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobile_refresh_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE INDEX `dpt_userId_idx` ON `device_push_tokens` (`userId`);--> statement-breakpoint
CREATE INDEX `dpt_pushToken_idx` ON `device_push_tokens` (`pushToken`);--> statement-breakpoint
CREATE INDEX `mobile_rt_token_idx` ON `mobile_refresh_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `mobile_rt_userId_idx` ON `mobile_refresh_tokens` (`userId`);