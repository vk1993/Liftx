// Stripe products and prices for Liftx subscription tiers
// In production, create these in the Stripe Dashboard and update the price IDs

export const LIFTX_PRODUCTS = {
  pro: {
    name: "Liftx Pro",
    description: "50 posts/day, 5 platforms, all content types, scheduling",
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "price_pro_monthly",
    yearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "price_pro_yearly",
    monthlyAmount: 1900, // $19.00 in cents
    yearlyAmount: 18000, // $180.00 in cents
    tier: "pro" as const,
  },
  ultra_pro: {
    name: "Liftx Ultra Pro",
    description: "Unlimited posts, all platforms, analytics, revenue metrics",
    monthlyPriceId: process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID ?? "price_ultra_monthly",
    yearlyPriceId: process.env.STRIPE_ULTRA_YEARLY_PRICE_ID ?? "price_ultra_yearly",
    monthlyAmount: 4900, // $49.00 in cents
    yearlyAmount: 47000, // $470.00 in cents
    tier: "ultra_pro" as const,
  },
} as const;

export type ProductTier = keyof typeof LIFTX_PRODUCTS;
