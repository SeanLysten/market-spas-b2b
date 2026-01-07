CREATE TABLE `invitation_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(255) NOT NULL,
	`invitedBy` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invitation_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `invitation_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE INDEX `token_idx` ON `invitation_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `invitation_tokens` (`email`);