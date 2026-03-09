"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getOnboardingSteps } from "./onboarding-steps";

/** Map page names to Next.js routes */
function pageToHref(page: string, subdomain?: string): string {
  const routes: Record<string, string> = {
    Dashboard: "/dashboard",
    Rooms: "/rooms",
    UsersManagement: "/users",
    AdminSettings: "/settings",
    Schedule: "/schedule",
    Accounting: "/accounting",
    Chat: "/chat",
    Payouts: "/payouts",
  };
  return routes[page] || "/dashboard";
}

export default function OnboardingGuide() {
  const { account, studio, updateAccountLocal } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const supabase = createClient();

  const dismissed = account?.onboarding_dismissed === true;
  const completedSteps: string[] =
    (account?.onboarding_completed_steps as string[]) || [];

  if (!account || !studio || dismissed) return null;

  const role = account.role;
  const steps = getOnboardingSteps(role);
  if (!steps || steps.length === 0) return null;

  const completedCount = steps.filter((s) =>
    completedSteps.includes(s.id)
  ).length;
  const allDone = completedCount === steps.length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const handleDismiss = async () => {
    updateAccountLocal({ onboarding_dismissed: true } as Partial<typeof account>);
    await supabase
      .from("accounts")
      .update({ onboarding_dismissed: true })
      .eq("id", account.id);
  };

  const handleComplete = async (stepId: string) => {
    if (completedSteps.includes(stepId)) return;
    const newSteps = [...completedSteps, stepId];
    updateAccountLocal({
      onboarding_completed_steps: newSteps,
    } as Partial<typeof account>);
    await supabase
      .from("accounts")
      .update({ onboarding_completed_steps: newSteps })
      .eq("id", account.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5"
    >
      <div className="relative bg-gradient-to-br from-[#111111] to-[#0e0d08] rounded-xl border border-[#C9A84C]/15 overflow-hidden">
        {/* Shimmer accent */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-3 group flex-1 min-w-0"
          >
            <div className="relative w-8 h-8 shrink-0">
              <svg
                className="w-8 h-8 -rotate-90"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="#C9A84C"
                  strokeWidth="2"
                  strokeDasharray={`${progress * 0.975} 100`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              {allDone ? (
                <Sparkles className="absolute inset-0 m-auto w-3.5 h-3.5 text-[#C9A84C]" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  {completedCount}/{steps.length}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-white truncate">
                {allDone ? "Setup Complete!" : "Getting Started"}
              </h3>
              <p className="text-[11px] text-[#A8A49A]/40 truncate">
                {allDone
                  ? "You're all set. Dismiss when ready."
                  : `${completedCount} of ${steps.length} steps completed`}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="w-7 h-7 text-[#A8A49A]/30 hover:text-white hover:bg-white/[0.04]"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Steps */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 space-y-1">
                {steps.map((step) => {
                  const done = completedSteps.includes(step.id);
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                        done
                          ? "bg-white/[0.02]"
                          : "bg-white/[0.03] hover:bg-white/[0.05]"
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleComplete(step.id)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          done
                            ? "bg-[#C9A84C] border-[#C9A84C]"
                            : "border-white/[0.15] hover:border-[#C9A84C]/50"
                        }`}
                      >
                        {done && (
                          <Check className="w-3 h-3 text-black" />
                        )}
                      </button>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${done ? "text-[#A8A49A]/40 line-through" : "text-white"}`}
                        >
                          {step.title}
                        </p>
                        {!done && step.description && (
                          <p className="text-[11px] text-[#A8A49A]/40 mt-0.5">
                            {step.description}
                          </p>
                        )}
                      </div>

                      {/* Action link */}
                      {!done && step.page && (
                        <Link
                          href={pageToHref(
                            step.page,
                            studio?.subdomain
                          )}
                          className="text-[#C9A84C]/60 hover:text-[#C9A84C] shrink-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dismiss footer */}
              <div className="px-5 pb-3">
                <button
                  onClick={handleDismiss}
                  className="text-[11px] text-[#A8A49A]/30 hover:text-[#A8A49A]/50 transition-colors"
                >
                  Don&apos;t show this again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
