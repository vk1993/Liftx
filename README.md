# Liftx

A mobile-first web app for publishing content to multiple social media platforms simultaneously.

## Features

- **Multi-platform publishing**: LinkedIn, Instagram, X (Twitter), Facebook, TikTok
- **Smart content type detection**: Enable/disable content types based on platform support
- **Three subscription tiers**:
  - **Trial**: 2 posts/day, max 2 platforms, images only
  - **Pro** ($19/mo): 50 posts/day, 5 platforms, all content types, scheduling
  - **Ultra Pro** ($49/mo): Unlimited posts, all platforms, real-time analytics + revenue metrics
- **Content scheduling** for Pro and Ultra Pro users
- **S3 file storage** for media uploads
- **Stripe payments** with webhook handling
- **Real-time analytics** dashboard for Ultra Pro users
- **Framer Motion** animations throughout

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Framer Motion, Recharts
- **Backend**: Express, tRPC, Drizzle ORM
- **Database**: MySQL/TiDB
- **Storage**: AWS S3
- **Payments**: Stripe

## Getting Started

```bash
pnpm install
pnpm dev
```

## Testing

```bash
pnpm test
```

19 unit tests covering auth, posts, subscriptions, platforms, and metrics.

## Subscription Tiers

| Feature | Trial | Pro | Ultra Pro |
|---------|-------|-----|-----------|
| Posts per day | 2 | 50 | Unlimited |
| Platforms per post | 2 | 5 | All 5 |
| Content types | Images only | All types | All types |
| Scheduling | ❌ | ✅ | ✅ |
| Analytics | ❌ | ❌ | ✅ |
| Revenue metrics | ❌ | ❌ | ✅ |
| Price | Free | $19/mo | $49/mo |

## Platform Content Support

| Content Type | LinkedIn | Instagram | X | Facebook | TikTok |
|-------------|----------|-----------|---|----------|--------|
| Image | ✅ | ✅ | ✅ | ✅ | ❌ |
| Video | ✅ | ✅ | ✅ | ✅ | ✅ |
| Carousel | ✅ | ✅ | ❌ | ✅ | ❌ |
| Text | ✅ | ❌ | ✅ | ✅ | ❌ |
| Reel | ❌ | ✅ | ❌ | ❌ | ✅ |
| Story | ❌ | ✅ | ❌ | ✅ | ❌ |
