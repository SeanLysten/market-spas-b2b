CREATE TABLE `media_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(50) DEFAULT 'folder',
	`color` varchar(20) DEFAULT '#6b7280',
	`parentId` int,
	`sortOrder` int DEFAULT 0,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `resources` ADD `folderId` int;--> statement-breakpoint
CREATE INDEX `mf_parentId_idx` ON `media_folders` (`parentId`);--> statement-breakpoint
CREATE INDEX `mf_slug_idx` ON `media_folders` (`slug`);