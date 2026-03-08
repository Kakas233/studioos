/**
 * Single source of truth for all cam platform data.
 * Fixes issue #30: eliminates platform constant duplication across 6+ files.
 */

export interface PlatformConfig {
  /** Display name */
  name: string;
  /** Short code used by CamGirlFinder API */
  cgfCode: string;
  /** Default token-to-USD rate */
  defaultTokenRate: number;
  /** Brand color (hex) */
  color: string;
  /** Background color for badges */
  bgColor: string;
  /** Whether the platform is supported for member alerts */
  memberAlertSupport: "full" | "beta" | "none";
}

export const PLATFORMS: Record<string, PlatformConfig> = {
  MyFreeCams: {
    name: "MyFreeCams",
    cgfCode: "mfc",
    defaultTokenRate: 0.05,
    color: "#e11d48",
    bgColor: "rgba(225, 29, 72, 0.15)",
    memberAlertSupport: "full",
  },
  Chaturbate: {
    name: "Chaturbate",
    cgfCode: "cb",
    defaultTokenRate: 0.05,
    color: "#f97316",
    bgColor: "rgba(249, 115, 22, 0.15)",
    memberAlertSupport: "beta",
  },
  StripChat: {
    name: "StripChat",
    cgfCode: "sc",
    defaultTokenRate: 0.05,
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.15)",
    memberAlertSupport: "full",
  },
  BongaCams: {
    name: "BongaCams",
    cgfCode: "bc",
    defaultTokenRate: 0.02,
    color: "#ec4899",
    bgColor: "rgba(236, 72, 153, 0.15)",
    memberAlertSupport: "beta",
  },
  LiveJasmin: {
    name: "LiveJasmin",
    cgfCode: "lj",
    defaultTokenRate: 1.0,
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.15)",
    memberAlertSupport: "beta",
  },
  Cam4: {
    name: "Cam4",
    cgfCode: "c4",
    defaultTokenRate: 0.1,
    color: "#14b8a6",
    bgColor: "rgba(20, 184, 166, 0.15)",
    memberAlertSupport: "none",
  },
  CamSoda: {
    name: "CamSoda",
    cgfCode: "cs",
    defaultTokenRate: 0.05,
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.15)",
    memberAlertSupport: "full",
  },
  "Flirt4Free": {
    name: "Flirt4Free",
    cgfCode: "f4f",
    defaultTokenRate: 0.03,
    color: "#a855f7",
    bgColor: "rgba(168, 85, 247, 0.15)",
    memberAlertSupport: "none",
  },
} as const;

/** Platform names as a typed array */
export const PLATFORM_NAMES = Object.keys(PLATFORMS) as (keyof typeof PLATFORMS)[];

/** Total number of supported platforms */
export const PLATFORM_COUNT = PLATFORM_NAMES.length; // 8

/** Map CGF codes back to platform names */
export const CGF_TO_PLATFORM: Record<string, string> = Object.fromEntries(
  Object.entries(PLATFORMS).map(([name, config]) => [config.cgfCode, name])
);

/** Get platform config by name (case-insensitive) */
export function getPlatform(name: string): PlatformConfig | undefined {
  // Try exact match first
  if (PLATFORMS[name]) return PLATFORMS[name];
  // Try case-insensitive
  const key = Object.keys(PLATFORMS).find(
    (k) => k.toLowerCase() === name.toLowerCase()
  );
  return key ? PLATFORMS[key] : undefined;
}

/** Get platform color by name */
export function getPlatformColor(name: string): string {
  return getPlatform(name)?.color ?? "#6b7280";
}

/** Platforms that support member alerts (full + beta) */
export const MEMBER_ALERT_PLATFORMS = PLATFORM_NAMES.filter(
  (name) => PLATFORMS[name].memberAlertSupport !== "none"
);

/** Platforms with beta-level member alert support */
export const BETA_ALERT_PLATFORMS = PLATFORM_NAMES.filter(
  (name) => PLATFORMS[name].memberAlertSupport === "beta"
);
