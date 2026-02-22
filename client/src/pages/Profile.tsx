import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TIER_LIMITS } from "@/lib/platforms";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import React from "react";
import {
  User,
  Crown,
  Zap,
  Star,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Lock,
  BarChart3,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TIER_ICONS = { trial: Star, pro: Zap, ultra_pro: Crown };
const TIER_COLORS = {
  trial: "oklch(0.55 0.02 260)",
  pro: "oklch(0.72 0.18 280)",
  ultra_pro: "oklch(0.72 0.18 60)",
};
const TIER_GRADIENTS = {
  trial: "linear-gradient(135deg, oklch(0.55 0.02 260), oklch(0.45 0.02 260))",
  pro: "linear-gradient(135deg, oklch(0.72 0.18 280), oklch(0.65 0.20 320))",
  ultra_pro: "linear-gradient(135deg, oklch(0.72 0.18 60), oklch(0.65 0.20 30))",
};

interface MenuItem {
  icon: React.ElementType;
  label: string;
  desc: string;
  action: () => void;
  locked?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function Profile() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: usage } = trpc.posts.dailyUsage.useQuery(undefined, { enabled: isAuthenticated });
  const { data: sub } = trpc.subscription.current.useQuery(undefined, { enabled: isAuthenticated });

  const handleLogout = async () => {
    await logout();
    navigate("/");
    toast.success("Logged out successfully");
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{ background: "oklch(0.72 0.18 280 / 0.15)" }}
        >
          <User className="h-10 w-10 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Welcome to Liftx</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage your profile and settings
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = getLoginUrl())}
          className="w-full rounded-2xl py-6 text-base"
          style={{ background: "var(--gradient-primary)" }}
        >
          Sign In
        </Button>
      </div>
    );
  }

  const tier = (sub?.tier ?? "trial") as "trial" | "pro" | "ultra_pro";
  const TierIcon = TIER_ICONS[tier];
  const limits = TIER_LIMITS[tier];

  const MENU_SECTIONS: MenuSection[] = [
    {
      title: "Account",
      items: [
        { icon: BarChart3, label: "Analytics", desc: "View performance metrics", action: () => navigate("/analytics"), locked: tier !== "ultra_pro" },
        { icon: Bell, label: "Notifications", desc: "Manage alerts", action: () => toast.info("Coming soon") },
        { icon: Settings, label: "Preferences", desc: "App settings", action: () => toast.info("Coming soon") },
      ],
    },
    {
      title: "Billing",
      items: [
        { icon: Crown, label: "Subscription", desc: `${tier.replace("_", " ")} plan`, action: () => navigate("/subscription") },
        { icon: Shield, label: "Privacy & Security", desc: "Data & permissions", action: () => toast.info("Coming soon") },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help & Support", desc: "Get help", action: () => toast.info("Coming soon") },
      ],
    },
  ];

  return (
    <div className="min-h-dvh px-4 pb-8 pt-6">
      {/* Header */}
      <h1 className="font-display mb-6 text-2xl font-bold text-foreground">Profile</h1>

      {/* User Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-3xl"
        style={{
          background: TIER_GRADIENTS[tier],
          boxShadow: `0 8px 32px ${TIER_COLORS[tier]}40`,
        }}
      >
        <div className="p-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white">
                {(user as any)?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background"
              >
                <TierIcon className="h-3.5 w-3.5" style={{ color: TIER_COLORS[tier] }} />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="font-display truncate text-lg font-bold text-white">
                {(user as any)?.name ?? "User"}
              </p>
              <p className="truncate text-xs text-white/70">{(user as any)?.email ?? ""}</p>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5">
                <TierIcon className="h-3 w-3 text-white" />
                <span className="text-[10px] font-semibold text-white capitalize">
                  {tier.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          {usage && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/15 p-3 text-center">
                <p className="text-lg font-bold text-white">{usage.used}</p>
                <p className="text-[10px] text-white/70">Posts today</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 text-center">
                <p className="text-lg font-bold text-white">
                  {usage.unlimited ? "∞" : usage.remaining}
                </p>
                <p className="text-[10px] text-white/70">Remaining</p>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 text-center">
                <p className="text-lg font-bold text-white">
                  {limits.platforms ?? "∞"}
                </p>
                <p className="text-[10px] text-white/70">Platforms</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Menu Sections */}
      <div className="space-y-4">
        {MENU_SECTIONS.map((section, si) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + si * 0.1 }}
          >
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
              {section.items.map((item, ii) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/50",
                      ii < section.items.length - 1 && "border-b border-border/30"
                    )}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "oklch(0.72 0.18 280 / 0.12)" }}
                    >
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    {item.locked ? (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full rounded-2xl border border-destructive/30 bg-destructive/5 py-4 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </motion.div>
      </div>

      {/* App Version */}
      <p className="mt-6 text-center text-xs text-muted-foreground/40">
        Liftx v1.0.0 · Built with ❤️
      </p>
    </div>
  );
}
