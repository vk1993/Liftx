import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { PLATFORMS, Platform, TIER_LIMITS } from "@/lib/platforms";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  PlusCircle,
  Calendar,
  Image,
  Video,
  FileText,
  Layers,
  Film,
  Circle,
  Lock,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const STATUS_CONFIG = {
  published: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10", label: "Published" },
  scheduled: { icon: Clock, color: "text-blue-400", bg: "bg-blue-400/10", label: "Scheduled" },
  publishing: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Publishing" },
  draft: { icon: FileText, color: "text-muted-foreground", bg: "bg-muted", label: "Draft" },
  failed: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Failed" },
  cancelled: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted", label: "Cancelled" },
};

const CONTENT_ICONS = {
  image: Image,
  video: Video,
  text: FileText,
  carousel: Layers,
  reel: Film,
  story: Circle,
};

const TABS = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "scheduled", label: "Scheduled" },
  { id: "failed", label: "Failed" },
];

function PostCard({ post }: { post: any }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const cancelPost = trpc.posts.cancel.useMutation({
    onSuccess: () => {
      toast.success("Post cancelled");
      utils.posts.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const status = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;
  const StatusIcon = status.icon;
  const ContentIcon = CONTENT_ICONS[post.contentType as keyof typeof CONTENT_ICONS] ?? FileText;
  const mediaUrls: string[] = post.mediaUrls ?? [];
  const platforms: any[] = post.platforms ?? [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-border/50 bg-card overflow-hidden"
    >
      {/* Media preview */}
      {mediaUrls.length > 0 && (
        <div className="relative h-40 bg-secondary overflow-hidden">
          <img
            src={mediaUrls[0]}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {mediaUrls.length > 1 && (
            <div className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground">
              +{mediaUrls.length - 1}
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Status + Content Type */}
        <div className="mb-3 flex items-center justify-between">
          <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", status.bg, status.color)}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ContentIcon className="h-3.5 w-3.5" />
            <span className="capitalize">{post.contentType}</span>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="mb-3 line-clamp-2 text-sm text-foreground/90">{post.caption}</p>
        )}

        {/* Platforms */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {platforms.map((pp: any) => {
            const config = PLATFORMS[pp.platform as Platform];
            if (!config) return null;
            return (
              <div
                key={pp.id}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                style={{ background: config.gradient ?? config.color }}
              >
                <span>{config.letter}</span>
                <span>{config.name.split(" ")[0]}</span>
              </div>
            );
          })}
        </div>

        {/* Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {post.status === "scheduled" && post.scheduledAt ? (
              <>
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(post.scheduledAt), "MMM d, h:mm a")}</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              </>
            )}
          </div>

          {post.status === "scheduled" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => cancelPost.mutate({ postId: post.id })}
              className="h-7 rounded-xl px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function UsageBanner({ usage }: { usage: any }) {
  const [, navigate] = useLocation();
  if (!usage || usage.unlimited) return null;

  const pct = Math.min(100, (usage.used / usage.limit) * 100);
  const isNearLimit = pct >= 80;
  const isAtLimit = pct >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mb-4 rounded-2xl border p-4",
        isAtLimit
          ? "border-destructive/30 bg-destructive/10"
          : isNearLimit
          ? "border-yellow-500/30 bg-yellow-500/10"
          : "border-border/50 bg-card"
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          Daily Usage — {usage.tier.replace("_", " ").toUpperCase()}
        </span>
        <span className={cn("text-xs font-bold", isAtLimit ? "text-destructive" : isNearLimit ? "text-yellow-400" : "text-primary")}>
          {usage.used}/{usage.limit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            background: isAtLimit
              ? "oklch(0.62 0.22 25)"
              : isNearLimit
              ? "oklch(0.72 0.18 60)"
              : "var(--gradient-primary)",
          }}
        />
      </div>
      {isAtLimit && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Limit reached for today</p>
          <Button
            size="sm"
            onClick={() => navigate("/subscription")}
            className="h-6 rounded-xl px-2 text-[10px]"
            style={{ background: "var(--gradient-primary)" }}
          >
            Upgrade
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default function Posts() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");

  const { data: usage } = trpc.posts.dailyUsage.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: posts, isLoading } = trpc.posts.list.useQuery(
    {
      status: activeTab === "all" ? undefined : activeTab,
      limit: 20,
      offset: 0,
    },
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated && !loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Sign in to view posts</h2>
        <Button onClick={() => (window.location.href = getLoginUrl())} style={{ background: "var(--gradient-primary)" }}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-4 pb-8 pt-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Posts</h1>
        <Button
          size="sm"
          onClick={() => navigate("/compose")}
          className="rounded-xl text-xs"
          style={{ background: "var(--gradient-primary)" }}
        >
          <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
          New Post
        </Button>
      </div>

      {/* Usage Banner */}
      <UsageBanner usage={usage} />

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-2xl bg-card p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-xl py-2 text-xs font-medium transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-shimmer h-48 rounded-2xl" />
          ))}
        </div>
      ) : !posts || posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center gap-4 py-16 text-center"
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "oklch(0.72 0.18 280 / 0.1)" }}
          >
            <BarChart3 className="h-8 w-8 text-primary/50" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No posts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first post to get started
            </p>
          </div>
          <Button
            onClick={() => navigate("/compose")}
            className="rounded-2xl"
            style={{ background: "var(--gradient-primary)" }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {posts.map((post) => (
              <PostCard key={post?.id} post={post} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
