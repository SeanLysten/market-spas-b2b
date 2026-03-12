CREATE TABLE `resource_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resourceId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resource_favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `rf_user_resource_unique` UNIQUE(`userId`,`resourceId`)
);
--> statement-breakpoint
CREATE INDEX `rf_user_id_idx` ON `resource_favorites` (`userId`);--> statement-breakpoint
CREATE INDEX `rf_resource_id_idx` ON `resource_favorites` (`resourceId`);