ALTER TABLE `product_variants` ADD `estimatedArrival` varchar(10);--> statement-breakpoint
ALTER TABLE `product_variants` ADD `lowStockThreshold` int DEFAULT 5;