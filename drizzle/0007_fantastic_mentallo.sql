CREATE TABLE `countries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(2) NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameEn` varchar(100) NOT NULL,
	`nameFr` varchar(100) NOT NULL,
	`nameNl` varchar(100) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `countries_id` PRIMARY KEY(`id`),
	CONSTRAINT `countries_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `partner_territories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`regionId` int NOT NULL,
	`priority` int NOT NULL DEFAULT 1,
	`isExclusive` boolean NOT NULL DEFAULT false,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`assignedBy` int,
	`notes` text,
	CONSTRAINT `partner_territories_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_partner_region` UNIQUE(`partnerId`,`regionId`)
);
--> statement-breakpoint
CREATE TABLE `postal_code_ranges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`regionId` int NOT NULL,
	`startCode` varchar(20) NOT NULL,
	`endCode` varchar(20) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `postal_code_ranges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countryId` int NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameEn` varchar(100),
	`nameFr` varchar(100),
	`nameNl` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regions_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_country_code` UNIQUE(`countryId`,`code`)
);
--> statement-breakpoint
DROP INDEX `type_idx` ON `events`;--> statement-breakpoint
ALTER TABLE `events` ADD `type` enum('PROMOTION','EVENT','ANNOUNCEMENT','TRAINING','WEBINAR') NOT NULL;--> statement-breakpoint
CREATE INDEX `code_idx` ON `countries` (`code`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `partner_territories` (`partnerId`);--> statement-breakpoint
CREATE INDEX `regionId_idx` ON `partner_territories` (`regionId`);--> statement-breakpoint
CREATE INDEX `regionId_idx` ON `postal_code_ranges` (`regionId`);--> statement-breakpoint
CREATE INDEX `startCode_idx` ON `postal_code_ranges` (`startCode`);--> statement-breakpoint
CREATE INDEX `countryId_idx` ON `regions` (`countryId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `events` (`type`);--> statement-breakpoint
ALTER TABLE `events` DROP COLUMN `event_type`;