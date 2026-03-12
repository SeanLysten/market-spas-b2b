CREATE TABLE `technical_resource_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(50) DEFAULT 'folder',
	`sortOrder` int NOT NULL DEFAULT 0,
	`parentId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `technical_resource_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `technical_resources` ADD `fileName` varchar(500);--> statement-breakpoint
ALTER TABLE `technical_resources` ADD `fileSize` int;--> statement-breakpoint
ALTER TABLE `technical_resources` ADD `fileType` varchar(100);--> statement-breakpoint
ALTER TABLE `technical_resources` ADD `folderId` int;--> statement-breakpoint
ALTER TABLE `technical_resources` ADD `downloadCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `tr_folder_slug_idx` ON `technical_resource_folders` (`slug`);--> statement-breakpoint
CREATE INDEX `tr_folder_parent_idx` ON `technical_resource_folders` (`parentId`);--> statement-breakpoint
CREATE INDEX `tr_folder_id_idx` ON `technical_resources` (`folderId`);