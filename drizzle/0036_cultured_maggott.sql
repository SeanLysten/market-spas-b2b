ALTER TABLE `product_variants` ADD `supplierProductCode` varchar(50);--> statement-breakpoint
ALTER TABLE `product_variants` ADD `ean13` varchar(20);--> statement-breakpoint
ALTER TABLE `products` ADD `supplierProductCode` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `ean13` varchar(20);--> statement-breakpoint
CREATE INDEX `supplier_code_idx` ON `product_variants` (`supplierProductCode`);--> statement-breakpoint
CREATE INDEX `ean13_idx` ON `product_variants` (`ean13`);