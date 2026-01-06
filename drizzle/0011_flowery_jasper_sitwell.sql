CREATE TABLE `after_sales_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`mediaUrl` varchar(512) NOT NULL,
	`mediaKey` varchar(512) NOT NULL,
	`mediaType` enum('IMAGE','VIDEO') NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `after_sales_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `after_sales_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`userId` int NOT NULL,
	`note` text NOT NULL,
	`isInternal` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `after_sales_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `after_sales_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketNumber` varchar(50) NOT NULL,
	`partnerId` int NOT NULL,
	`productId` int,
	`serialNumber` varchar(100) NOT NULL,
	`sav_issue_type` enum('TECHNICAL','LEAK','ELECTRICAL','HEATING','JETS','CONTROL_PANEL','OTHER') NOT NULL,
	`description` text NOT NULL,
	`sav_urgency` enum('NORMAL','URGENT','CRITICAL') NOT NULL DEFAULT 'NORMAL',
	`sav_status` enum('NEW','IN_PROGRESS','WAITING_PARTS','RESOLVED','CLOSED') NOT NULL DEFAULT 'NEW',
	`customerName` varchar(255),
	`customerPhone` varchar(50),
	`customerEmail` varchar(255),
	`customerAddress` text,
	`installationDate` date,
	`assignedTechnicianId` int,
	`assignedAt` timestamp,
	`resolutionNotes` text,
	`resolvedAt` timestamp,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `after_sales_services_id` PRIMARY KEY(`id`),
	CONSTRAINT `after_sales_services_ticketNumber_unique` UNIQUE(`ticketNumber`)
);
--> statement-breakpoint
CREATE INDEX `serviceId_idx` ON `after_sales_media` (`serviceId`);--> statement-breakpoint
CREATE INDEX `serviceId_idx` ON `after_sales_notes` (`serviceId`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `after_sales_services` (`partnerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `after_sales_services` (`sav_status`);--> statement-breakpoint
CREATE INDEX `urgency_idx` ON `after_sales_services` (`sav_urgency`);--> statement-breakpoint
CREATE INDEX `ticketNumber_idx` ON `after_sales_services` (`ticketNumber`);