import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  CONTENT_TYPES,
  ContentType,
  Platform,
  PLATFORMS,
  TIER_LIMITS,
  isContentTypeAllowed,
  isPlatformCountAllowed,
  isPlatformSupported,
} from "@/lib/platforms";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Upload,
  X,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Video,
  FileText,
  Layers,
  Film,
  Circle,
  Zap,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const CONTENT_TYPE_ICONS: Record<ContentType, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  text: FileText,
  carousel: Layers,
  reel: Film,
  story: Circle,
};

function UploadProgress({ progress }: { progress: number }) {
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-16 w-16">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="oklch(0.22 0.02 260)" strokeWidth="3" />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="oklch(0.72 0.18 280)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{progress}%</span>
        </div>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-4 w-1 rounded-full bg-primary"
            style={{ animation: `wave 1s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Uploading media...</p>
    </div>
  );
}

export default function Compose() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [contentType, setContentType] = useState<ContentType>("image");
  const [caption, setCaption] = useState("");
  const [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string; url?: string; key?: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: usageData } = trpc.posts.dailyUsage.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => {
        navigate("/posts");
      }, 2000);
    },
    onError: (err) => {
      toast.error(err.message);
      setIsSubmitting(false);
    },
  });

  const tier = (user as any)?.subscriptionTier ?? "trial";
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        return prev.filter((p) => p !== platform);
      }
      if (!isPlatformCountAllowed(tier, prev.length + 1)) {
        toast.error(`Your ${limits.label} plan allows up to ${limits.platforms} platforms. Upgrade for more.`);
        return prev;
      }
      if (!isPlatformSupported(platform, contentType)) {
        toast.error(`${PLATFORMS[platform].name} doesn't support ${CONTENT_TYPES[contentType].label} content.`);
        return prev;
      }
      return [...prev, platform];
    });
  };

  const handleContentTypeChange = (ct: ContentType) => {
    if (!isContentTypeAllowed(tier, ct)) {
      toast.error(`${CONTENT_TYPES[ct].label} content requires a Pro or Ultra Pro plan.`);
      return;
    }
    setContentType(ct);
    // Remove platforms that don't support this content type
    setSelectedPlatforms((prev) => prev.filter((p) => isPlatformSupported(p, ct)));
  };

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const maxFiles = contentType === "carousel" ? 10 : 1;
      const fileArray = Array.from(files).slice(0, maxFiles);

      const newFiles = fileArray.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setMediaFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));

      // Simulate upload progress
      setIsUploading(true);
      setUploadProgress(0);

      for (let i = 0; i <= 100; i += 10) {
        await new Promise((r) => setTimeout(r, 80));
        setUploadProgress(i);
      }

      // In production: upload to S3 via /api/upload
      const uploadedFiles = newFiles.map((f) => ({
        ...f,
        url: f.preview, // Use preview URL as placeholder
        key: `uploads/${Date.now()}-${f.file.name}`,
      }));

      setMediaFiles((prev) => {
        const existing = prev.filter((f) => !newFiles.find((nf) => nf.preview === f.preview));
        return [...existing, ...uploadedFiles].slice(0, maxFiles);
      });

      setIsUploading(false);
      setUploadProgress(0);
    },
    [contentType]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleSubmit = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform.");
      return;
    }
    if (contentType !== "text" && mediaFiles.length === 0) {
      toast.error("Please add media for this content type.");
      return;
    }
    if (isScheduling && !scheduledAt) {
      toast.error("Please select a schedule date and time.");
      return;
    }

    setIsSubmitting(true);

    createPost.mutate({
      caption,
      contentType,
      mediaUrls: mediaFiles.map((f) => f.url ?? f.preview),
      mediaKeys: mediaFiles.map((f) => f.key ?? ""),
      platforms: selectedPlatforms,
      scheduledAt: isScheduling && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    });
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Sign in to compose</h2>
        <Button onClick={() => (window.location.href = getLoginUrl())} style={{ background: "var(--gradient-primary)" }}>
          Sign In
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "oklch(0.72 0.18 280 / 0.2)" }}
        >
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-xl font-bold text-foreground">
            {isScheduling ? "Post scheduled!" : "Post published!"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Redirecting to your posts...
          </p>
        </motion.div>
      </div>
    );
  }

  const canSchedule = limits.canSchedule;
  const dailyLimitReached = usageData && !usageData.unlimited && usageData.remaining === 0;

  return (
    <div className="min-h-dvh px-4 pb-8 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Create Post</h1>
          {usageData && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {usageData.unlimited
                ? "Unlimited posts"
                : `${usageData.used}/${usageData.limit} posts today`}
            </p>
          )}
        </div>
        {usageData && !usageData.unlimited && (
          <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: usageData.remaining === 0 ? "oklch(0.62 0.22 25)" : "oklch(0.72 0.18 280)" }}
            />
            <span className="text-xs font-medium text-foreground">
              {usageData.remaining} left
            </span>
          </div>
        )}
      </div>

      {dailyLimitReached && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-foreground">Daily limit reached</p>
            <p className="text-xs text-muted-foreground">
              Upgrade your plan to post more today.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/subscription")}
            className="ml-auto shrink-0 rounded-xl text-xs"
            style={{ background: "var(--gradient-primary)" }}
          >
            Upgrade
          </Button>
        </motion.div>
      )}

      {/* Content Type Selector */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Content Type
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(CONTENT_TYPES) as ContentType[]).map((ct) => {
            const allowed = isContentTypeAllowed(tier, ct);
            const Icon = CONTENT_TYPE_ICONS[ct];
            const isSelected = contentType === ct;

            return (
              <motion.button
                key={ct}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleContentTypeChange(ct)}
                className={cn(
                  "relative flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 transition-all",
                  isSelected
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : allowed
                    ? "border-border/50 bg-card text-muted-foreground hover:border-border hover:text-foreground"
                    : "border-border/30 bg-card/50 text-muted-foreground/40"
                )}
              >
                {!allowed && (
                  <Lock className="absolute right-1.5 top-1.5 h-2.5 w-2.5 text-muted-foreground/40" />
                )}
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-medium">{CONTENT_TYPES[ct].label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Platform Selector */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Platforms{" "}
          {limits.platforms && (
            <span className="normal-case font-normal text-muted-foreground/60">
              (max {limits.platforms})
            </span>
          )}
        </p>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(PLATFORMS) as Platform[]).map((platform) => {
            const config = PLATFORMS[platform];
            const isSelected = selectedPlatforms.includes(platform);
            const supported = isPlatformSupported(platform, contentType);
            const platformLimitReached =
              !isSelected &&
              limits.platforms !== null &&
              selectedPlatforms.length >= limits.platforms;

            return (
              <motion.button
                key={platform}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePlatformToggle(platform)}
                disabled={!supported || platformLimitReached}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all",
                  isSelected
                    ? "border-transparent ring-2 ring-primary/60"
                    : supported && !platformLimitReached
                    ? "border-border/50 bg-card hover:border-border"
                    : "border-border/20 bg-card/30 opacity-40"
                )}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white"
                  style={{ background: config.gradient ?? config.color }}
                >
                  {config.letter}
                </div>
                <span className="text-[9px] font-medium text-muted-foreground leading-tight text-center">
                  {config.name.split(" ")[0]}
                </span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary"
                  >
                    <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />
                  </motion.div>
                )}
                {!supported && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60">
                    <X className="h-3 w-3 text-muted-foreground/60" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
        {selectedPlatforms.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-xs text-muted-foreground"
          >
            Publishing to: {selectedPlatforms.map((p) => PLATFORMS[p].name).join(", ")}
          </motion.p>
        )}
      </div>

      {/* Caption */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Caption
        </p>
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's on your mind? Write your caption here..."
          className="min-h-[100px] resize-none rounded-2xl border-border/50 bg-card text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20"
          maxLength={3000}
        />
        <div className="mt-1 flex justify-between">
          <span className="text-[10px] text-muted-foreground/50">
            {selectedPlatforms.length > 0 &&
              `Max: ${Math.min(...selectedPlatforms.map((p) => PLATFORMS[p].maxCaptionLength))} chars`}
          </span>
          <span className="text-[10px] text-muted-foreground/50">{caption.length}/3000</span>
        </div>
      </div>

      {/* Media Upload */}
      {contentType !== "text" && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Media
          </p>

          {isUploading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-8">
              <UploadProgress progress={uploadProgress} />
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all",
                mediaFiles.length > 0
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              {mediaFiles.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {mediaFiles.map((f, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
                        {f.file.type.startsWith("video/") ? (
                          <div className="flex h-full items-center justify-center bg-secondary">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        ) : (
                          <img
                            src={f.preview}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMediaFiles((prev) => prev.filter((_, idx) => idx !== i));
                          }}
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/80"
                        >
                          <X className="h-3 w-3 text-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Click to add more</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: "oklch(0.72 0.18 280 / 0.15)" }}
                  >
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Drop files here or tap to upload
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {contentType === "video" || contentType === "reel"
                        ? "MP4, MOV up to 100MB"
                        : "JPG, PNG, GIF up to 10MB"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={
              contentType === "video" || contentType === "reel"
                ? "video/*"
                : "image/*"
            }
            multiple={contentType === "carousel"}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
      )}

      {/* Schedule Toggle */}
      {canSchedule ? (
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Schedule
            </p>
            <button
              onClick={() => setIsScheduling(!isScheduling)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                isScheduling ? "bg-primary" : "bg-secondary"
              )}
            >
              <motion.div
                animate={{ x: isScheduling ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>
          <AnimatePresence>
            {isScheduling && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  className="w-full rounded-2xl border border-border/50 bg-card px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mb-5">
          <div
            className="flex items-center gap-3 rounded-2xl border border-border/30 bg-card/50 p-4 cursor-pointer"
            onClick={() => navigate("/subscription")}
          >
            <Clock className="h-5 w-5 text-muted-foreground/50" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground/70">Scheduling</p>
              <p className="text-xs text-muted-foreground/50">Available on Pro & Ultra Pro</p>
            </div>
            <Lock className="h-4 w-4 text-muted-foreground/40" />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || dailyLimitReached || isUploading}
          className="w-full rounded-2xl py-6 text-base font-semibold"
          style={{ background: "var(--gradient-primary)" }}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-white"
                    style={{ animation: `wave 0.8s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              {isScheduling ? "Scheduling..." : "Publishing..."}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isScheduling ? <Calendar className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
              {isScheduling ? "Schedule Post" : "Publish Now"}
            </div>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
