ALTER TABLE `product_variants` ADD `inTransitQuantity` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `products` ADD `inTransitQuantity` int DEFAULT 0;