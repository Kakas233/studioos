// Centralized pricing data used across landing page, pricing page, and checkout

export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For solo studios getting started',
    modelsIncluded: 1,
    extraModelPrice: 20,
    monthly: 29,
    features: [
      { text: '1 model included', included: true },
      { text: 'Auto stream tracking (all 8+ cam sites)', included: true },
      { text: 'Shift scheduling & room management', included: true },
      { text: 'Earnings & payout tracking', included: true },
      { text: 'Model Insights & analytics', included: true },
      { text: 'Live stream monitor', included: true },
      { text: 'User management', included: true },
      { text: 'Data backup & CSV export', included: true },
      { text: 'Chat', included: false },
      { text: 'Model & Member Lookup', included: false },
      { text: 'Member Alerts', included: false },
    ],
    color: '#A8A49A',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For growing studios',
    modelsIncluded: 3,
    extraModelPrice: 15,
    monthly: 59,
    features: [
      { text: 'Everything in Starter, plus:', included: true, bold: true },
      { text: 'Up to 3 models', included: true },
      { text: 'Model Lookup', included: true },
      { text: 'Member Lookup', included: true },
      { text: 'Team chat (3 channels)', included: true },
      { text: 'Multi-currency support', included: true },
      { text: 'Custom studio logo', included: true },
      { text: 'Member Alerts', included: false },
      { text: 'Accountant role', included: false },
    ],
    color: '#C9A84C',
    popular: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    tagline: 'For professional studios',
    modelsIncluded: 5,
    extraModelPrice: 12,
    monthly: 99,
    features: [
      { text: 'Everything in Pro, plus:', included: true, bold: true },
      { text: 'Up to 5 models', included: true },
      { text: 'Member Alerts (Telegram)', included: true },
      { text: 'Accountant role access', included: true },
      { text: 'Unlimited chat channels', included: true },
      { text: 'Priority support', included: true },
    ],
    color: '#A855F7',
    popular: false,
  },
];

export const BILLING_CYCLES = [
  { id: 'monthly', label: '1 Month', months: 1, discount: 0 },
  { id: 'quarterly', label: '3 Months', months: 3, discount: 0.10 },
  { id: 'biannual', label: '6 Months', months: 6, discount: 0.20 },
];

export function getPrice(monthlyPrice: number, cycle: string) {
  const c = BILLING_CYCLES.find(b => b.id === cycle) || BILLING_CYCLES[0];
  const discountedMonthly = monthlyPrice * (1 - c.discount);
  const total = Math.round(discountedMonthly * c.months);
  const savings = Math.round(monthlyPrice * c.months - total);
  return { monthly: Math.round(discountedMonthly), total, savings, months: c.months };
}

export const TRIAL_DAYS = 7;
export const GRACE_PERIOD_DAYS = 5;

export const FEATURE_COMPARISON = [
  { feature: 'Models included', starter: '1', pro: '3', elite: '5' },
  { feature: 'Extra models', starter: '$20/mo each', pro: '$15/mo each', elite: '$12/mo each' },
  { feature: 'Cam sites', starter: '8+', pro: '8+', elite: '8+' },
  { feature: 'Auto stream tracking', starter: true, pro: true, elite: true },
  { feature: 'Overlap detection', starter: true, pro: true, elite: true },
  { feature: 'Shift scheduling', starter: true, pro: true, elite: true },
  { feature: 'Room management', starter: true, pro: true, elite: true },
  { feature: 'User management', starter: true, pro: true, elite: true },
  { feature: 'Earnings tracking', starter: true, pro: true, elite: true },
  { feature: 'Payout management', starter: true, pro: true, elite: true },
  { feature: 'Model Insights & AI', starter: true, pro: true, elite: true },
  { feature: 'Live stream monitor', starter: true, pro: true, elite: true },
  { feature: 'Data backup & CSV export', starter: true, pro: true, elite: true },
  { feature: 'Model Lookup', starter: false, pro: true, elite: true },
  { feature: 'Member Lookup', starter: false, pro: true, elite: true },
  { feature: 'Chat channels', starter: false, pro: '3', elite: 'Unlimited' },
  { feature: 'Multi-currency', starter: false, pro: true, elite: true },
  { feature: 'Custom studio logo', starter: false, pro: true, elite: true },
  { feature: 'Member Alerts', starter: false, pro: false, elite: true },
  { feature: 'Accountant role', starter: false, pro: false, elite: true },
  { feature: 'Priority support', starter: false, pro: false, elite: true },
];
