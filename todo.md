# Liftx - Project TODO

## Phase 1: Infrastructure & Design System
- [x] Design system: color palette, typography, CSS variables (dark theme, soothing minimal)
- [x] Database schema: users, posts, platforms, subscriptions, connected_accounts, post_platforms, metrics
- [x] Drizzle migration and DB sync
- [x] S3 file storage helpers

## Phase 2: Backend Routers
- [x] Auth router: me, logout, email/password login, OAuth social login stubs
- [x] Subscription router: get plan, upgrade, usage stats
- [x] Posts router: create, list, schedule, delete, update status
- [x] Platforms router: list supported, connect, disconnect
- [x] Upload router: presigned URL generation, file metadata save
- [x] Metrics router: Ultra Pro analytics and revenue data
- [x] Stripe webhook handler and subscription sync

## Phase 3: Core UI & Navigation
- [x] Landing page with hero, features, pricing tiers
- [x] App shell with mobile bottom navigation
- [x] Auth screens: login, signup, OAuth buttons
- [x] Theme: dark minimal with soothing gradients and animations

## Phase 4: Content Composer
- [x] Platform selector with enable/disable per content type
- [x] Content type detection (image, video, carousel, text) per platform
- [x] Trial/Pro/UltraPro gating on platform count and content types
- [x] File upload with S3 integration and progress indicator
- [x] Post preview per platform
- [x] Schedule picker for Pro/Ultra Pro

## Phase 5: Post Management
- [x] Post history dashboard (published, scheduled, failed)
- [x] Daily usage limit tracker per tier
- [x] Scheduled posts management (edit, cancel)
- [x] Status badges and timeline

## Phase 6: Subscriptions & Platform Connections
- [x] Subscription tier page (Trial, Pro, Ultra Pro)
- [x] Stripe checkout integration
- [x] Stripe webhook handler
- [x] Platform OAuth connection management (LinkedIn, Instagram, X, Facebook, TikTok)
- [x] Connected accounts list with connect/disconnect

## Phase 7: Analytics (Ultra Pro)
- [x] Real-time metrics dashboard (impressions, reach, engagement)
- [x] Revenue metrics panel
- [x] Per-platform breakdown charts

## Phase 8: Animations & UX Polish
- [x] Upload progress animation (circular/linear)
- [x] Page transition animations (framer-motion)
- [x] Platform card hover/select animations
- [x] Success/error toast with animations
- [x] Skeleton loading states
- [x] Confetti on first post / subscription upgrade

## Phase 9: Testing & Delivery
- [x] Vitest unit tests for routers (19 tests passing)
- [ ] Push to GitHub (public repo: Liftx)
- [ ] Save checkpoint
- [x] Owner email notifications (signup, upgrade, system events)
