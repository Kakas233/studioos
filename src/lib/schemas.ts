import { z } from "zod";

export const studioSchema = z.object({
  name: z
    .string()
    .min(2, "Studio name must be at least 2 characters")
    .max(100),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Only lowercase letters, numbers, and hyphens allowed"
    ),
  timezone: z.string().optional(),
  primaryCurrency: z.string().length(3).optional(),
});

export const modelSchema = z.object({
  fullName: z.string().min(2).max(100),
  studioPercentage: z.number().min(0).max(100),
  weeklyGoalHours: z.number().min(1).max(168),
  status: z.enum(["active", "inactive"]),
});

export const shiftSchema = z.object({
  modelId: z.string().uuid(),
  operatorId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: z
    .enum([
      "scheduled",
      "completed",
      "no_show",
      "cancelled",
      "pending_approval",
    ])
    .optional(),
});

export const camAccountSchema = z.object({
  modelId: z.string().uuid(),
  platform: z.string().min(2),
  username: z.string().min(2).max(100),
  isActive: z.boolean().optional(),
});

export const signupSchema = z.object({
  studioName: z.string().min(2).max(100),
  ownerName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
  subdomain: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, "You must agree to the terms"),
});

export const earningsSchema = z.object({
  modelId: z.string().uuid(),
  camAccountId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  grossUsd: z.number().min(0),
  studioCutUsd: z.number().min(0),
  modelNetUsd: z.number().min(0),
  isEstimated: z.boolean().optional(),
});

export const globalSettingsSchema = z.object({
  secondary_currency: z.string().max(10).optional(),
  exchange_rate: z.number().min(0).max(100000).optional(),
  exchange_rate_mode: z.enum(["manual", "auto"]).optional(),
  payout_frequency: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  mfc_token_rate: z.number().min(0).max(1).optional(),
  cb_token_rate: z.number().min(0).max(1).optional(),
  sc_token_rate: z.number().min(0).max(1).optional(),
  bc_token_rate: z.number().min(0).max(1).optional(),
  c4_token_rate: z.number().min(0).max(1).optional(),
  cs_token_rate: z.number().min(0).max(1).optional(),
  f4f_token_rate: z.number().min(0).max(1).optional(),
  lj_token_rate: z.number().min(0).max(1).optional(),
}).strict();

export const roomSchema = z.object({
  name: z.string().min(1, "Room name is required").max(100),
  is_active: z.boolean().optional(),
}).strict();

export const accountUpdateSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().max(100).optional(),
  role: z.enum(["owner", "admin", "operator", "model", "accountant"]).optional(),
  is_active: z.boolean().optional(),
  cut_percentage: z.number().min(0).max(100).optional(),
  weekly_goal_hours: z.number().min(0).max(168).optional(),
  weekly_goal_enabled: z.boolean().optional(),
  works_alone: z.boolean().optional(),
  onboarding_dismissed: z.boolean().optional(),
  onboarding_completed_steps: z.array(z.string()).optional(),
}).strict();
