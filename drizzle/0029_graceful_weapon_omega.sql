CREATE TABLE `saved_routes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(20) NOT NULL DEFAULT 'tour',
	`points` text NOT NULL,
	`total_distance` decimal(10,2),
	`total_duration` decimal(10,2),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_routes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `sr_user_idx` ON `saved_routes` (`user_id`);