ALTER TABLE `partner_candidates` ADD `metaLeadId` int;--> statement-breakpoint
ALTER TABLE `partner_candidates` ADD `source` varchar(50) DEFAULT 'manual';