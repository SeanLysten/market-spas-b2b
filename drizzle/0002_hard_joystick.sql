CREATE TABLE `variant_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`variantId` int NOT NULL,
	`optionName` varchar(100) NOT NULL,
	`optionValue` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `variant_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `variantId_idx` ON `variant_options` (`variantId`);--> statement-breakpoint
CREATE INDEX `optionName_idx` ON `variant_options` (`optionName`);