ALTER TABLE `products` MODIFY COLUMN `vatRate` decimal(5,2) DEFAULT '20';--> statement-breakpoint
ALTER TABLE `spare_parts` MODIFY COLUMN `vatRate` decimal(5,2) DEFAULT '20';