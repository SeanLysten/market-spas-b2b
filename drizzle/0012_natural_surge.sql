CREATE TABLE `after_sales_assignment_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`previousTechnicianId` int,
	`newTechnicianId` int,
	`assignedBy` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `after_sales_assignment_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `after_sales_status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceId` int NOT NULL,
	`status` enum('NEW','IN_PROGRESS','WAITING_PARTS','RESOLVED','CLOSED') NOT NULL DEFAULT 'NEW',
	`changedBy` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `after_sales_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `response_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `response_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP INDEX `status_idx` ON `after_sales_services`;--> statement-breakpoint
DROP INDEX `urgency_idx` ON `after_sales_services`;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `issueType` enum('TECHNICAL','LEAK','ELECTRICAL','HEATING','JETS','CONTROL_PANEL','OTHER') NOT NULL;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `urgency` enum('NORMAL','URGENT','CRITICAL') DEFAULT 'NORMAL' NOT NULL;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `status` enum('NEW','IN_PROGRESS','WAITING_PARTS','RESOLVED','CLOSED') DEFAULT 'NEW' NOT NULL;--> statement-breakpoint
CREATE INDEX `serviceId_assignment_idx` ON `after_sales_assignment_history` (`serviceId`);--> statement-breakpoint
CREATE INDEX `serviceId_history_idx` ON `after_sales_status_history` (`serviceId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `after_sales_services` (`status`);--> statement-breakpoint
CREATE INDEX `urgency_idx` ON `after_sales_services` (`urgency`);--> statement-breakpoint
ALTER TABLE `after_sales_services` DROP COLUMN `sav_issue_type`;--> statement-breakpoint
ALTER TABLE `after_sales_services` DROP COLUMN `sav_urgency`;--> statement-breakpoint
ALTER TABLE `after_sales_services` DROP COLUMN `sav_status`;