CREATE TABLE `scheduled_newsletters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject` varchar(500) NOT NULL,
	`title` varchar(500) NOT NULL,
	`htmlContent` text NOT NULL,
	`recipients` enum('ALL','PARTNERS_ONLY','ADMINS_ONLY') NOT NULL DEFAULT 'ALL',
	`nl_status` enum('PENDING','SENT','CANCELLED','FAILED') NOT NULL DEFAULT 'PENDING',
	`scheduledAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`cancelledAt` timestamp,
	`createdById` int NOT NULL,
	`totalRecipients` int,
	`successCount` int,
	`failureCount` int,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_newsletters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `nl_status_idx` ON `scheduled_newsletters` (`nl_status`);--> statement-breakpoint
CREATE INDEX `nl_scheduled_idx` ON `scheduled_newsletters` (`scheduledAt`);