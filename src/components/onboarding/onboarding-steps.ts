/**
 * Role-based onboarding steps.
 * Each step has: id, title, description (optional), page (optional link).
 * Steps are different per role so users only see what's relevant to them.
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description?: string;
  page?: string;
}

const OWNER_STEPS: OnboardingStep[] = [
  {
    id: "explore_dashboard",
    title: "Explore your Dashboard",
    description:
      "Get familiar with your studio overview and key metrics.",
    page: "Dashboard",
  },
  {
    id: "add_room",
    title: "Create your first room",
    description: "Rooms help organize your models and shifts.",
    page: "Rooms",
  },
  {
    id: "invite_team",
    title: "Invite a team member",
    description:
      "Add operators, models, or admins to your studio.",
    page: "UsersManagement",
  },
  {
    id: "add_cam_account",
    title: "Link a cam account",
    description:
      "Go to Users, select a model, and add their cam site usernames.",
    page: "UsersManagement",
  },
  {
    id: "configure_settings",
    title: "Set up token rates & currency",
    description:
      "Configure your site-specific token rates and payout currency.",
    page: "AdminSettings",
  },
  {
    id: "schedule_shift",
    title: "Schedule a shift",
    description: "Create your first shift for a model.",
    page: "Schedule",
  },
];

const ADMIN_STEPS: OnboardingStep[] = [
  {
    id: "explore_dashboard",
    title: "Explore the Dashboard",
    description:
      "See the studio overview, revenue, and live status.",
    page: "Dashboard",
  },
  {
    id: "invite_team",
    title: "Invite a team member",
    description: "Add operators or models to the studio.",
    page: "UsersManagement",
  },
  {
    id: "add_cam_account",
    title: "Link a cam account to a model",
    description:
      "Open a model profile and add their cam site usernames.",
    page: "UsersManagement",
  },
  {
    id: "schedule_shift",
    title: "Schedule a shift",
    description: "Go to Schedule and create a shift.",
    page: "Schedule",
  },
  {
    id: "configure_settings",
    title: "Review studio settings",
    description:
      "Check token rates, currency, and payout settings.",
    page: "AdminSettings",
  },
];

const OPERATOR_STEPS: OnboardingStep[] = [
  {
    id: "explore_dashboard",
    title: "Explore your Dashboard",
    description:
      "See your assigned models and upcoming shifts.",
    page: "Dashboard",
  },
  {
    id: "check_schedule",
    title: "Check your schedule",
    description:
      "See your shifts and the models assigned to you.",
    page: "Schedule",
  },
  {
    id: "report_earnings",
    title: "Report earnings for a shift",
    description:
      "After a shift, go to Accounting and enter the earnings.",
    page: "Accounting",
  },
  {
    id: "join_chat",
    title: "Join the team chat",
    description: "Say hello to your team!",
    page: "Chat",
  },
];

const MODEL_STEPS: OnboardingStep[] = [
  {
    id: "explore_dashboard",
    title: "Explore your Dashboard",
    description:
      "See your earnings, upcoming shifts, and weekly goal.",
    page: "Dashboard",
  },
  {
    id: "check_schedule",
    title: "Check your upcoming shifts",
    description:
      "View your schedule and request changes if needed.",
    page: "Schedule",
  },
  {
    id: "view_earnings",
    title: "View your earnings",
    description:
      "See your recent payouts and earnings breakdown.",
    page: "Accounting",
  },
  {
    id: "join_chat",
    title: "Join the team chat",
    description: "Chat with your operator and team.",
    page: "Chat",
  },
];

const ACCOUNTANT_STEPS: OnboardingStep[] = [
  {
    id: "explore_dashboard",
    title: "Explore the Dashboard",
    description: "See revenue totals and financial metrics.",
    page: "Dashboard",
  },
  {
    id: "review_earnings",
    title: "Review earnings data",
    description:
      "Check all reported earnings across models and operators.",
    page: "Accounting",
  },
  {
    id: "check_payouts",
    title: "Review payouts",
    description: "See pending and completed payouts.",
    page: "Payouts",
  },
];

const STEPS_BY_ROLE: Record<string, OnboardingStep[]> = {
  owner: OWNER_STEPS,
  admin: ADMIN_STEPS,
  operator: OPERATOR_STEPS,
  model: MODEL_STEPS,
  accountant: ACCOUNTANT_STEPS,
};

export function getOnboardingSteps(role: string): OnboardingStep[] {
  return STEPS_BY_ROLE[role] || STEPS_BY_ROLE.owner;
}
