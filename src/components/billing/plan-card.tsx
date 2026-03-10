"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Users, ExternalLink, AlertTriangle, Clock } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";

const PLAN_DETAILS: Record<
  string,
  {
    label: string;
    price: string;
    models: number;
    extraCost?: string;
    color: string;
  }
> = {
  free: {
    label: "Free",
    price: "$0",
    models: 0,
    color: "bg-white/10 text-white",
  },
  starter: {
    label: "Starter",
    price: "$29",
    models: 1,
    extraCost: "$20",
    color: "bg-[#A8A49A]/20 text-[#A8A49A]",
  },
  pro: {
    label: "Pro",
    price: "$59",
    models: 3,
    extraCost: "$15",
    color: "bg-[#C9A84C]/20 text-[#C9A84C]",
  },
  elite: {
    label: "Elite",
    price: "$99",
    models: 5,
    extraCost: "$12",
    color: "bg-purple-500/20 text-purple-400",
  },
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-500/20 text-green-400" },
  trialing: { label: "Trial", color: "bg-blue-500/20 text-blue-400" },
  grace_period: {
    label: "Payment Due",
    color: "bg-yellow-500/20 text-yellow-400",
  },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-400" },
  suspended: { label: "Suspended", color: "bg-red-500/20 text-red-400" },
};

interface BillingData {
  plan: string;
  status: string;
  current_model_count?: number;
  model_limit?: number;
  grace_period_ends_at?: string | null;
  stripe_subscription_id?: string | null;
  subscription?: {
    cancel_at_period_end?: boolean;
  } | null;
}

interface PlanCardProps {
  billing: BillingData;
  portalUrl?: string | null;
  onUpgrade: () => void;
}

export default function PlanCard({
  billing,
  portalUrl,
  onUpgrade,
}: PlanCardProps) {
  const planKey = (billing.plan || "free").toLowerCase();
  const plan = PLAN_DETAILS[planKey] || PLAN_DETAILS.free;
  const isCancelling = billing.subscription?.cancel_at_period_end;
  const status = STATUS_BADGES[billing.status] || STATUS_BADGES.active;

  const isTrialing = billing.status === "trialing";
  const isSuspended = billing.status === "suspended";
  const isGrace = billing.status === "grace_period";
  const trialEndsAt =
    billing.grace_period_ends_at && isTrialing
      ? parseISO(billing.grace_period_ends_at)
      : null;
  const graceEndsAt =
    billing.grace_period_ends_at && isGrace
      ? parseISO(billing.grace_period_ends_at)
      : null;

  return (
    <Card className="bg-[#111111] border-white/[0.06]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-white text-lg">Current Plan</CardTitle>
        <div className="flex gap-2">
          <Badge className={status.color}>{status.label}</Badge>
          <Badge className={plan.color}>{plan.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-light text-white">{plan.price}</span>
          <span className="text-[#A8A49A]/50">/month</span>
        </div>

        {isTrialing && trialEndsAt && (() => {
          const now = new Date();
          const totalTrialMs = 7 * 24 * 60 * 60 * 1000;
          const remainingMs = Math.max(0, trialEndsAt.getTime() - now.getTime());
          const progressPct = Math.min(100, Math.max(0, ((totalTrialMs - remainingMs) / totalTrialMs) * 100));
          const daysLeft = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

          return (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <p className="text-blue-400 text-sm font-medium">Free Trial</p>
              </div>
              <p className="text-blue-400/70 text-xs">
                Your trial ends{" "}
                {formatDistanceToNow(trialEndsAt, { addSuffix: true })} (
                {format(trialEndsAt, "MMM d, yyyy")}). Subscribe to keep using
                StudioOS.
              </p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-blue-400/60 mb-1">
                  <span>{daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining</span>
                  <span>7-day trial</span>
                </div>
                <div className="w-full h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {isGrace && graceEndsAt && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <p className="text-yellow-400 text-sm font-medium">
                Payment Failed
              </p>
            </div>
            <p className="text-yellow-400/70 text-xs">
              Please update your payment method. Your account will be suspended{" "}
              {formatDistanceToNow(graceEndsAt, { addSuffix: true })}.
            </p>
          </div>
        )}

        {isSuspended && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm font-medium">
                Account Suspended
              </p>
            </div>
            <p className="text-red-400/70 text-xs">
              Your subscription has been suspended. Subscribe to a plan to
              reactivate.
            </p>
          </div>
        )}

        {isCancelling && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">
              Your plan is set to cancel at the end of the current billing
              period.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm text-[#A8A49A]/60">
          <Users className="w-4 h-4" />
          <span>
            {billing.current_model_count || 0} / {billing.model_limit || 0}{" "}
            models used
          </span>
        </div>

        {plan.extraCost && (
          <p className="text-xs text-[#A8A49A]/40">
            Extra models: {plan.extraCost}/model/month
          </p>
        )}

        <div className="pt-2 flex flex-col gap-2">
          {portalUrl && billing.status === "active" && (
            <Button
              variant="outline"
              className="bg-background text-gray-900 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-9 w-full border-white/[0.06] hover:bg-white/[0.04]"
              onClick={() => window.open(portalUrl, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
          )}

          {(isTrialing || isSuspended || !billing.stripe_subscription_id) && (
            <Button
              className="w-full bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] hover:from-[#B8973B] hover:to-[#D4C07A] text-black font-medium"
              onClick={onUpgrade}
            >
              <Crown className="w-4 h-4 mr-2" />
              {isTrialing
                ? "Choose a Plan"
                : isSuspended
                  ? "Reactivate"
                  : "Upgrade Plan"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
