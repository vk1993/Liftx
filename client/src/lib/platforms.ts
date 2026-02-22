export type Platform = "linkedin" | "instagram" | "x" | "facebook" | "tiktok";
export type ContentType = "image" | "video" | "carousel" | "text" | "reel" | "story";
export type SubscriptionTier = "trial" | "pro" | "ultra_pro";

export interface PlatformConfig {
  id: Platform;
  name: string;
  color: string;
  gradient?: string;
  textColor: string;
  letter: string;
  supportedContentTypes: ContentType[];
  maxCaptionLength: number;
  maxMediaCount: number;
  supportsScheduling: boolean;
}

export const PLATFORMS: Record<Platform, PlatformConfig> = {
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    textColor: "#fff",
    letter: "in",
    supportedContentTypes: ["text", "image", "carousel", "video"],
    maxCaptionLength: 3000,
    maxMediaCount: 9,
    supportsScheduling: true,
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    gradient: "linear-gradient(135deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)",
    color: "#E1306C",
    textColor: "#fff",
    letter: "ig",
    supportedContentTypes: ["image", "carousel", "video", "reel", "story"],
    maxCaptionLength: 2200,
    maxMediaCount: 10,
    supportsScheduling: true,
  },
  x: {
    id: "x",
    name: "X (Twitter)",
    color: "#1a1a1a",
    textColor: "#fff",
    letter: "𝕏",
    supportedContentTypes: ["text", "image", "video"],
    maxCaptionLength: 280,
    maxMediaCount: 4,
    supportsScheduling: true,
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    color: "#1877F2",
    textColor: "#fff",
    letter: "f",
    supportedContentTypes: ["text", "image", "carousel", "video", "story"],
    maxCaptionLength: 63206,
    maxMediaCount: 10,
    supportsScheduling: true,
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    gradient: "linear-gradient(135deg, #010101, #69C9D0, #EE1D52)",
    color: "#010101",
    textColor: "#fff",
    letter: "tt",
    supportedContentTypes: ["video", "reel"],
    maxCaptionLength: 2200,
    maxMediaCount: 1,
    supportsScheduling: true,
  },
};

export const CONTENT_TYPES: Record<ContentType, { label: string; icon: string; description: string }> = {
  image: { label: "Image", icon: "🖼️", description: "Single or multiple photos" },
  video: { label: "Video", icon: "🎬", description: "Video content" },
  carousel: { label: "Carousel", icon: "🎠", description: "Multiple images/slides" },
  text: { label: "Text", icon: "📝", description: "Text-only post" },
  reel: { label: "Reel", icon: "🎭", description: "Short-form vertical video" },
  story: { label: "Story", icon: "⭕", description: "24-hour disappearing content" },
};

export const TIER_LIMITS: Record<SubscriptionTier, {
  dailyPosts: number | null;
  platforms: number | null;
  contentTypes: ContentType[];
  canSchedule: boolean;
  hasAnalytics: boolean;
  label: string;
  color: string;
}> = {
  trial: {
    dailyPosts: 2,
    platforms: 2,
    contentTypes: ["image"],
    canSchedule: false,
    hasAnalytics: false,
    label: "Trial",
    color: "oklch(0.55 0.02 260)",
  },
  pro: {
    dailyPosts: 50,
    platforms: 5,
    contentTypes: ["image", "video", "carousel", "text", "reel", "story"],
    canSchedule: true,
    hasAnalytics: false,
    label: "Pro",
    color: "oklch(0.72 0.18 280)",
  },
  ultra_pro: {
    dailyPosts: null,
    platforms: null,
    contentTypes: ["image", "video", "carousel", "text", "reel", "story"],
    canSchedule: true,
    hasAnalytics: true,
    label: "Ultra Pro",
    color: "oklch(0.72 0.18 60)",
  },
};

export function isPlatformSupported(platform: Platform, contentType: ContentType): boolean {
  return PLATFORMS[platform].supportedContentTypes.includes(contentType);
}

export function isContentTypeAllowed(tier: SubscriptionTier, contentType: ContentType): boolean {
  return TIER_LIMITS[tier].contentTypes.includes(contentType);
}

export function isPlatformCountAllowed(tier: SubscriptionTier, count: number): boolean {
  const limit = TIER_LIMITS[tier].platforms;
  return limit === null || count <= limit;
}
