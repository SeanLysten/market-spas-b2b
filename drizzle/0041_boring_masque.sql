CREATE TABLE `supplier_api_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importKey` varchar(255),
	`rawPayload` text NOT NULL,
	`totalItems` int NOT NULL DEFAULT 0,
	`matchedItems` int NOT NULL DEFAULT 0,
	`unmatchedItems` int NOT NULL DEFAULT 0,
	`errorItems` int NOT NULL DEFAULT 0,
	`resultsJson` text,
	`ipAddress` varchar(100),
	`userAgent` varchar(500),
	`success` boolean NOT NULL DEFAULT true,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplier_api_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `sal_created_at_idx` ON `supplier_api_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `sal_import_key_idx` ON `supplier_api_logs` (`importKey`);