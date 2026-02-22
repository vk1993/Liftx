import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────

vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  updateUserSubscription: vi.fn(),
  getPostsByUser: vi.fn().mockResolvedValue([]),
  getDailyPostCount: vi.fn().mockResolvedValue(0),
  createPost: vi.fn().mockResolvedValue(1),
  cancelPost: vi.fn().mockResolvedValue(true),
  getConnectedAccounts: vi.fn().mockResolvedValue([]),
  connectAccount: vi.fn().mockResolvedValue(undefined),
  disconnectAccount: vi.fn().mockResolvedValue(undefined),
  getSubscriptionPlans: vi.fn().mockResolvedValue([]),
  getMetricsOverview: vi.fn().mockResolvedValue(null),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────

type AuthUser = NonNullable<TrpcContext["user"]>;

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function makeCtx(user: AuthUser | null = makeUser()): TrpcContext {
  const clearedCookies: any[] = [];
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: any) => clearedCookies.push({ name, options }),
    } as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null when not authenticated", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user when authenticated", async () => {
    const user = makeUser({ name: "Alice" });
    const caller = appRouter.createCaller(makeCtx(user));
    const result = await caller.auth.me();
    expect(result?.name).toBe("Alice");
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and returns success", async () => {
    const ctx = makeCtx();
    const clearedCookies: any[] = [];
    ctx.res.clearCookie = (name: string, options: any) => clearedCookies.push({ name, options });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

// ─── Posts Tests ──────────────────────────────────────────────────────────────

describe("posts.dailyUsage", () => {
  it("returns usage info for trial user", async () => {
    const user = makeUser({ subscriptionTier: "trial" } as any);
    const caller = appRouter.createCaller(makeCtx(user));
    const result = await caller.posts.dailyUsage();

    expect(result.tier).toBe("trial");
    expect(result.limit).toBe(2);
    expect(result.unlimited).toBe(false);
    expect(result.used).toBe(0);
    expect(result.remaining).toBe(2);
  });

  it("returns unlimited for ultra_pro user", async () => {
    const user = makeUser({ subscriptionTier: "ultra_pro" } as any);
    const caller = appRouter.createCaller(makeCtx(user));
    const result = await caller.posts.dailyUsage();

    expect(result.tier).toBe("ultra_pro");
    expect(result.unlimited).toBe(true);
    expect(result.remaining).toBeNull();
  });
});

describe("posts.create", () => {
  it("throws FORBIDDEN when trial user exceeds daily limit", async () => {
    const { getDailyPostCount } = await import("./db");
    vi.mocked(getDailyPostCount).mockResolvedValueOnce(2);

    const user = makeUser({ subscriptionTier: "trial" } as any);
    const caller = appRouter.createCaller(makeCtx(user));

    await expect(
      caller.posts.create({
        contentType: "image",
        platforms: ["linkedin"],
        mediaUrls: [],
        mediaKeys: [],
      })
    ).rejects.toThrow("Daily post limit");
  });

  it("throws FORBIDDEN when trial user tries to post video", async () => {
    const user = makeUser({ subscriptionTier: "trial" } as any);
    const caller = appRouter.createCaller(makeCtx(user));

    await expect(
      caller.posts.create({
        contentType: "video",
        platforms: ["linkedin"],
        mediaUrls: [],
        mediaKeys: [],
      })
    ).rejects.toThrow("not available on your trial plan");
  });

  it("throws FORBIDDEN when trial user tries to use 3 platforms", async () => {
    const user = makeUser({ subscriptionTier: "trial" } as any);
    const caller = appRouter.createCaller(makeCtx(user));

    await expect(
      caller.posts.create({
        contentType: "image",
        platforms: ["linkedin", "instagram", "x"],
        mediaUrls: [],
        mediaKeys: [],
      })
    ).rejects.toThrow("up to 2 platforms");
  });

  it("throws FORBIDDEN when trial user tries to schedule", async () => {
    const user = makeUser({ subscriptionTier: "trial" } as any);
    const caller = appRouter.createCaller(makeCtx(user));

    await expect(
      caller.posts.create({
        contentType: "image",
        platforms: ["linkedin"],
        mediaUrls: [],
        mediaKeys: [],
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      })
    ).rejects.toThrow("Scheduling is not available");
  });

  it("creates post successfully for pro user with video", async () => {
    const user = makeUser({ subscriptionTier: "pro" } as any);
    const caller = appRouter.createCaller(makeCtx(user));

    const result = await caller.posts.create({
      contentType: "video",
      platforms: ["linkedin", "instagram", "x"],
      mediaUrls: ["https://example.com/video.mp4"],
      mediaKeys: ["uploads/1/video.mp4"],
    });

    expect(result.postId).toBe(1);
    expect(result.status).toBe("published");
  });

  it("creates scheduled post for pro user", async () => {
    const user = makeUser({ subscriptionTier: "pro" } as any);
    const caller = appRouter.createCaller(makeCtx(user));

    const result = await caller.posts.create({
      contentType: "image",
      platforms: ["linkedin"],
      mediaUrls: [],
      mediaKeys: [],
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    });

    expect(result.status).toBe("scheduled");
  });
});

// ─── Subscription Tests ───────────────────────────────────────────────────────

describe("subscription.current", () => {
  it("returns trial plan details", async () => {
    const user = makeUser({ subscriptionTier: "trial" } as any);
    const caller = appRouter.createCaller(makeCtx(user));
    const result = await caller.subscription.current();

    expect(result.tier).toBe("trial");
    expect(result.canSchedule).toBe(false);
    expect(result.hasAnalytics).toBe(false);
    expect(result.platformLimit).toBe(2);
  });

  it("returns pro plan details with scheduling", async () => {
    const user = makeUser({ subscriptionTier: "pro" } as any);
    const caller = appRouter.createCaller(makeCtx(user));
    const result = await caller.subscription.current();

    expect(result.tier).toBe("pro");
    expect(result.canSchedule).toBe(true);
    expect(result.hasAnalytics).toBe(false);
    expect(result.platformLimit).toBe(5);
  });

  it("returns ultra_pro plan with analytics", async () => {
    const user = makeUser({ subscriptionTier: "ultra_pro" } as any);
    const caller = appRouter.createCaller(makeCtx(user));
    const result = await caller.subscription.current();

    expect(result.tier).toBe("ultra_pro");
    expect(result.canSchedule).toBe(true);
    expect(result.hasAnalytics).toBe(true);
    expect(result.platformLimit).toBeNull();
    expect(result.unlimited).toBe(true);
  });
});

// ─── Metrics Tests ────────────────────────────────────────────────────────────

describe("metrics.overview", () => {
  it("throws FORBIDDEN for non-ultra_pro users", async () => {
    const user = makeUser({ subscriptionTier: "pro" } as any);
    const caller = appRouter.createCaller(makeCtx(user));

    await expect(caller.metrics.overview()).rejects.toThrow("Ultra Pro");
  });

  it("returns demo data for ultra_pro with no metrics", async () => {
    const user = makeUser({ subscriptionTier: "ultra_pro" } as any);
    const caller = appRouter.createCaller(makeCtx(user));
    const result = await caller.metrics.overview();

    expect(result.totals.impressions).toBeGreaterThan(0);
    expect(result.totals.estimatedRevenue).toBeTruthy();
  });
});

// ─── Platform Tests ───────────────────────────────────────────────────────────

describe("platforms.connected", () => {
  it("returns empty array for new user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.platforms.connected();
    expect(result).toEqual([]);
  });
});

describe("platforms.connect", () => {
  it("connects a platform successfully", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.platforms.connect({
      platform: "linkedin",
      platformUsername: "@testuser",
      platformDisplayName: "Test User",
    });
    expect(result.success).toBe(true);
  });
});
