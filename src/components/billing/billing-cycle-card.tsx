"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, ArrowRight } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

interface BillingData {
  status: string;
  grace_period_ends_at?: string | null;
  subscription?: {
    current_period_start: string;
    current_period_end: string;
  } | null;
  upcoming_invoice?: {
    amount_due: number;
  } | null;
}

export default function BillingCycleCard({ billing }: { billing: BillingData }) {
  const sub = billing.subscription;
  const isTrialing = billing.status === "trialing";

  if (!sub) {
    return (
      <Card className="bg-[#111111] border-white/[0.06]">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Billing Cycle</CardTitle>
        </CardHeader>
        <CardContent>
          {isTrialing && billing.grace_period_ends_at ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <Clock className="w-4 h-4" />
                <span>Free Trial</span>
              </div>
              <p className="text-[#A8A49A]/50 text-sm">
                Your trial ends{" "}
                {format(parseISO(billing.grace_period_ends_at), "MMM d, yyyy")}
              </p>
              <div className="w-full bg-white/[0.04] rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        (1 -
                          differenceInDays(
                            parseISO(billing.grace_period_ends_at),
                            new Date()
                          ) /
                            7) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-[#A8A49A]/30">
                {Math.max(
                  0,
                  differenceInDays(
                    parseISO(billing.grace_period_ends_at),
                    new Date()
                  )
                )}{" "}
                days remaining
              </p>
            </div>
          ) : (
            <p className="text-[#A8A49A]/50 text-sm">
              No active subscription. Subscribe to a plan to get started.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const periodStart = parseISO(sub.current_period_start);
  const periodEnd = parseISO(sub.current_period_end);
  const daysLeft = differenceInDays(periodEnd, new Date());
  const totalDays = differenceInDays(periodEnd, periodStart);
  const progressPct = Math.max(
    0,
    Math.min(100, ((totalDays - daysLeft) / totalDays) * 100)
  );

  return (
    <Card className="bg-[#111111] border-white/[0.06]">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg">Billing Cycle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-[#A8A49A]/60">
          <CalendarDays className="w-4 h-4" />
          <span>{format(periodStart, "MMM d, yyyy")}</span>
          <ArrowRight className="w-3 h-3" />
          <span>{format(periodEnd, "MMM d, yyyy")}</span>
        </div>

        <div>
          <div className="flex justify-between text-xs text-[#A8A49A]/40 mb-1.5">
            <span>Current period</span>
            <span>{daysLeft} days left</span>
          </div>
          <div className="w-full bg-white/[0.04] rounded-full h-2">
            <div
              className="bg-[#C9A84C] h-2 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#A8A49A]/60">
          <Clock className="w-4 h-4" />
          <span>Next billing: {format(periodEnd, "MMM d, yyyy")}</span>
        </div>

        {billing.upcoming_invoice && (
          <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
            <p className="text-xs text-[#A8A49A]/40 mb-1">
              Next invoice amount
            </p>
            <p className="text-xl font-light text-white">
              ${(billing.upcoming_invoice.amount_due / 100).toFixed(2)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
