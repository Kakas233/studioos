/**
 * Environment variable validation.
 * Import this in server-side code to fail fast if required vars are missing.
 */

const requiredServerVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const optionalServerVars = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "ANTHROPIC_API_KEY",
  "CRON_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_VPS_URL",
] as const;

function validateEnv() {
  const missing: string[] = [];

  for (const key of requiredServerVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join("\n")}\n\nCheck your .env.local file.`
    );
  }

  // Warn about optional vars in development
  if (process.env.NODE_ENV === "development") {
    for (const key of optionalServerVars) {
      if (!process.env[key]) {
        console.warn(`[env] Optional var ${key} is not set — related features will be disabled`);
      }
    }
  }
}

// Run validation on import
validateEnv();

export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://getstudioos.com",
  VPS_URL: process.env.NEXT_PUBLIC_VPS_URL,
} as const;
