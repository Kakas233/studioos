"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

const EXTRA_MODEL_PRICES: Record<string, number> = {
  starter: 20,
  pro: 15,
  elite: 12,
};

interface BillingData {
  plan: string;
  status: string;
  stripe_subscription_id?: string | null;
}

interface ExtraModelsCardProps {
  billing: BillingData;
  studioId?: string;
  onSuccess?: () => void;
}

export default function ExtraModelsCard({
  billing,
  studioId,
  onSuccess,
}: ExtraModelsCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const tier = (billing.plan || "starter").toLowerCase();
  const pricePerModel = EXTRA_MODEL_PRICES[tier] || 20;
  const isActive = billing.status === "active";
  const hasSubscription = !!billing.stripe_subscription_id;

  if (!isActive || !hasSubscription) return null;

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/extra-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studio_id: studioId,
          quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add extra models");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      toast.error("No checkout URL returned");
    } catch {
      toast.error("Failed to add extra models. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#111111] border-white/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-[#C9A84C]" />
          Extra Model Seats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[#A8A49A]/60">
          Need more models? Add extra seats to your{" "}
          {tier.charAt(0).toUpperCase() + tier.slice(1)} plan at{" "}
          <span className="text-[#C9A84C]">${pricePerModel}/model/month</span>.
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/[0.03] rounded-lg border border-white/[0.06]">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 text-[#A8A49A]/50 hover:text-white transition-colors"
              disabled={loading}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center text-white text-sm font-medium">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(20, quantity + 1))}
              className="px-3 py-2 text-[#A8A49A]/50 hover:text-white transition-colors"
              disabled={loading}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-[#A8A49A]/60">
            +${pricePerModel * quantity}/mo
          </div>
        </div>

        <Button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] hover:from-[#B8973B] hover:to-[#D4C07A] text-black font-medium"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Add {quantity} Extra Model{quantity > 1 ? "s" : ""}
        </Button>

        <p className="text-xs text-[#A8A49A]/30">
          Prorated to your current billing cycle. You can manage add-ons from
          the Stripe portal.
        </p>
      </CardContent>
    </Card>
  );
}
