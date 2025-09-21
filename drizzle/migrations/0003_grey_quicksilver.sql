CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`notion_id` text,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`markdown` text NOT NULL,
	`extracted_ingredients` text,
	`is_active` integer DEFAULT 1,
	`tags` text,
	`servings` integer,
	`last_ingredient_extraction` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_notion_id_unique` ON `recipes` (`notion_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_slug_unique` ON `recipes` (`slug`);