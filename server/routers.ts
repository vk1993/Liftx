import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import {
  cancelPost,
  connectAccount,
  createPost,
  disconnectAccount,
  getConnectedAccounts,
  getDailyPostCount,
  getMetricsOverview,
  getPostsByUser,
  getSubscriptionPlans,
  getUserByOpenId,
  updateUserSubscription,
  upsertUser,
} from "./db";
import { nanoid } from "nanoid";
import { createCheckoutSession } from "./stripeHandler";

// ─── Platform config ──────────────────────────────────────────────────────────

export const PLATFORM_CONTENT_TYPES = {
  linkedin: ["text", "image", "carousel", "video"],
  instagram: ["image", "carousel", "video", "reel", "story"],
  x: ["text", "image", "video"],
  facebook: ["text", "image", "carousel", "video", "story"],
  tiktok: ["video", "reel"],
} as const;

export const TIER_LIMITS: Record<
  "trial" | "pro" | "ultra_pro",
  { dailyPosts: number | null; platforms: number | null; contentTypes: string[] }
> = {
  trial: { dailyPosts: 2, platforms: 2, contentTypes: ["image"] },
  pro: {
    dailyPosts: 50,
    platforms: 5,
    contentTypes: ["image", "video", "carousel", "text", "reel", "story"],
  },
  ultra_pro: {
    dailyPosts: null,
    platforms: null,
    contentTypes: ["image", "video", "carousel", "text", "reel", "story"],
  },
};

// ─── Auth Router ──────────────────────────────────────────────────────────────

const authRouter = router({
  me: publicProcedure.query(async (opts) => {
    if (!opts.ctx.user) return null;
    return opts.ctx.user;
  }),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ─── Posts Router ─────────────────────────────────────────────────────────────

const postsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return getPostsByUser(ctx.user.id, input);
    }),

  create: protectedProcedure
    .input(
      z.object({
        caption: z.string().optional(),
        contentType: z.enum(["image", "video", "carousel", "text", "reel", "story"]),
        mediaUrls: z.array(z.string()).default([]),
        mediaKeys: z.array(z.string()).default([]),
        platforms: z.array(z.enum(["linkedin", "instagram", "x", "facebook", "tiktok"])).min(1),
        scheduledAt: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const tier = (user.subscriptionTier as "trial" | "pro" | "ultra_pro") ?? "trial";
      const limits = TIER_LIMITS[tier];

      // Check daily post limit
      if (limits.dailyPosts !== null) {
        const dailyCount = await getDailyPostCount(ctx.user.id);
        const effectiveLimit =
          tier === "pro" ? ((user as any).proPostLimit ?? 50) : limits.dailyPosts;
        if (dailyCount >= effectiveLimit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Daily post limit of ${effectiveLimit} reached for your ${tier} plan. Upgrade to post more.`,
          });
        }
      }

      // Check platform limit
      if (limits.platforms !== null && input.platforms.length > limits.platforms) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your ${tier} plan allows up to ${limits.platforms} platforms per post.`,
        });
      }

      // Check content type
      if (!limits.contentTypes.includes(input.contentType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Content type "${input.contentType}" is not available on your ${tier} plan.`,
        });
      }

      // Check scheduling
      if (input.scheduledAt && tier === "trial") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Scheduling is not available on the Trial plan. Upgrade to Pro or Ultra Pro.",
        });
      }

      const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : undefined;

      const postId = await createPost({
        userId: ctx.user.id,
        caption: input.caption ?? "",
        contentType: input.contentType,
        mediaUrls: input.mediaUrls,
        mediaKeys: input.mediaKeys,
        platforms: input.platforms,
        scheduledAt,
      });

      // Notify owner on new post
      try {
        await notifyOwner({
          title: "📝 New Post Created",
          content: `User ${user.name ?? user.email ?? user.openId} created a ${input.contentType} post for ${input.platforms.join(", ")}.`,
        });
      } catch (_) {}

      return { postId, status: scheduledAt ? "scheduled" : "published" };
    }),

  cancel: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await cancelPost(input.postId, ctx.user.id);
      return { success: true };
    }),

  dailyUsage: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    const tier = (user.subscriptionTier as "trial" | "pro" | "ultra_pro") ?? "trial";
    const limits = TIER_LIMITS[tier];
    const used = await getDailyPostCount(ctx.user.id);
    const limit =
      tier === "pro"
        ? ((user as any).proPostLimit ?? 50)
        : limits.dailyPosts;

    return {
      used,
      limit,
      unlimited: limit === null,
      tier,
      remaining: limit === null ? null : Math.max(0, limit - used),
    };
  }),

  platformContentTypes: publicProcedure.query(() => PLATFORM_CONTENT_TYPES),
});

// ─── Platforms Router ─────────────────────────────────────────────────────────

const platformsRouter = router({
  connected: protectedProcedure.query(async ({ ctx }) => {
    return getConnectedAccounts(ctx.user.id);
  }),

  connect: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["linkedin", "instagram", "x", "facebook", "tiktok"]),
        platformUserId: z.string().optional(),
        platformUsername: z.string().optional(),
        platformDisplayName: z.string().optional(),
        platformAvatarUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await connectAccount({
        userId: ctx.user.id,
        platform: input.platform,
        platformUsername: input.platformUsername,
        platformDisplayName: input.platformDisplayName,
        platformAvatarUrl: input.platformAvatarUrl,
      });
      return { success: true };
    }),

  disconnect: protectedProcedure
    .input(z.object({ platform: z.enum(["linkedin", "instagram", "x", "facebook", "tiktok"]) }))
    .mutation(async ({ ctx, input }) => {
      await disconnectAccount(ctx.user.id, input.platform);
      return { success: true };
    }),
});

// ─── Subscription Router ──────────────────────────────────────────────────────

const subscriptionRouter = router({
  plans: publicProcedure.query(async () => {
    return getSubscriptionPlans();
  }),

  current: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    const tier = (user.subscriptionTier as "trial" | "pro" | "ultra_pro") ?? "trial";
    const limits = TIER_LIMITS[tier];
    const dailyUsed = await getDailyPostCount(ctx.user.id);
    const dailyLimit =
      tier === "pro" ? ((user as any).proPostLimit ?? 50) : limits.dailyPosts;

    return {
      tier,
      status: (user as any).subscriptionStatus ?? "active",
      expiresAt: (user as any).subscriptionExpiresAt,
      stripeSubscriptionId: (user as any).stripeSubscriptionId,
      dailyUsed,
      dailyLimit,
      unlimited: dailyLimit === null,
      platformLimit: limits.platforms,
      allowedContentTypes: limits.contentTypes,
      canSchedule: tier !== "trial",
      hasAnalytics: tier === "ultra_pro",
    };
  }),

  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["pro", "ultra_pro"]),
        billing: z.enum(["monthly", "yearly"]).default("monthly"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const origin = (ctx.req.headers.origin as string) ?? "https://liftx.manus.space";
      const url = await createCheckoutSession({
        userId: user.id,
        userEmail: user.email ?? "",
        userName: user.name ?? "User",
        tier: input.tier,
        billing: input.billing,
        origin,
      });
      return { checkoutUrl: url };
    }),

  simulateUpgrade: protectedProcedure
    .input(z.object({ tier: z.enum(["trial", "pro", "ultra_pro"]) }))
    .mutation(async ({ ctx, input }) => {
      await updateUserSubscription(ctx.user.id, input.tier);

      const user = ctx.user;
      if (input.tier !== "trial") {
        try {
          await notifyOwner({
            title: `🚀 Subscription Upgrade: ${input.tier.toUpperCase()}`,
            content: `User ${user.name ?? user.email ?? user.openId} upgraded to ${input.tier}.`,
          });
        } catch (_) {}
      }

      return { success: true, tier: input.tier };
    }),
});

// ─── Upload Router ────────────────────────────────────────────────────────────

const uploadRouter = router({
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.string(),
        fileSize: z.number().max(100 * 1024 * 1024),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ext = input.fileName.split(".").pop() ?? "bin";
      const key = `uploads/${ctx.user.id}/${nanoid()}.${ext}`;
      return { key, uploadEndpoint: `/api/upload` };
    }),
});

// ─── Metrics Router (Ultra Pro) ───────────────────────────────────────────────

const metricsRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    const tier = (user.subscriptionTier as string) ?? "trial";
    if (tier !== "ultra_pro") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Real-time metrics are available for Ultra Pro subscribers only.",
      });
    }

    const data = await getMetricsOverview(ctx.user.id);

    if (!data) {
      // Return demo data if no real metrics
      return {
        totals: {
          impressions: 31300,
          reach: 22400,
          likes: 4220,
          comments: 890,
          shares: 1240,
          clicks: 3100,
          saves: 680,
          estimatedRevenue: "127.50",
        },
        byPlatform: {},
        recentMetrics: [],
      };
    }

    return {
      totals: data.totals,
      byPlatform: {},
      recentMetrics: data.byPlatform.slice(0, 20),
    };
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  posts: postsRouter,
  platforms: platformsRouter,
  subscription: subscriptionRouter,
  upload: uploadRouter,
  metrics: metricsRouter,
});

export type AppRouter = typeof appRouter;
