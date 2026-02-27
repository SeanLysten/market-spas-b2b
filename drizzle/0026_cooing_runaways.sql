CREATE TABLE `customer_sav_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketNumber` varchar(20) NOT NULL,
	`customerName` varchar(200),
	`customerEmail` varchar(255),
	`customerPhone` varchar(50),
	`subject` varchar(500) NOT NULL,
	`message` text,
	`source` enum('EMAIL','MANUAL') NOT NULL DEFAULT 'EMAIL',
	`category` enum('SAV','COMPLAINT','INFO','OTHER') NOT NULL DEFAULT 'SAV',
	`status` enum('NEW','IN_PROGRESS','WAITING_CUSTOMER','RESOLVED','CLOSED') NOT NULL DEFAULT 'NEW',
	`priority` enum('LOW','NORMAL','HIGH','URGENT') NOT NULL DEFAULT 'NORMAL',
	`assignedPartnerId` int,
	`assignedAdminId` int,
	`internalNotes` text,
	`rawEmailFrom` varchar(255),
	`rawEmailSubject` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `customer_sav_tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_sav_tickets_ticketNumber_unique` UNIQUE(`ticketNumber`)
);
--> statement-breakpoint
ALTER TABLE `after_sales_status_history` ADD `previousStatus` enum('NEW','ANALYZING','INFO_REQUIRED','QUOTE_PENDING','PAYMENT_CONFIRMED','PREPARING','SHIPPED','RESOLVED','CLOSED','IN_PROGRESS','WAITING_PARTS');--> statement-breakpoint
ALTER TABLE `after_sales_status_history` ADD `newStatus` enum('NEW','ANALYZING','INFO_REQUIRED','QUOTE_PENDING','PAYMENT_CONFIRMED','PREPARING','SHIPPED','RESOLVED','CLOSED','IN_PROGRESS','WAITING_PARTS') NOT NULL;--> statement-breakpoint
CREATE INDEX `cst_status_idx` ON `customer_sav_tickets` (`status`);--> statement-breakpoint
CREATE INDEX `cst_email_idx` ON `customer_sav_tickets` (`customerEmail`);--> statement-breakpoint
CREATE INDEX `cst_created_idx` ON `customer_sav_tickets` (`createdAt`);--> statement-breakpoint
ALTER TABLE `after_sales_status_history` DROP COLUMN `status`;