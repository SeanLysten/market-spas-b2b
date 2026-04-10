ALTER TABLE `after_sales_services` MODIFY COLUMN `brand` enum('MARKET_SPAS','WELLIS_CLASSIC','WELLIS_LIFE','WELLIS_WIBES','PASSION_SPAS','PLATINUM_SPAS','OTHER_BRAND');--> statement-breakpoint
ALTER TABLE `spa_models` MODIFY COLUMN `brand` enum('MARKET_SPAS','WELLIS_CLASSIC','WELLIS_LIFE','WELLIS_WIBES','PASSION_SPAS','PLATINUM_SPAS','OTHER_BRAND') NOT NULL;--> statement-breakpoint
ALTER TABLE `spare_parts_compatibility` MODIFY COLUMN `brand` enum('MARKET_SPAS','WELLIS_CLASSIC','WELLIS_LIFE','WELLIS_WIBES','PASSION_SPAS','PLATINUM_SPAS','OTHER_BRAND') NOT NULL;--> statement-breakpoint
ALTER TABLE `warranty_rules` MODIFY COLUMN `brand` enum('MARKET_SPAS','WELLIS_CLASSIC','WELLIS_LIFE','WELLIS_WIBES','PASSION_SPAS','PLATINUM_SPAS','OTHER_BRAND') NOT NULL;--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `otherBrandName` varchar(255);--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `purchaseYear` varchar(4);--> statement-breakpoint
ALTER TABLE `after_sales_services` ADD `spaIdentifier` varchar(255);