CREATE TABLE `forum_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`isAdminReply` boolean NOT NULL DEFAULT false,
	`isHelpful` boolean NOT NULL DEFAULT false,
	`helpfulCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forum_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100),
	`productCategory` enum('SPAS','SWIM_SPAS','MAINTENANCE','COVERS','ACCESSORIES','OTHER'),
	`status` enum('OPEN','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
	`authorId` int NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`replyCount` int NOT NULL DEFAULT 0,
	`lastReplyAt` timestamp,
	`lastReplyBy` int,
	`isPinned` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forum_topics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technical_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('PDF','VIDEO','LINK') NOT NULL,
	`fileUrl` text,
	`category` varchar(100),
	`productCategory` enum('SPAS','SWIM_SPAS','MAINTENANCE','COVERS','ACCESSORIES','OTHER'),
	`tags` text,
	`viewCount` int NOT NULL DEFAULT 0,
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `technical_resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `partner_territories` DROP INDEX `unique_partner_region`;--> statement-breakpoint
DROP INDEX `categoryId_idx` ON `products`;--> statement-breakpoint
ALTER TABLE `products` ADD `category` enum('SPAS','SWIM_SPAS','MAINTENANCE','COVERS','ACCESSORIES','OTHER') DEFAULT 'OTHER';--> statement-breakpoint
ALTER TABLE `partner_territories` ADD CONSTRAINT `unique_region` UNIQUE(`regionId`);--> statement-breakpoint
CREATE INDEX `topicId_idx` ON `forum_replies` (`topicId`);--> statement-breakpoint
CREATE INDEX `authorId_idx` ON `forum_replies` (`authorId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `forum_replies` (`createdAt`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `forum_topics` (`category`);--> statement-breakpoint
CREATE INDEX `productCategory_idx` ON `forum_topics` (`productCategory`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `forum_topics` (`status`);--> statement-breakpoint
CREATE INDEX `authorId_idx` ON `forum_topics` (`authorId`);--> statement-breakpoint
CREATE INDEX `lastReplyAt_idx` ON `forum_topics` (`lastReplyAt`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `technical_resources` (`type`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `technical_resources` (`category`);--> statement-breakpoint
CREATE INDEX `productCategory_idx` ON `technical_resources` (`productCategory`);--> statement-breakpoint
CREATE INDEX `createdBy_idx` ON `technical_resources` (`createdBy`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `products` (`category`);--> statement-breakpoint
ALTER TABLE `partner_territories` DROP COLUMN `priority`;--> statement-breakpoint
ALTER TABLE `partner_territories` DROP COLUMN `isExclusive`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `categoryId`;