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
