CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orderStatusChangedToast` boolean DEFAULT true,
	`orderStatusChangedEmail` boolean DEFAULT true,
	`orderNewToast` boolean DEFAULT true,
	`orderNewEmail` boolean DEFAULT true,
	`savStatusChangedToast` boolean DEFAULT true,
	`savStatusChangedEmail` boolean DEFAULT true,
	`savNewToast` boolean DEFAULT true,
	`savNewEmail` boolean DEFAULT true,
	`leadNewToast` boolean DEFAULT true,
	`leadNewEmail` boolean DEFAULT true,
	`systemAlertToast` boolean DEFAULT true,
	`systemAlertEmail` boolean DEFAULT true,
	`stockLowToast` boolean DEFAULT true,
	`stockLowEmail` boolean DEFAULT true,
	`partnerNewToast` boolean DEFAULT true,
	`partnerNewEmail` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `userId_pref_idx` ON `notification_preferences` (`userId`);