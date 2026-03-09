"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

const tierOrder: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  elite: 3,
};

interface FeatureGateProps {
  requiredTier: string;
  children: ReactNode;
}

export default function FeatureGate({ requiredTier, children }: FeatureGateProps) {
  const { studio } = useAuth();

  const currentTierIndex = tierOrder[studio?.subscription_tier || "free"] || 0;
  const requiredTierIndex = tierOrder[requiredTier] || 0;
  const isLocked = currentTierIndex < requiredTierIndex;

  if (!isLocked) return <>{children}</>;

  const tierLabel = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      {/* Blurred content behind */}
      <div className="filter blur-[6px] opacity-30 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/60">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/10 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7 text-[#C9A84C]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {tierLabel} Plan Feature
          </h2>
          <p className="text-[#A8A49A]/60 text-sm mb-6 leading-relaxed">
            This feature requires the <span className="text-[#C9A84C] font-medium">{tierLabel} Plan</span> or higher.
            Upgrade your subscription to unlock it.
          </p>
          <Link href="/billing">
            <Button className="bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] hover:from-[#B8973B] hover:to-[#D4C07A] text-black font-semibold px-6 h-11">
              <Sparkles className="w-4 h-4 mr-2" />
              Start {tierLabel} Plan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
