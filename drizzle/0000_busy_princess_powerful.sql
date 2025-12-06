CREATE TABLE `pending_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_no` text NOT NULL,
	`order_type` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_address` text,
	`customer_note` text,
	`customer_latitude` real,
	`customer_longitude` real,
	`items` text NOT NULL,
	`subtotal` real NOT NULL,
	`delivery_fee` real NOT NULL,
	`total` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`retry_count` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`synced_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pending_orders_order_no_unique` ON `pending_orders` (`order_no`);