CREATE TABLE `partner_product_discounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`productId` int NOT NULL,
	`discountPercent` decimal(5,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_product_discounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ppd_partner_product_idx` ON `partner_product_discounts` (`partnerId`,`productId`);--> statement-breakpoint
CREATE INDEX `ppd_partner_idx` ON `partner_product_discounts` (`partnerId`);--> statement-breakpoint
CREATE INDEX `ppd_product_idx` ON `partner_product_discounts` (`productId`);