"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  PLANS,
  BILLING_CYCLES,
  STRIPE_PRICES,
  type BillingCycle,
} from "@/lib/pricing";

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studioId?: string;
  currentTier: string;
}

function getPrice(
  monthlyPrice: number,
  cycleId: string
): { monthly: number; total: number; savings: number; months: number } {
  const c = BILLING_CYCLES.find((b) => b.id === cycleId) || BILLING_CYCLES[0];
  const discountedMonthly = monthlyPrice * (1 - c.discount);
  const total = Math.round(discountedMonthly * c.months);
  const savings = Math.round(monthlyPrice * c.months - total);
  return {
    monthly: Math.round(discountedMonthly),
    total,
    savings,
    months: c.months,
  };
}

export default function UpgradePlanModal({
  open,
  onOpenChange,
  studioId,
  currentTier,
}: UpgradePlanModalProps) {
  const [cycle, setCycle] = useState("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    const priceId = STRIPE_PRICES[planId]?.[cycle];
    if (!priceId) {
      toast.error("Invalid plan configuration");
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingCycle: cycle,
          price_id: priceId,
          tier: planId,
          cycle: cycle,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-[#0A0A0A] border-[#C9A84C]/20 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            Choose Your Plan
          </DialogTitle>
          <DialogDescription className="text-[#A8A49A]/60">
            Select a plan to continue using StudioOS. Cancel anytime.
          </DialogDescription>
        </DialogHeader>

        {/* Billing cycle toggle */}
        <div className="flex justify-center my-4">
          <div className="inline-flex bg-[#111111] rounded-full border border-white/[0.06] p-1">
            {BILLING_CYCLES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCycle(c.id)}
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                  cycle === c.id
                    ? "bg-[#C9A84C] text-black font-medium"
                    : "text-[#A8A49A]/60 hover:text-white"
                }`}
              >
                {c.label}
                {c.discount > 0 && (
                  <span
                    className={`ml-1 text-[10px] font-bold ${
                      cycle === c.id ? "text-black/60" : "text-[#C9A84C]"
                    }`}
                  >
                    -{c.discount * 100}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const price = getPrice(plan.monthly, cycle);
            const isCurrentPlan = plan.id === currentTier;

            return (
              <div
                key={plan.id}
                className={`rounded-xl p-5 border ${
                  plan.popular
                    ? "border-[#C9A84C]/30 bg-[#111111]"
                    : "border-white/[0.06] bg-[#111111]/60"
                } ${isCurrentPlan ? "ring-1 ring-[#C9A84C]/50" : ""}`}
              >
                {plan.popular && (
                  <div className="flex items-center gap-1 text-[#C9A84C] text-xs font-medium mb-3">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: plan.color }}
                  />
                  <h3 className="text-base font-medium text-white">
                    {plan.name}
                  </h3>
                </div>
                <p className="text-[#A8A49A]/40 text-xs mb-3">
                  {plan.modelsIncluded} model
                  {plan.modelsIncluded > 1 ? "s" : ""} included
                </p>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-light text-white">
                    ${price.monthly}
                  </span>
                  <span className="text-[#A8A49A]/40 text-xs">/mo</span>
                </div>
                {price.savings > 0 && (
                  <p className="text-[10px] text-[#C9A84C] mb-3">
                    Save ${price.savings}
                  </p>
                )}
                <p className="text-[10px] text-[#A8A49A]/30 mb-4">
                  {plan.modelsIncluded} model
                  {plan.modelsIncluded > 1 ? "s" : ""} &middot; +$
                  {plan.extraModelPrice}/extra
                </p>

                <ul className="space-y-1.5 mb-4">
                  {plan.features.slice(0, 5).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#C9A84C]/60 flex-shrink-0 mt-0.5" />
                      <span className="text-[10px] text-[#A8A49A]/60">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full text-sm ${
                    plan.popular
                      ? "bg-[#C9A84C] hover:bg-[#B8973B] text-black"
                      : "bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.06]"
                  }`}
                  size="sm"
                  disabled={!!loadingPlan}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    "Keep Plan"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
