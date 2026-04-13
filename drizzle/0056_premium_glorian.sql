CREATE TABLE `spa_model_hotspots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`sparePartId` int NOT NULL,
	`label` varchar(150),
	`posX` decimal(5,2) NOT NULL,
	`posY` decimal(5,2) NOT NULL,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spa_model_hotspots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spa_model_layers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spaModelId` int NOT NULL,
	`layerType` enum('SHELL','TECHNICAL','EXTERIOR') NOT NULL,
	`label` varchar(100) NOT NULL,
	`description` varchar(500),
	`imageUrl` varchar(512),
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spa_model_layers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spa_model_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`layerId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`label` varchar(150) NOT NULL,
	`description` varchar(500),
	`imageUrl` varchar(512),
	`posX` decimal(5,2),
	`posY` decimal(5,2),
	`width` decimal(5,2),
	`height` decimal(5,2),
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spa_model_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `smh_zoneId_idx` ON `spa_model_hotspots` (`zoneId`);--> statement-breakpoint
CREATE INDEX `smh_sparePartId_idx` ON `spa_model_hotspots` (`sparePartId`);--> statement-breakpoint
CREATE INDEX `sml_spaModelId_idx` ON `spa_model_layers` (`spaModelId`);--> statement-breakpoint
CREATE INDEX `sml_unique_model_layer_idx` ON `spa_model_layers` (`spaModelId`,`layerType`);--> statement-breakpoint
CREATE INDEX `smz_layerId_idx` ON `spa_model_zones` (`layerId`);