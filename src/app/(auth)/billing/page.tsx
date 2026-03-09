"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, CreditCard, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLANS, BILLING_CYCLES, getPrice, type BillingCycle } from "@/lib/pricing";

export default function BillingPage() {
  const { studio, isAdmin } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BILLING_CYCLES[0]);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const currentTier = studio?.subscription_tier || "free";

  const handleSubscribe = useCallback(async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle: billingCycle.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoadingPlan(null);
    }
  }, [billingCycle]);

  const handleManageBilling = useCallback(async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/billing", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoadingPortal(false);
    }
  }, []);

  return (
    <div className="space-y-5">
      {/* Current Plan */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-[#C9A84C]" />
              <h2 className="text-sm font-medium text-white">Current Plan</h2>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-xs capitalize bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20"
              >
                {currentTier}
              </Badge>
              <p className="text-xs text-[#A8A49A]/40">
                {studio?.subscription_status === "active"
                  ? "Active subscription"
                  : studio?.subscription_status === "trialing"
                    ? "Trial period"
                    : currentTier === "free"
                      ? "Upgrade to unlock more features"
                      : `Status: ${studio?.subscription_status || "unknown"}`}
              </p>
            </div>
          </div>
          {studio?.stripe_customer_id && isAdmin && (
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={loadingPortal}
              className="border-white/[0.08] text-[#A8A49A]/60 hover:text-white bg-transparent"
            >
              {loadingPortal ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Manage Billing
            </Button>
          )}
        </div>
      </div>

      {/* Billing Cycle Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-[#111111] border border-white/[0.04] rounded-lg p-1">
          {BILLING_CYCLES.map((cycle) => (
            <button
              key={cycle.id}
              onClick={() => setBillingCycle(cycle)}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-medium transition-colors",
                billingCycle.id === cycle.id
                  ? "bg-[#C9A84C] text-black"
                  : "text-[#A8A49A]/60 hover:text-white"
              )}
            >
              {cycle.label}
              {cycle.discount > 0 && (
                <span className="ml-1 text-[10px]">-{cycle.discount * 100}%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PLANS.map((plan) => {
          const isCurrent = currentTier === plan.id;
          const price = getPrice(plan.monthly, billingCycle);

          return (
            <div
              key={plan.id}
              className={cn(
                "bg-[#111111] border rounded-xl p-5 flex flex-col",
                plan.popular ? "border-[#C9A84C]/30" : "border-white/[0.04]",
                isCurrent && "ring-1 ring-[#C9A84C]/40"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">{plan.name}</h3>
                <div className="flex gap-1.5">
                  {plan.popular && (
                    <Badge className="text-[9px] bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20">
                      Popular
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge
                      variant="outline"
                      className="text-[9px] bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20"
                    >
                      Current
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mb-1">
                <span className="text-2xl font-bold text-white">${price}</span>
                <span className="text-xs text-[#A8A49A]/40">/month</span>
              </div>
              <p className="text-xs text-[#A8A49A]/40 mb-4">
                {plan.modelsIncluded} model{plan.modelsIncluded > 1 ? "s" : ""} included
                {plan.extraModelPrice > 0 && ` · +$${plan.extraModelPrice}/extra`}
              </p>

              <div className="space-y-2 flex-1 mb-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span className="text-xs text-[#A8A49A]/60">{feature}</span>
                  </div>
                ))}
              </div>

              {isAdmin && (
                <Button
                  variant={isCurrent ? "outline" : "default"}
                  onClick={() => !isCurrent && handleSubscribe(plan.id)}
                  disabled={isCurrent || loadingPlan === plan.id}
                  className={cn(
                    "w-full text-sm",
                    isCurrent
                      ? "border-white/[0.08] text-[#A8A49A]/60 bg-transparent cursor-default"
                      : plan.popular
                        ? "bg-[#C9A84C] hover:bg-[#b8963f] text-black"
                        : "bg-white/[0.06] hover:bg-white/[0.1] text-white"
                  )}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    "Upgrade"
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
