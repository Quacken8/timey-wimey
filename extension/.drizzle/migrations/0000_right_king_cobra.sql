CREATE TABLE `entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`interval_minutes` real NOT NULL,
	`working` integer NOT NULL,
	`window_focused` integer NOT NULL,
	`workspace` text,
	`current_file` text,
	`last_commit_hash` text,
	`custom` text
);
