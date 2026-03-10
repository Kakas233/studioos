"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import PlanCard from "@/components/billing/plan-card";
import BillingCycleCard from "@/components/billing/billing-cycle-card";
import PaymentMethodCard from "@/components/billing/payment-method-card";
import InvoiceHistory from "@/components/billing/invoice-history";
import UpgradePlanModal from "@/components/billing/upgrade-plan-modal";
import ExtraModelsCard from "@/components/billing/extra-models-card";

export default function BillingPage() {
  const router = useRouter();
  const { account, studio, loading: authLoading, refreshStudio } = useAuth();
  const queryClient = useQueryClient();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Check for checkout success/cancel in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      toast.success("Subscription activated! Welcome to StudioOS.");
      // Clean URL
      params.delete("checkout");
      const newUrl =
        window.location.pathname +
        (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState({}, "", newUrl);
    } else if (params.get("checkout") === "cancelled") {
      toast.info("Checkout was cancelled.");
      params.delete("checkout");
      const newUrl =
        window.location.pathname +
        (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !account) {
      router.push("/sign-in");
    }
    if (
      !authLoading &&
      account &&
      account.role !== "owner" &&
      account.role !== "admin"
    ) {
      router.push("/dashboard");
    }
  }, [authLoading, account, router]);

  const {
    data: billingData,
    isLoading,
    error: billingError,
  } = useQuery({
    queryKey: ["billing", studio?.id],
    queryFn: async () => {
      const res = await fetch("/api/stripe/billing", {
        method: "GET",
      });
      if (!res.ok) throw new Error("Failed to fetch billing data");
      const data = await res.json();
      if (data.success === false) throw new Error(data.error || "Failed");
      return data.billing || data;
    },
    enabled: !!studio?.id && !!account,
    retry: 1,
  });

  if (authLoading || !account) return null;
  if (account.role !== "owner" && account.role !== "admin") return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  // Build fallback billing data from studio for trial/free/errored states
  const effectiveBilling = billingData || {
    plan: studio?.subscription_tier || "free",
    status: studio?.subscription_status || "trialing",
    model_limit: studio?.model_limit || 1,
    current_model_count: studio?.current_model_count || 0,
    grace_period_ends_at: studio?.grace_period_ends_at || null,
    subscription: null,
    invoices: [],
    payment_method: null,
    customer_portal_url: null,
    stripe_subscription_id: studio?.stripe_subscription_id || null,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <PlanCard
          billing={effectiveBilling}
          portalUrl={effectiveBilling.customer_portal_url}
          onUpgrade={() => setShowUpgrade(true)}
        />
        {effectiveBilling.subscription && (
          <BillingCycleCard billing={effectiveBilling} />
        )}
        {!effectiveBilling.subscription && (
          <BillingCycleCard
            billing={{
              ...effectiveBilling,
              subscription:
                effectiveBilling.status === "trialing" &&
                effectiveBilling.grace_period_ends_at
                  ? {
                      current_period_start:
                        studio?.created_at || new Date().toISOString(),
                      current_period_end:
                        effectiveBilling.grace_period_ends_at,
                    }
                  : null,
            }}
          />
        )}
        <PaymentMethodCard
          paymentMethod={effectiveBilling.payment_method}
          portalUrl={effectiveBilling.customer_portal_url}
        />
      </div>
      <ExtraModelsCard
        billing={effectiveBilling}
        studioId={studio?.id}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["billing", studio?.id],
          });
          refreshStudio();
        }}
      />
      {effectiveBilling.invoices?.length > 0 && (
        <InvoiceHistory invoices={effectiveBilling.invoices} />
      )}

      <UpgradePlanModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        studioId={studio?.id}
        currentTier={(effectiveBilling.plan || "free").toLowerCase()}
      />
    </div>
  );
}
