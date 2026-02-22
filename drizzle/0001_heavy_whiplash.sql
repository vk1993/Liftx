CREATE TABLE `connected_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('linkedin','instagram','x','facebook','tiktok') NOT NULL,
	`platformUserId` varchar(128),
	`platformUsername` varchar(128),
	`platformDisplayName` text,
	`platformAvatarUrl` text,
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connected_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(64) NOT NULL,
	`payload` json,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`postPlatformId` int NOT NULL,
	`platform` enum('linkedin','instagram','x','facebook','tiktok') NOT NULL,
	`impressions` bigint DEFAULT 0,
	`reach` bigint DEFAULT 0,
	`likes` bigint DEFAULT 0,
	`comments` bigint DEFAULT 0,
	`shares` bigint DEFAULT 0,
	`clicks` bigint DEFAULT 0,
	`saves` bigint DEFAULT 0,
	`estimatedRevenue` text DEFAULT ('0.00'),
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_platforms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`platform` enum('linkedin','instagram','x','facebook','tiktok') NOT NULL,
	`status` enum('pending','publishing','published','failed') NOT NULL DEFAULT 'pending',
	`platformPostId` varchar(256),
	`publishedAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_platforms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caption` text,
	`contentType` enum('image','video','carousel','text','reel','story') NOT NULL,
	`mediaUrls` json DEFAULT ('[]'),
	`mediaKeys` json DEFAULT ('[]'),
	`status` enum('draft','scheduled','publishing','published','failed','cancelled') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`publishedAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`tier` enum('trial','pro','ultra_pro') NOT NULL,
	`stripePriceId` varchar(128),
	`monthlyPrice` text NOT NULL DEFAULT ('0.00'),
	`yearlyPrice` text NOT NULL DEFAULT ('0.00'),
	`dailyPostLimit` int,
	`platformLimit` int,
	`features` json DEFAULT ('[]'),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plans_tier_unique` UNIQUE(`tier`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('trial','pro','ultra_pro') DEFAULT 'trial' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` varchar(32) DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `proPostLimit` int DEFAULT 50;