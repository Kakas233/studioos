/**
 * Single source of truth for pricing data.
 * Fixes issues #5 (inconsistency) and #36 (stale config.jsx pricing).
 * Canonical prices: Starter $29, Pro $59, Elite $99.
 */

export interface Plan {
  id: "starter" | "pro" | "elite";
  name: string;
  monthly: number;
  modelsIncluded: number;
  extraModelPrice: number;
  color: string;
  popular: boolean;
  features: string[];
}

export interface BillingCycle {
  id: "monthly" | "quarterly" | "biannual";
  label: string;
  months: number;
  discount: number;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthly: 29,
    modelsIncluded: 1,
    extraModelPrice: 20,
    color: "#A8A49A",
    popular: false,
    features: [
      "1 model included",
      "Stream time tracking",
      "Shift scheduling",
      "Basic earnings tracking",
      "Member lookup",
      "Model lookup",
      "1 chat channel",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 59,
    modelsIncluded: 3,
    extraModelPrice: 15,
    color: "#C9A84C",
    popular: true,
    features: [
      "3 models included",
      "Everything in Starter",
      "Auto stream tracking",
      "Multi-site earnings",
      "Financial tracking & payouts",
      "Model Insights & AI Coach",
      "3 chat channels",
      "Priority support",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    monthly: 99,
    modelsIncluded: 5,
    extraModelPrice: 12,
    color: "#A855F7",
    popular: false,
    features: [
      "5 models included",
      "Everything in Pro",
      "Member alerts (Telegram)",
      "Accountant role",
      "Unlimited chat channels",
      "Advanced analytics",
      "Data export & backup",
      "Premium support",
    ],
  },
];

export const BILLING_CYCLES: BillingCycle[] = [
  { id: "monthly", label: "Monthly", months: 1, discount: 0 },
  { id: "quarterly", label: "Quarterly", months: 3, discount: 0.1 },
  { id: "biannual", label: "Biannual", months: 6, discount: 0.2 },
];

export const TRIAL_DAYS = 7;
export const GRACE_PERIOD_DAYS = 5;

/** Calculate price with billing cycle discount */
export function getPrice(monthlyPrice: number, cycle: BillingCycle): number {
  return Math.round(monthlyPrice * (1 - cycle.discount) * 100) / 100;
}

/** Get total price for a billing cycle */
export function getTotalPrice(monthlyPrice: number, cycle: BillingCycle): number {
  return Math.round(getPrice(monthlyPrice, cycle) * cycle.months * 100) / 100;
}

/** Stripe Price IDs — same Stripe account, same IDs */
export const STRIPE_PRICES: Record<string, Record<string, string>> = {
  starter: {
    monthly: "price_1SyRnQPuqchAsH6j0s0qFp9m",
    quarterly: "price_1SyRnPPuqchAsH6jEhGmjy34",
    biannual: "price_1SyRnPPuqchAsH6j68t0qSmV",
  },
  pro: {
    monthly: "price_1SyRnPPuqchAsH6jlmgsqgzu",
    quarterly: "price_1SyRnQPuqchAsH6jM24gdITJ",
    biannual: "price_1SyRnPPuqchAsH6jJKbfaI90",
  },
  elite: {
    monthly: "price_1SyRnQPuqchAsH6jwaCpuXtZ",
    quarterly: "price_1SyRnPPuqchAsH6jIoRDaxJD",
    biannual: "price_1SyRnPPuqchAsH6j0GAUyBoh",
  },
};

/** Stripe Price IDs for extra model add-ons */
export const STRIPE_EXTRA_MODEL_PRICES: Record<string, string> = {
  starter: "price_1T2OKWPuqchAsH6jvfEGKalJ",
  pro: "price_1T2OKWPuqchAsH6jHGqxvskU",
  elite: "price_1T2OKWPuqchAsH6jV17ASg3i",
};

/** Model limits per tier */
export const MODEL_LIMITS: Record<string, number> = {
  free: 1,
  starter: 1,
  pro: 3,
  elite: 5,
};

/** Tier hierarchy for comparison */
export const TIER_ORDER: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  elite: 3,
};

/** Check if a tier meets a required tier level */
export function tierMeetsRequirement(
  currentTier: string,
  requiredTier: string
): boolean {
  return (TIER_ORDER[currentTier] ?? 0) >= (TIER_ORDER[requiredTier] ?? 0);
}

/** Feature comparison table for pricing page */
export const FEATURE_COMPARISON = [
  { feature: "Models Included", starter: "1", pro: "3", elite: "5" },
  { feature: "Extra Model Cost", starter: "$20/mo", pro: "$15/mo", elite: "$12/mo" },
  { feature: "Stream Time Tracking", starter: true, pro: true, elite: true },
  { feature: "Auto Stream Tracking", starter: false, pro: true, elite: true },
  { feature: "Shift Scheduling", starter: true, pro: true, elite: true },
  { feature: "Basic Earnings", starter: true, pro: true, elite: true },
  { feature: "Multi-Site Earnings", starter: false, pro: true, elite: true },
  { feature: "Financial Tracking", starter: false, pro: true, elite: true },
  { feature: "Payouts", starter: false, pro: true, elite: true },
  { feature: "Model Insights & AI", starter: false, pro: true, elite: true },
  { feature: "Member Lookup", starter: true, pro: true, elite: true },
  { feature: "Model Lookup", starter: true, pro: true, elite: true },
  { feature: "Model Search", starter: false, pro: true, elite: true },
  { feature: "Member Alerts", starter: false, pro: false, elite: true },
  { feature: "Accountant Role", starter: false, pro: false, elite: true },
  { feature: "Chat Channels", starter: "1", pro: "3", elite: "Unlimited" },
  { feature: "Data Export", starter: false, pro: false, elite: true },
  { feature: "Live Stream Monitor", starter: true, pro: true, elite: true },
  { feature: "Room Management", starter: true, pro: true, elite: true },
  { feature: "Support", starter: "Email", pro: "Priority", elite: "Premium" },
];
