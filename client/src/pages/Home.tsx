import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  Zap,
  Calendar,
  BarChart3,
  Shield,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { name: "LinkedIn", color: "#0A66C2", letter: "in" },
  { name: "Instagram", gradient: "linear-gradient(135deg, #405DE6, #C13584, #FD1D1D)", letter: "ig" },
  { name: "X", color: "#1a1a1a", letter: "𝕏" },
  { name: "Facebook", color: "#1877F2", letter: "f" },
  { name: "TikTok", gradient: "linear-gradient(135deg, #010101, #69C9D0)", letter: "tt" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "One-click multi-publish",
    desc: "Post to all your platforms simultaneously with a single tap.",
  },
  {
    icon: Calendar,
    title: "Smart scheduling",
    desc: "Schedule posts for the perfect time to maximize engagement.",
  },
  {
    icon: BarChart3,
    title: "Real-time analytics",
    desc: "Track impressions, reach, and revenue across all platforms.",
  },
  {
    icon: Shield,
    title: "Platform-smart content",
    desc: "Auto-detects supported content types per platform.",
  },
];

const PLANS = [
  {
    name: "Trial",
    price: "Free",
    tier: "trial",
    features: ["2 posts per day", "Up to 2 platforms", "Images only", "Basic analytics"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19.99",
    period: "/mo",
    tier: "pro",
    features: ["50 posts per day", "Up to 5 platforms", "All content types", "Scheduling", "Advanced analytics"],
    cta: "Start Pro",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Ultra Pro",
    price: "$49.99",
    period: "/mo",
    tier: "ultra_pro",
    features: ["Unlimited posts", "All platforms", "All content types", "Advanced scheduling", "Real-time metrics", "Revenue analytics", "Priority support"],
    cta: "Go Ultra",
    highlight: false,
    badge: "Best Value",
  },
];

const stagger = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  },
};

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/posts");
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-4 w-1 rounded-full bg-primary"
              style={{
                animation: `wave 1s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 px-6 py-4">
        <div className="glass mx-auto flex max-w-lg items-center justify-between rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold text-foreground">Liftx</span>
          </div>
          <Button
            size="sm"
            onClick={() => (window.location.href = getLoginUrl())}
            className="rounded-xl text-xs font-semibold"
            style={{ background: "var(--gradient-primary)" }}
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pb-16 pt-8">
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-lg text-center"
        >
          <motion.div variants={stagger.item} className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Multi-platform publishing</span>
          </motion.div>

          <motion.h1
            variants={stagger.item}
            className="font-display mb-4 text-4xl font-extrabold leading-tight tracking-tight text-foreground"
          >
            Publish everywhere,{" "}
            <span className="gradient-text">effortlessly</span>
          </motion.h1>

          <motion.p
            variants={stagger.item}
            className="mb-8 text-base leading-relaxed text-muted-foreground"
          >
            Create once, publish to LinkedIn, Instagram, X, Facebook, and TikTok simultaneously. Schedule, analyze, and grow your presence.
          </motion.p>

          {/* Platform Pills */}
          <motion.div variants={stagger.item} className="mb-8 flex flex-wrap justify-center gap-2">
            {PLATFORMS.map((p) => (
              <motion.div
                key={p.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                style={{
                  background: p.gradient ?? p.color,
                  boxShadow: `0 2px 8px ${p.color ?? "rgba(0,0,0,0.3)"}40`,
                }}
              >
                <span className="font-bold">{p.letter}</span>
                {p.name}
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={stagger.item} className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="group rounded-2xl px-8 py-6 text-base font-semibold"
              style={{ background: "var(--gradient-primary)" }}
            >
              Start for free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-2xl border-border/50 px-8 py-6 text-base font-semibold"
            >
              View pricing
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Floating platform cards */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
            className="relative rounded-3xl border border-border/50 bg-card p-6"
            style={{ boxShadow: "0 16px 64px oklch(0 0 0 / 0.5)" }}
          >
            {/* Mock post composer */}
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-500" />
              <div>
                <div className="h-3 w-24 rounded-full bg-secondary" />
                <div className="mt-1 h-2 w-16 rounded-full bg-muted" />
              </div>
            </div>
            <div className="mb-4 space-y-2">
              <div className="h-3 w-full rounded-full bg-secondary" />
              <div className="h-3 w-4/5 rounded-full bg-secondary" />
              <div className="h-3 w-3/5 rounded-full bg-secondary" />
            </div>
            <div className="mb-4 h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20" />
            <div className="flex gap-2">
              {PLATFORMS.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ background: p.gradient ?? p.color }}
                >
                  {p.letter}
                </motion.div>
              ))}
              <div className="ml-auto">
                <div
                  className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold text-white"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Zap className="h-3 w-3" />
                  Publish
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-lg">
          <h2 className="font-display mb-8 text-center text-2xl font-bold text-foreground">
            Everything you need
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                  className="rounded-2xl border border-border/50 bg-card p-4"
                >
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: "oklch(0.72 0.18 280 / 0.15)" }}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-foreground">{f.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 pb-24">
        <div className="mx-auto max-w-lg">
          <h2 className="font-display mb-2 text-center text-2xl font-bold text-foreground">
            Simple pricing
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Start free, upgrade when you're ready
          </p>
          <div className="space-y-3">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border p-5 ${
                  plan.highlight
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/50 bg-card"
                }`}
                style={
                  plan.highlight
                    ? { boxShadow: "0 0 32px oklch(0.72 0.18 280 / 0.15)" }
                    : undefined
                }
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3 right-4 rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {plan.badge}
                  </div>
                )}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{plan.name}</h3>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                      {plan.period && (
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => (window.location.href = getLoginUrl())}
                    className="rounded-xl text-xs"
                    style={
                      plan.highlight
                        ? { background: "var(--gradient-primary)" }
                        : undefined
                    }
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl p-8 text-center"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "0 16px 64px oklch(0.72 0.18 280 / 0.3)",
            }}
          >
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-white/80" />
            <h2 className="font-display mb-2 text-2xl font-bold text-white">
              Ready to lift your content?
            </h2>
            <p className="mb-6 text-sm text-white/80">
              Join thousands of creators publishing smarter.
            </p>
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="rounded-2xl bg-white px-8 font-semibold text-primary hover:bg-white/90"
            >
              Get started free
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
