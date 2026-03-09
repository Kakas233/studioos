/**
 * Application configuration.
 * Cleaned up: removed stale pricing (fixes #36), renamed storage keys (fixes #8).
 * Pricing is now solely in lib/pricing.ts.
 */

export const APP_CONFIG = {
  appName: "StudioOS",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://getstudioos.com",
  supportEmail: "hello@getstudioos.com",
  telegramChannel: "https://t.me/StudioOS_updates", // Fix #12: consistent casing

  scraper: {
    intervalMinutes: 15,
    batchSize: 10,
    batchDelayMs: 2000,
    timeoutMs: 10000,
  },

  rateLimits: {
    login: { maxAttempts: 5, windowMinutes: 15 },
    api: { maxRequests: 100, windowMinutes: 1 },
    forgotPassword: { maxAttempts: 3, windowMinutes: 15 },
  },

  session: {
    maxAgeHours: 24,
    superAdminMaxAgeHours: 8,
  },

  roles: ["owner", "admin", "operator", "model", "accountant"] as const,

  roleHierarchy: {
    model: 0,
    operator: 1,
    accountant: 1,
    admin: 2,
    owner: 3,
  } as Record<string, number>,
} as const;

/** Storage keys — renamed from legacy icon_ prefix (fixes #8) */
export const STORAGE_KEYS = {
  session: "studioos_session",
  superAdminReturn: "studioos_superadmin_return",
  cookieConsent: "studioos_cookie_consent",
} as const;

/** Role display colors — match original exactly */
export const ROLE_COLORS: Record<string, string> = {
  owner: "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/20",
  admin: "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/20",
  operator: "bg-amber-500/20 text-amber-400 border-amber-500/20",
  model: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
  accountant: "bg-blue-500/20 text-blue-400 border-blue-500/20",
};
