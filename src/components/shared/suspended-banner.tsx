"use client";

import { useAuth } from "@/lib/auth/auth-context";
import Link from "next/link";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuspendedBanner() {
  const { account, studio } = useAuth();
  if (!studio || !account) return null;

  const status = studio.subscription_status;
  const isOwnerOrAdmin = account.role === "owner" || account.role === "admin";

  if (status === "suspended") {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 mb-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-red-300">Studio Suspended</h3>
            <p className="text-xs text-red-300/60 mt-1">
              {isOwnerOrAdmin
                ? "Your subscription has expired. Subscribe to restore full access."
                : "This studio's subscription has expired. Please contact your studio admin."}
            </p>
            {isOwnerOrAdmin && (
              <Link href="/billing">
                <Button size="sm" className="mt-3 bg-red-500 hover:bg-red-600 text-white text-xs">
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                  Go to Billing
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === "grace_period") {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 mb-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-amber-300">Payment Issue</h3>
            <p className="text-xs text-amber-300/60 mt-1">
              {isOwnerOrAdmin
                ? "Your payment failed. Update your payment method to avoid suspension."
                : "There is a payment issue with this studio. Please contact your admin."}
            </p>
            {isOwnerOrAdmin && (
              <Link href="/billing">
                <Button size="sm" className="mt-3 bg-amber-500 hover:bg-amber-600 text-black text-xs">
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                  Update Payment
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
