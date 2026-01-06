CREATE TABLE `team_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`partnerId` int NOT NULL,
	`team_role` enum('OWNER','SALES_REP','ORDER_MANAGER','ACCOUNTANT','FULL_MANAGER') NOT NULL,
	`permissions` text,
	`invitedBy` int NOT NULL,
	`invitation_status` enum('PENDING','ACCEPTED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `team_invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`partnerId` int NOT NULL,
	`team_role` enum('OWNER','SALES_REP','ORDER_MANAGER','ACCOUNTANT','FULL_MANAGER') NOT NULL,
	`permissions` text,
	`addedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_user_partner` UNIQUE(`userId`,`partnerId`)
);
--> statement-breakpoint
CREATE INDEX `email_idx` ON `team_invitations` (`email`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `team_invitations` (`partnerId`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `team_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `team_invitations` (`invitation_status`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `team_members` (`userId`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `team_members` (`partnerId`);