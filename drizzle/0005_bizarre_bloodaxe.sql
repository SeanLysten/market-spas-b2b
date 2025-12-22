CREATE TABLE `cart_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`variantId` int,
	`quantity` int NOT NULL DEFAULT 1,
	`isPreorder` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_product_variant_uniq` UNIQUE(`userId`,`productId`,`variantId`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_product_uniq` UNIQUE(`userId`,`productId`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `cart_items` (`userId`);--> statement-breakpoint
CREATE INDEX `productId_idx` ON `cart_items` (`productId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `favorites` (`userId`);