ALTER TABLE `order_items` ADD `stockSource` varchar(20);--> statement-breakpoint
ALTER TABLE `order_items` ADD `stockSourceArrivalWeek` varchar(20);--> statement-breakpoint
ALTER TABLE `order_items` ADD `snapshotEnStock` int;--> statement-breakpoint
ALTER TABLE `order_items` ADD `snapshotEnTransit` int;--> statement-breakpoint
ALTER TABLE `order_items` ADD `color` varchar(100);