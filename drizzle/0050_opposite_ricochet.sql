CREATE TABLE `mollie_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int,
	`savTicketId` int,
	`molliePaymentId` varchar(100) NOT NULL,
	`mollieStatus` varchar(50) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'EUR',
	`method` varchar(50),
	`description` varchar(500),
	`redirectUrl` varchar(500),
	`webhookUrl` varchar(500),
	`metadata` text,
	`transferReference` varchar(255),
	`bankName` varchar(255),
	`bankAccount` varchar(100),
	`bankBic` varchar(20),
	`expiresAt` timestamp,
	`paidAt` timestamp,
	`failedAt` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mollie_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipping_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`country` varchar(2) NOT NULL,
	`postalCodeFrom` varchar(10),
	`postalCodeTo` varchar(10),
	`postalCodePrefix` varchar(10),
	`shippingCostHT` decimal(10,2) NOT NULL,
	`isActive` boolean DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipping_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `mp_orderId_idx` ON `mollie_payments` (`orderId`);--> statement-breakpoint
CREATE INDEX `mp_molliePaymentId_idx` ON `mollie_payments` (`molliePaymentId`);--> statement-breakpoint
CREATE INDEX `mp_status_idx` ON `mollie_payments` (`mollieStatus`);--> statement-breakpoint
CREATE INDEX `sz_country_idx` ON `shipping_zones` (`country`);--> statement-breakpoint
CREATE INDEX `sz_postalPrefix_idx` ON `shipping_zones` (`postalCodePrefix`);