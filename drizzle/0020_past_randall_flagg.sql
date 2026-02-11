CREATE TABLE `candidate_contact_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`contact_type` enum('appel','email','visite','note') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `candidate_contact_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`city` varchar(255) NOT NULL,
	`phoneNumber` varchar(50) NOT NULL,
	`email` varchar(320) NOT NULL,
	`priorityScore` int NOT NULL DEFAULT 0,
	`showroom` varchar(100) NOT NULL DEFAULT 'non',
	`vendSpa` varchar(100) NOT NULL DEFAULT 'non',
	`autreMarque` varchar(100) NOT NULL DEFAULT 'non',
	`domaineSimilaire` varchar(100) NOT NULL DEFAULT 'non',
	`notes` text,
	`candidate_status` enum('non_contacte','en_cours','valide','archive') NOT NULL DEFAULT 'non_contacte',
	`latitude` varchar(50),
	`longitude` varchar(50),
	`phoneCallsCount` int NOT NULL DEFAULT 0,
	`emailsSentCount` int NOT NULL DEFAULT 0,
	`lastContactDate` timestamp,
	`visited` int NOT NULL DEFAULT 0,
	`visitDate` timestamp,
	`dateAdded` timestamp NOT NULL DEFAULT (now()),
	`lastContact` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `candidateId_idx` ON `candidate_contact_history` (`candidateId`);--> statement-breakpoint
CREATE INDEX `candidate_status_idx` ON `partner_candidates` (`candidate_status`);--> statement-breakpoint
CREATE INDEX `candidate_priority_idx` ON `partner_candidates` (`priorityScore`);--> statement-breakpoint
CREATE INDEX `candidate_city_idx` ON `partner_candidates` (`city`);