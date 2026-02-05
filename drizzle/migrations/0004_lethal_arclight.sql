DROP INDEX `recipes_slug_unique`;--> statement-breakpoint
ALTER TABLE `recipes` DROP COLUMN `slug`;--> statement-breakpoint
ALTER TABLE `recipes` DROP COLUMN `last_ingredient_extraction`;