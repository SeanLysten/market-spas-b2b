CREATE TABLE `order_status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`oldStatus` varchar(50),
	`newStatus` varchar(50) NOT NULL,
	`note` text,
	`changedByUserId` int,
	`trackingNumber` varchar(255),
	`trackingCarrier` varchar(100),
	`trackingUrl` varchar(500),
	`estimatedDeliveryDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `osh_orderId_idx` ON `order_status_history` (`orderId`);--> statement-breakpoint
CREATE INDEX `osh_createdAt_idx` ON `order_status_history` (`createdAt`);