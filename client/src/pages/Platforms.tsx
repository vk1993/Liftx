import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { PLATFORMS, Platform } from "@/lib/platforms";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Check,
  Plus,
  Trash2,
  Lock,
  ExternalLink,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLATFORM_OAUTH_URLS: Record<Platform, string> = {
  linkedin: "https://www.linkedin.com/oauth/v2/authorization",
  instagram: "https://api.instagram.com/oauth/authorize",
  x: "https://twitter.com/i/oauth2/authorize",
  facebook: "https://www.facebook.com/v18.0/dialog/oauth",
  tiktok: "https://www.tiktok.com/auth/authorize/",
};

export default function Platforms() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: connected, isLoading } = trpc.platforms.connected.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const connectMutation = trpc.platforms.connect.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`${PLATFORMS[vars.platform].name} connected!`);
      utils.platforms.connected.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const disconnectMutation = trpc.platforms.disconnect.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`${PLATFORMS[vars.platform].name} disconnected`);
      utils.platforms.connected.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleConnect = (platform: Platform) => {
    // In production: redirect to OAuth flow
    // For demo: simulate a connected account
    connectMutation.mutate({
      platform,
      platformUsername: `@${(user as any)?.name?.toLowerCase().replace(/\s/g, "") ?? "user"}`,
      platformDisplayName: (user as any)?.name ?? "User",
      platformAvatarUrl: (user as any)?.avatarUrl,
    });
  };

  const handleDisconnect = (platform: Platform) => {
    disconnectMutation.mutate({ platform });
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Sign in to manage platforms</h2>
        <Button onClick={() => (window.location.href = getLoginUrl())} style={{ background: "var(--gradient-primary)" }}>
          Sign In
        </Button>
      </div>
    );
  }

  const connectedPlatforms = new Set(connected?.map((c) => c.platform) ?? []);

  return (
    <div className="min-h-dvh px-4 pb-8 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Platforms</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your social media accounts to start publishing
        </p>
      </div>

      {/* Connection Status Summary */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "oklch(0.72 0.18 280 / 0.15)" }}
        >
          <Wifi className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {connectedPlatforms.size} of 5 platforms connected
          </p>
          <p className="text-xs text-muted-foreground">
            Connect more platforms to expand your reach
          </p>
        </div>
        <div className="flex gap-1">
          {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
            <div
              key={p}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                connectedPlatforms.has(p) ? "opacity-100" : "opacity-20"
              )}
              style={{ background: PLATFORMS[p].gradient ?? PLATFORMS[p].color }}
            />
          ))}
        </div>
      </div>

      {/* Platform Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-shimmer h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(Object.keys(PLATFORMS) as Platform[]).map((platform, i) => {
            const config = PLATFORMS[platform];
            const isConnected = connectedPlatforms.has(platform);
            const connectedAccount = connected?.find((c) => c.platform === platform);
            const isConnecting = connectMutation.isPending && connectMutation.variables?.platform === platform;
            const isDisconnecting = disconnectMutation.isPending && disconnectMutation.variables?.platform === platform;

            return (
              <motion.div
                key={platform}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  "relative overflow-hidden rounded-2xl border transition-all",
                  isConnected
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/50 bg-card"
                )}
              >
                {/* Gradient accent bar */}
                <div
                  className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                  style={{ background: config.gradient ?? config.color }}
                />

                <div className="flex items-center gap-4 p-4 pl-5">
                  {/* Platform Icon */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                    style={{ background: config.gradient ?? config.color }}
                  >
                    {config.letter}
                  </div>

                  {/* Platform Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{config.name}</p>
                      {isConnected && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          Connected
                        </span>
                      )}
                    </div>
                    {isConnected && connectedAccount?.platformUsername ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {connectedAccount.platformUsername}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {config.supportedContentTypes.join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  {isConnected ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect(platform)}
                      disabled={isDisconnecting}
                      className="h-8 shrink-0 rounded-xl px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      {isDisconnecting ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="mr-1 h-3 w-3" />
                          Remove
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(platform)}
                      disabled={isConnecting}
                      className="h-8 shrink-0 rounded-xl px-3 text-xs"
                      style={{ background: config.gradient ?? config.color }}
                    >
                      {isConnecting ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                      ) : (
                        <>
                          <Plus className="mr-1 h-3 w-3 text-white" />
                          <span className="text-white">Connect</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Supported content types */}
                <div className="border-t border-border/30 px-5 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {config.supportedContentTypes.map((ct) => (
                      <span
                        key={ct}
                        className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground"
                      >
                        {ct}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 rounded-2xl border border-border/30 bg-card/50 p-4"
      >
        <div className="flex items-start gap-3">
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Platform connections use OAuth 2.0 for secure authentication. Your credentials are never stored. In production, you'll be redirected to each platform's official login page.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
