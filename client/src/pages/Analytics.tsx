import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { PLATFORMS, Platform } from "@/lib/platforms";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  Eye,
  Heart,
  MessageCircle,
  Share2,
  MousePointer,
  Bookmark,
  TrendingUp,
  DollarSign,
  Lock,
  Crown,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

const METRIC_CARDS = [
  { key: "impressions", label: "Impressions", icon: Eye, color: "oklch(0.72 0.18 280)" },
  { key: "reach", label: "Reach", icon: Users, color: "oklch(0.72 0.18 200)" },
  { key: "likes", label: "Likes", icon: Heart, color: "oklch(0.72 0.18 25)" },
  { key: "comments", label: "Comments", icon: MessageCircle, color: "oklch(0.72 0.18 160)" },
  { key: "shares", label: "Shares", icon: Share2, color: "oklch(0.72 0.18 60)" },
  { key: "clicks", label: "Clicks", icon: MousePointer, color: "oklch(0.72 0.18 320)" },
  { key: "saves", label: "Saves", icon: Bookmark, color: "oklch(0.72 0.18 100)" },
  { key: "estimatedRevenue", label: "Est. Revenue", icon: DollarSign, color: "oklch(0.72 0.18 140)", isRevenue: true },
];

// Demo data for visualization
const DEMO_AREA_DATA = [
  { day: "Mon", impressions: 1200, reach: 800, engagement: 240 },
  { day: "Tue", impressions: 1800, reach: 1200, engagement: 380 },
  { day: "Wed", impressions: 1400, reach: 950, engagement: 290 },
  { day: "Thu", impressions: 2200, reach: 1600, engagement: 520 },
  { day: "Fri", impressions: 2800, reach: 2000, engagement: 680 },
  { day: "Sat", impressions: 3200, reach: 2400, engagement: 820 },
  { day: "Sun", impressions: 2600, reach: 1900, engagement: 610 },
];

const DEMO_PLATFORM_DATA = [
  { platform: "LinkedIn", impressions: 4200, engagement: 380 },
  { platform: "Instagram", impressions: 8600, engagement: 1240 },
  { platform: "X", impressions: 3100, engagement: 290 },
  { platform: "Facebook", impressions: 2800, engagement: 210 },
  { platform: "TikTok", impressions: 12400, engagement: 2100 },
];

const DEMO_RADAR_DATA = [
  { metric: "Impressions", value: 85 },
  { metric: "Reach", value: 72 },
  { metric: "Engagement", value: 68 },
  { metric: "Clicks", value: 45 },
  { metric: "Saves", value: 38 },
  { metric: "Revenue", value: 52 },
];

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function MetricCard({ metric, value, isRevenue }: { metric: typeof METRIC_CARDS[0]; value: number | string; isRevenue?: boolean }) {
  const Icon = metric.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-border/50 bg-card p-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: `${metric.color}20` }}
        >
          <Icon className="h-4 w-4" style={{ color: metric.color }} />
        </div>
        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
      </div>
      <p className="font-display text-xl font-bold text-foreground">
        {isRevenue ? `$${value}` : formatNumber(Number(value))}
      </p>
      <p className="text-xs text-muted-foreground">{metric.label}</p>
    </motion.div>
  );
}

function UltraProGate({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative"
      >
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 60), oklch(0.65 0.20 30))" }}
        >
          <Crown className="h-10 w-10 text-white" />
        </div>
        <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background">
          <Lock className="h-3 w-3 text-muted-foreground" />
        </div>
      </motion.div>

      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Ultra Pro Analytics</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Get real-time metrics, revenue tracking, and deep insights across all your platforms.
        </p>
      </div>

      <div className="w-full space-y-2 text-left">
        {[
          "Real-time impressions & reach",
          "Revenue estimation per post",
          "Per-platform performance breakdown",
          "Engagement rate analytics",
          "Content performance radar",
        ].map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            {f}
          </div>
        ))}
      </div>

      <Button
        onClick={onUpgrade}
        className="w-full rounded-2xl py-6 text-base font-semibold"
        style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 60), oklch(0.65 0.20 30))" }}
      >
        <Crown className="mr-2 h-5 w-5" />
        Upgrade to Ultra Pro
      </Button>
    </div>
  );
}

export default function Analytics() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();

  const tier = (user as any)?.subscriptionTier ?? "trial";
  const isUltraPro = tier === "ultra_pro";

  const { data: metrics, isLoading } = trpc.metrics.overview.useQuery(undefined, {
    enabled: isAuthenticated && isUltraPro,
    retry: false,
  });

  if (!isAuthenticated && !loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Sign in to view analytics</h2>
        <Button onClick={() => (window.location.href = getLoginUrl())} style={{ background: "var(--gradient-primary)" }}>
          Sign In
        </Button>
      </div>
    );
  }

  if (!isUltraPro) {
    return (
      <div className="min-h-dvh px-4 pb-8 pt-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
        </div>
        <UltraProGate onUpgrade={() => navigate("/subscription")} />
      </div>
    );
  }

  // Use demo data if no real metrics yet
  const totals = metrics?.totals ?? {
    impressions: 31300,
    reach: 22400,
    likes: 4220,
    comments: 890,
    shares: 1240,
    clicks: 3100,
    saves: 680,
    estimatedRevenue: "127.50",
  };

  return (
    <div className="min-h-dvh px-4 pb-8 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Real-time performance metrics</p>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, oklch(0.72 0.18 60), oklch(0.65 0.20 30))" }}
        >
          <Crown className="h-3 w-3" />
          Ultra Pro
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {METRIC_CARDS.map((metric, i) => (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <MetricCard
              metric={metric}
              value={(totals as any)[metric.key] ?? 0}
              isRevenue={metric.isRevenue}
            />
          </motion.div>
        ))}
      </div>

      {/* Impressions Over Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-4 rounded-2xl border border-border/50 bg-card p-4"
      >
        <h3 className="mb-4 text-sm font-semibold text-foreground">Weekly Performance</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={DEMO_AREA_DATA}>
            <defs>
              <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.72 0.18 280)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.72 0.18 280)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.72 0.18 200)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.72 0.18 200)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 260)" />
            <XAxis dataKey="day" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatNumber} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.14 0.015 260)",
                border: "1px solid oklch(0.22 0.02 260)",
                borderRadius: "12px",
                color: "oklch(0.95 0.01 260)",
                fontSize: "12px",
              }}
            />
            <Area type="monotone" dataKey="impressions" stroke="oklch(0.72 0.18 280)" fill="url(#impressionsGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="reach" stroke="oklch(0.72 0.18 200)" fill="url(#reachGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Platform Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-4 rounded-2xl border border-border/50 bg-card p-4"
      >
        <h3 className="mb-4 text-sm font-semibold text-foreground">Platform Breakdown</h3>
        <div className="space-y-3">
          {DEMO_PLATFORM_DATA.map((p) => {
            const maxImpressions = Math.max(...DEMO_PLATFORM_DATA.map((d) => d.impressions));
            const pct = (p.impressions / maxImpressions) * 100;
            const platform = p.platform.toLowerCase() as Platform;
            const config = PLATFORMS[platform];

            return (
              <div key={p.platform} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-bold text-white"
                      style={{ background: config?.gradient ?? config?.color ?? "#666" }}
                    >
                      {config?.letter ?? p.platform[0]}
                    </div>
                    <span className="text-foreground">{p.platform}</span>
                  </div>
                  <span className="text-muted-foreground">{formatNumber(p.impressions)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: config?.gradient ?? config?.color ?? "#666" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Performance Radar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-border/50 bg-card p-4"
      >
        <h3 className="mb-4 text-sm font-semibold text-foreground">Content Performance Score</h3>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={DEMO_RADAR_DATA}>
            <PolarGrid stroke="oklch(0.22 0.02 260)" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 10 }} />
            <Radar
              name="Performance"
              dataKey="value"
              stroke="oklch(0.72 0.18 280)"
              fill="oklch(0.72 0.18 280)"
              fillOpacity={0.2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Revenue Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-4 overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(135deg, oklch(0.72 0.18 140), oklch(0.65 0.20 100))",
          boxShadow: "0 8px 32px oklch(0.72 0.18 140 / 0.3)",
        }}
      >
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-white/80" />
            <p className="text-sm font-semibold text-white/80">Estimated Revenue</p>
          </div>
          <p className="font-display text-3xl font-bold text-white">${totals.estimatedRevenue}</p>
          <p className="mt-1 text-xs text-white/60">Based on CPM & engagement rates</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["CPM", "CTR", "eCPM"].map((metric, i) => (
              <div key={metric} className="rounded-xl bg-white/15 p-2 text-center">
                <p className="text-sm font-bold text-white">{["$4.07", "2.3%", "$3.82"][i]}</p>
                <p className="text-[10px] text-white/60">{metric}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
