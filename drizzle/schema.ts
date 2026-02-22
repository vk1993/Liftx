import {
  bigint,
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatarUrl: text("avatarUrl"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["trial", "pro", "ultra_pro"])
    .default("trial")
    .notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  subscriptionStatus: varchar("subscriptionStatus", { length: 32 }).default("active"),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  proPostLimit: int("proPostLimit").default(50), // configurable for pro users
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Connected Social Accounts ────────────────────────────────────────────────
export const connectedAccounts = mysqlTable("connected_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["linkedin", "instagram", "x", "facebook", "tiktok"]).notNull(),
  platformUserId: varchar("platformUserId", { length: 128 }),
  platformUsername: varchar("platformUsername", { length: 128 }),
  platformDisplayName: text("platformDisplayName"),
  platformAvatarUrl: text("platformAvatarUrl"),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConnectedAccount = typeof connectedAccounts.$inferSelect;
export type InsertConnectedAccount = typeof connectedAccounts.$inferInsert;

// ─── Posts ────────────────────────────────────────────────────────────────────
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  caption: text("caption"),
  contentType: mysqlEnum("contentType", ["image", "video", "carousel", "text", "reel", "story"]).notNull(),
  mediaUrls: json("mediaUrls").$type<string[]>().default([]),
  mediaKeys: json("mediaKeys").$type<string[]>().default([]),
  status: mysqlEnum("status", ["draft", "scheduled", "publishing", "published", "failed", "cancelled"])
    .default("draft")
    .notNull(),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// ─── Post Platforms (which platforms a post targets) ──────────────────────────
export const postPlatforms = mysqlTable("post_platforms", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  platform: mysqlEnum("platform", ["linkedin", "instagram", "x", "facebook", "tiktok"]).notNull(),
  status: mysqlEnum("status", ["pending", "publishing", "published", "failed"]).default("pending").notNull(),
  platformPostId: varchar("platformPostId", { length: 256 }),
  publishedAt: timestamp("publishedAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostPlatform = typeof postPlatforms.$inferSelect;
export type InsertPostPlatform = typeof postPlatforms.$inferInsert;

// ─── Post Metrics (Ultra Pro) ─────────────────────────────────────────────────
export const postMetrics = mysqlTable("post_metrics", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  postPlatformId: int("postPlatformId").notNull(),
  platform: mysqlEnum("platform", ["linkedin", "instagram", "x", "facebook", "tiktok"]).notNull(),
  impressions: bigint("impressions", { mode: "number" }).default(0),
  reach: bigint("reach", { mode: "number" }).default(0),
  likes: bigint("likes", { mode: "number" }).default(0),
  comments: bigint("comments", { mode: "number" }).default(0),
  shares: bigint("shares", { mode: "number" }).default(0),
  clicks: bigint("clicks", { mode: "number" }).default(0),
  saves: bigint("saves", { mode: "number" }).default(0),
  estimatedRevenue: text("estimatedRevenue").default("0.00"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostMetric = typeof postMetrics.$inferSelect;

// ─── Subscription Plans (reference) ──────────────────────────────────────────
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  tier: mysqlEnum("tier", ["trial", "pro", "ultra_pro"]).notNull().unique(),
  stripePriceId: varchar("stripePriceId", { length: 128 }),
  monthlyPrice: text("monthlyPrice").notNull().default("0.00"),
  yearlyPrice: text("yearlyPrice").notNull().default("0.00"),
  dailyPostLimit: int("dailyPostLimit"), // null = unlimited
  platformLimit: int("platformLimit"), // null = unlimited
  features: json("features").$type<string[]>().default([]),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// ─── Notifications Log ────────────────────────────────────────────────────────
export const notificationLogs = mysqlTable("notification_logs", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 64 }).notNull(),
  payload: json("payload"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});
