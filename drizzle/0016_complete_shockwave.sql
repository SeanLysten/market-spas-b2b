DROP INDEX `status_idx` ON `leads`;--> statement-breakpoint
DROP INDEX `source_idx` ON `leads`;--> statement-breakpoint
ALTER TABLE `lead_status_history` ADD `status` enum('NEW','ASSIGNED','CONTACTED','NO_RESPONSE','QUALIFIED','NOT_QUALIFIED','MEETING_SCHEDULED','QUOTE_SENT','NEGOTIATION','CONVERTED','LOST') DEFAULT 'NEW' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `status` enum('NEW','ASSIGNED','CONTACTED','NO_RESPONSE','QUALIFIED','NOT_QUALIFIED','MEETING_SCHEDULED','QUOTE_SENT','NEGOTIATION','CONVERTED','LOST') DEFAULT 'NEW' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `source` enum('META_ADS','GOOGLE_ADS','WEBSITE','REFERRAL','PHONE','EMAIL','TRADE_SHOW','OTHER') DEFAULT 'META_ADS' NOT NULL;--> statement-breakpoint
CREATE INDEX `status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `source_idx` ON `leads` (`source`);--> statement-breakpoint
ALTER TABLE `lead_status_history` DROP COLUMN `lead_status`;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `lead_status`;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `lead_source`;