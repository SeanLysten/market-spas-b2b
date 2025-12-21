CREATE TABLE `incoming_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int,
	`variantId` int,
	`quantity` int NOT NULL,
	`expectedWeek` int NOT NULL,
	`expectedYear` int NOT NULL,
	`status` enum('PENDING','ARRIVED','CANCELLED') DEFAULT 'PENDING',
	`notes` text,
	`arrivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incoming_stock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `productId_idx` ON `incoming_stock` (`productId`);--> statement-breakpoint
CREATE INDEX `variantId_idx` ON `incoming_stock` (`variantId`);--> statement-breakpoint
CREATE INDEX `expectedWeek_idx` ON `incoming_stock` (`expectedWeek`,`expectedYear`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `incoming_stock` (`status`);