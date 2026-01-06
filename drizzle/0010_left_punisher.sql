CREATE TABLE `return_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`returnId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`return_reason` enum('DEFECTIVE','WRONG_ITEM','NOT_AS_DESCRIBED','CHANGED_MIND','OTHER') NOT NULL,
	`reasonDetails` text,
	`unitPrice` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `return_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `return_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`returnId` int NOT NULL,
	`photoUrl` varchar(512) NOT NULL,
	`photoKey` varchar(512) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `return_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `returns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`partnerId` int NOT NULL,
	`return_status` enum('REQUESTED','APPROVED','REJECTED','IN_TRANSIT','RECEIVED','REFUNDED') NOT NULL DEFAULT 'REQUESTED',
	`totalAmount` decimal(10,2),
	`notes` text,
	`adminNotes` text,
	`trackingNumber` varchar(255),
	`refundAmount` decimal(10,2),
	`refundedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`approvedAt` timestamp,
	`rejectedAt` timestamp,
	`receivedAt` timestamp,
	CONSTRAINT `returns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `returnId_idx` ON `return_items` (`returnId`);--> statement-breakpoint
CREATE INDEX `productId_idx` ON `return_items` (`productId`);--> statement-breakpoint
CREATE INDEX `returnId_idx` ON `return_photos` (`returnId`);--> statement-breakpoint
CREATE INDEX `orderId_idx` ON `returns` (`orderId`);--> statement-breakpoint
CREATE INDEX `partnerId_idx` ON `returns` (`partnerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `returns` (`return_status`);