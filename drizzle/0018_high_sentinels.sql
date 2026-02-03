ALTER TABLE `orders` ADD `depositReminderSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `depositReminderCount` int DEFAULT 0;