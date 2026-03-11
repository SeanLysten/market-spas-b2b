CREATE TABLE `spa_model_spare_parts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spaModelId` int NOT NULL,
	`sparePartId` int NOT NULL,
	`notes` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spa_model_spare_parts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spa_models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`brand` enum('MARKET_SPAS','WELLIS_CLASSIC','WELLIS_LIFE','WELLIS_WIBES','PASSION_SPAS','PLATINUM_SPAS') NOT NULL,
	`series` varchar(100),
	`imageUrl` varchar(512),
	`description` text,
	`seats` int,
	`dimensions` varchar(100),
	`isActive` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spa_models_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `smsp_spaModelId_idx` ON `spa_model_spare_parts` (`spaModelId`);--> statement-breakpoint
CREATE INDEX `smsp_sparePartId_idx` ON `spa_model_spare_parts` (`sparePartId`);--> statement-breakpoint
CREATE INDEX `smsp_unique_pair_idx` ON `spa_model_spare_parts` (`spaModelId`,`sparePartId`);--> statement-breakpoint
CREATE INDEX `sm_brand_idx` ON `spa_models` (`brand`);--> statement-breakpoint
CREATE INDEX `sm_name_idx` ON `spa_models` (`name`);