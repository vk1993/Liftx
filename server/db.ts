import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  connectedAccounts,
  postMetrics,
  postPlatforms,
  posts,
  subscriptionPlans,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "avatarUrl"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized as any;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserSubscription(
  userId: number,
  tier: "trial" | "pro" | "ultra_pro",
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({
      subscriptionTier: tier,
      stripeCustomerId: stripeCustomerId ?? undefined,
      stripeSubscriptionId: stripeSubscriptionId ?? undefined,
      subscriptionStatus: "active",
    })
    .where(eq(users.id, userId));
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function getPostsByUser(
  userId: number,
  opts: { status?: string; limit: number; offset: number }
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(posts.userId, userId)];
  if (opts.status) {
    conditions.push(eq(posts.status, opts.status as any));
  }

  const result = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);

  // Fetch platforms for each post
  const postIds = result.map((p) => p.id);
  if (postIds.length === 0) return [];

  const platforms = await db
    .select()
    .from(postPlatforms)
    .where(sql`${postPlatforms.postId} IN (${sql.join(postIds.map((id) => sql`${id}`), sql`, `)})`);

  return result.map((post) => ({
    ...post,
    platforms: platforms.filter((pp) => pp.postId === post.id),
  }));
}

export async function getDailyPostCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(posts)
    .where(
      and(
        eq(posts.userId, userId),
        gte(posts.createdAt, startOfDay),
        sql`${posts.status} != 'cancelled'`
      )
    );

  return Number(result[0]?.count ?? 0);
}

export async function createPost(data: {
  userId: number;
  caption: string;
  contentType: string;
  mediaUrls: string[];
  mediaKeys: string[];
  platforms: string[];
  scheduledAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const status = data.scheduledAt ? "scheduled" : "published";

  const [result] = await db.insert(posts).values({
    userId: data.userId,
    caption: data.caption,
    contentType: data.contentType as any,
    mediaUrls: data.mediaUrls,
    mediaKeys: data.mediaKeys,
    status: status as any,
    scheduledAt: data.scheduledAt ?? null,
    publishedAt: data.scheduledAt ? null : new Date(),
  });

  const postId = (result as any).insertId as number;

  // Create post platform entries
  if (data.platforms.length > 0) {
    await db.insert(postPlatforms).values(
      data.platforms.map((platform) => ({
        postId,
        platform: platform as any,
        status: (status === "published" ? "published" : "pending") as any,
        publishedAt: status === "published" ? new Date() : null,
      }))
    );
  }

  return postId;
}

export async function cancelPost(postId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .limit(1);

  if (!post) throw new Error("Post not found");
  if (post.status !== "scheduled") throw new Error("Only scheduled posts can be cancelled");

  await db
    .update(posts)
    .set({ status: "cancelled" })
    .where(eq(posts.id, postId));

  return true;
}

// ─── Connected Accounts ───────────────────────────────────────────────────────

export async function getConnectedAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(connectedAccounts)
    .where(and(eq(connectedAccounts.userId, userId), eq(connectedAccounts.isActive, true)));
}

export async function connectAccount(data: {
  userId: number;
  platform: string;
  platformUsername?: string;
  platformDisplayName?: string;
  platformAvatarUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already connected
  const existing = await db
    .select()
    .from(connectedAccounts)
    .where(
      and(
        eq(connectedAccounts.userId, data.userId),
        eq(connectedAccounts.platform, data.platform as any)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(connectedAccounts)
      .set({
        isActive: true,
        platformUsername: data.platformUsername ?? null,
        platformDisplayName: data.platformDisplayName ?? null,
        platformAvatarUrl: data.platformAvatarUrl ?? null,
      })
      .where(eq(connectedAccounts.id, existing[0].id));
  } else {
    await db.insert(connectedAccounts).values({
      userId: data.userId,
      platform: data.platform as any,
      platformUsername: data.platformUsername ?? null,
      platformDisplayName: data.platformDisplayName ?? null,
      platformAvatarUrl: data.platformAvatarUrl ?? null,
      isActive: true,
    });
  }
}

export async function disconnectAccount(userId: number, platform: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(connectedAccounts)
    .set({ isActive: false })
    .where(
      and(
        eq(connectedAccounts.userId, userId),
        eq(connectedAccounts.platform, platform as any)
      )
    );
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export async function getMetricsOverview(userId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get all post IDs for this user
  const userPosts = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.userId, userId));

  if (userPosts.length === 0) return null;

  const postIds = userPosts.map((p) => p.id);

  const metrics = await db
    .select()
    .from(postMetrics)
    .where(
      sql`${postMetrics.postId} IN (${sql.join(postIds.map((id) => sql`${id}`), sql`, `)})`
    );

  if (metrics.length === 0) return null;

  const totals = metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + (m.impressions ?? 0),
      reach: acc.reach + (m.reach ?? 0),
      likes: acc.likes + (m.likes ?? 0),
      comments: acc.comments + (m.comments ?? 0),
      shares: acc.shares + (m.shares ?? 0),
      clicks: acc.clicks + (m.clicks ?? 0),
      saves: acc.saves + (m.saves ?? 0),
      estimatedRevenue: (parseFloat(acc.estimatedRevenue) + parseFloat(m.estimatedRevenue ?? "0")).toFixed(2),
    }),
    { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, clicks: 0, saves: 0, estimatedRevenue: "0.00" }
  );

  return { totals, byPlatform: metrics };
}

// ─── Subscription Plans ───────────────────────────────────────────────────────

export async function getSubscriptionPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
}
