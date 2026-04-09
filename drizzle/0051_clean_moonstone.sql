CREATE TABLE IF NOT EXISTS `mailing_list_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listId` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255),
	`company` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mailing_list_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `mailing_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(1000),
	`color` varchar(7) DEFAULT '#3d9b85',
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mailing_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `mlc_listId_idx` ON `mailing_list_contacts` (`listId`);--> statement-breakpoint
CREATE INDEX `mlc_email_idx` ON `mailing_list_contacts` (`email`);--> statement-breakpoint
CREATE INDEX `mlc_unique_list_email` ON `mailing_list_contacts` (`listId`,`email`);--> statement-breakpoint
CREATE INDEX `ml_name_idx` ON `mailing_lists` (`name`);
