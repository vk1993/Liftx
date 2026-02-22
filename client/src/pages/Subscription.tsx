import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TIER_LIMITS } from "@/lib/platforms";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Check,
  Crown,
  Zap,
  Star,
  Lock,
  CreditCard,
  ChevronRight,
  BarChart3,
  Calendar,
  Infinity,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLAN_ICONS = {
  trial: Star,
  pro: Zap,
  ultra_pro: Crown,
};

const PLAN_COLORS = {
  trial: "oklch(0.55 0.02 260)",
  pro: "oklch(0.72 0.18 280)",
  ultra_pro: "oklch(0.72 0.18 60)",
};

const PLAN_GRADIENTS = {
  trial: "linear-gradient(135deg, oklch(0.55 0.02 260), oklch(0.45 0.02 260))",
  pro: "linear-gradient(135deg, oklch(0.72 0.18 280), oklch(0.65 0.20 320))",
  ultra_pro: "linear-gradient(135deg, oklch(0.72 0.18 60), oklch(0.65 0.20 30))",
};

const PLANS = [
  {
    tier: "trial" as const,
    name: "Trial",
    price: "Free",
    period: "",
    description: "Get started and explore",
    features: [
      { icon: Zap, text: "2 posts per day", included: true },
      { icon: Shield, text: "Up to 2 platforms", included: true },
      { icon: Star, text: "Images only", included: true },
      { icon: Calendar, text: "Scheduling", included: false },
      { icon: BarChart3, text: "Analytics", included: false },
    ],
  },
  {
    tier: "pro" as const,
    name: "Pro",
    price: "$19.99",
    period: "/mo",
    description: "For serious content creators",
    features: [
      { icon: Zap, text: "50 posts per day", included: true },
      { icon: Shield, text: "Up to 5 platforms", included: true },
      { icon: Star, text: "All content types", included: true },
      { icon: Calendar, text: "Advanced scheduling", included: true },
      { icon: BarChart3, text: "Analytics", included: false },
    ],
    badge: "Most Popular",
  },
  {
    tier: "ultra_pro" as const,
    name: "Ultra Pro",
    price: "$49.99",
    period: "/mo",
    description: "For agencies & power users",
    features: [
      { icon: Infinity, text: "Unlimited posts", included: true },
      { icon: Shield, text: "All 5 platforms", included: true },
      { icon: Star, text: "All content types", included: true },
      { icon: Calendar, text: "Advanced scheduling", included: true },
      { icon: BarChart3, text: "Real-time analytics + revenue", included: true },
    ],
    badge: "Best Value",
  },
];

export default function Subscription() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const { data: currentSub, refetch } = trpc.subscription.current.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const checkoutMutation = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to secure checkout...");
        window.open(data.checkoutUrl, "_blank");
      }
      setUpgrading(null);
    },
    onError: (err) => {
      // Fallback to simulate for demo
      toast.error(err.message);
      setUpgrading(null);
    },
  });

  const simulateMutation = trpc.subscription.simulateUpgrade.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully upgraded to ${data.tier.replace("_", " ")} plan!`);
      setUpgrading(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
      setUpgrading(null);
    },
  });

  const handleUpgrade = (tier: "trial" | "pro" | "ultra_pro") => {
    if (tier === "trial") return;
    setUpgrading(tier);
    checkoutMutation.mutate({ tier, billing: billingCycle });
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Sign in to manage subscription</h2>
        <Button onClick={() => (window.location.href = getLoginUrl())} style={{ background: "var(--gradient-primary)" }}>
          Sign In
        </Button>
      </div>
    );
  }

  const currentTier = currentSub?.tier ?? "trial";

  return (
    <div className="min-h-dvh px-4 pb-8 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Subscription</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your plan and billing
        </p>
      </div>

      {/* Current Plan Card */}
      {currentSub && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-3xl"
          style={{
            background: PLAN_GRADIENTS[currentTier],
            boxShadow: `0 8px 32px ${PLAN_COLORS[currentTier]}40`,
          }}
        >
          <div className="p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-white/70">Current Plan</p>
                <h2 className="font-display text-2xl font-bold text-white">
                  {currentTier.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </h2>
              </div>
              {(() => {
                const Icon = PLAN_ICONS[currentTier];
                return (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                );
              })()}
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/15 p-3 text-center">
                <p className="text-lg font-bold text-white">
                  {currentSub.unlimited ? "∞" : currentSub.dailyLimit}
                </p>
                <p className="text-[10px] text-white/70">Posts/day</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 text-center">
                <p className="text-lg font-bold text-white">
                  {currentSub.platformLimit ?? "∞"}
                </p>
                <p className="text-[10px] text-white/70">Platforms</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 text-center">
                <p className="text-lg font-bold text-white">{currentSub.dailyUsed}</p>
                <p className="text-[10px] text-white/70">Used today</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Billing Toggle */}
      <div className="mb-5 flex items-center justify-center gap-3">
        <span className={cn("text-sm", billingCycle === "monthly" ? "text-foreground font-medium" : "text-muted-foreground")}>
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            billingCycle === "yearly" ? "bg-primary" : "bg-secondary"
          )}
        >
          <motion.div
            animate={{ x: billingCycle === "yearly" ? 22 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
          />
        </button>
        <span className={cn("text-sm", billingCycle === "yearly" ? "text-foreground font-medium" : "text-muted-foreground")}>
          Yearly
          <span className="ml-1 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
            -17%
          </span>
        </span>
      </div>

      {/* Plan Cards */}
      <div className="space-y-3">
        {PLANS.map((plan, i) => {
          const isCurrentPlan = currentTier === plan.tier;
          const Icon = PLAN_ICONS[plan.tier];
          const yearlyPrice =
            plan.tier === "pro"
              ? "$199.99"
              : plan.tier === "ultra_pro"
              ? "$499.99"
              : "Free";

          return (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative overflow-hidden rounded-2xl border transition-all",
                isCurrentPlan
                  ? "border-primary/40 bg-primary/5"
                  : plan.tier === "pro"
                  ? "border-primary/20 bg-card"
                  : "border-border/50 bg-card"
              )}
              style={
                isCurrentPlan
                  ? { boxShadow: `0 0 24px ${PLAN_COLORS[plan.tier]}20` }
                  : undefined
              }
            >
              {plan.badge && !isCurrentPlan && (
                <div
                  className="absolute right-4 top-0 -translate-y-px rounded-b-xl px-3 py-1 text-[10px] font-bold text-white"
                  style={{ background: PLAN_GRADIENTS[plan.tier] }}
                >
                  {plan.badge}
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute right-4 top-0 -translate-y-px rounded-b-xl bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground">
                  Current Plan
                </div>
              )}

              <div className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: `${PLAN_COLORS[plan.tier]}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: PLAN_COLORS[plan.tier] }} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-foreground">
                      {billingCycle === "yearly" ? yearlyPrice : plan.price}
                    </p>
                    {plan.period && (
                      <p className="text-xs text-muted-foreground">
                        {billingCycle === "yearly" ? "/yr" : plan.period}
                      </p>
                    )}
                  </div>
                </div>

                <ul className="mb-4 space-y-2">
                  {plan.features.map((f) => {
                    const FIcon = f.icon;
                    return (
                      <li key={f.text} className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                            f.included ? "bg-primary/20" : "bg-muted"
                          )}
                        >
                          {f.included ? (
                            <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
                          ) : (
                            <Lock className="h-2 w-2 text-muted-foreground/40" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-xs",
                            f.included ? "text-foreground" : "text-muted-foreground/50"
                          )}
                        >
                          {f.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {isCurrentPlan ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 py-2.5 text-sm font-medium text-primary">
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                    Active Plan
                  </div>
                ) : plan.tier === "trial" ? (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-border/50 text-sm"
                    onClick={() => simulateMutation.mutate({ tier: "trial" })}
                    disabled={currentTier === "trial"}
                  >
                    Downgrade to Free
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={upgrading === plan.tier}
                    className="w-full rounded-xl text-sm font-semibold"
                    style={{ background: PLAN_GRADIENTS[plan.tier] }}
                  >
                    {upgrading === plan.tier ? (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((j) => (
                            <div
                              key={j}
                              className="h-1.5 w-1.5 rounded-full bg-white"
                              style={{ animation: `wave 0.8s ease-in-out infinite`, animationDelay: `${j * 0.15}s` }}
                            />
                          ))}
                        </div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Upgrade to {plan.name}
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Stripe Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex items-center gap-3 rounded-2xl border border-border/30 bg-card/50 p-4"
      >
        <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Payments are processed securely via Stripe. Cancel anytime from your billing portal.
        </p>
      </motion.div>
    </div>
  );
}
