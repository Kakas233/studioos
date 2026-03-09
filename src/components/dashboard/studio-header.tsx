"use client";

import { Users, User, Calculator } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type Studio = Database["public"]["Tables"]["studios"]["Row"];
type Account = Database["public"]["Tables"]["accounts"]["Row"];

interface StudioHeaderProps {
  studio: Studio | null;
  accounts: Account[];
}

export default function StudioHeader({ studio, accounts }: StudioHeaderProps) {
  const models = accounts.filter((a) => a.role === "model" && a.is_active);
  const operators = accounts.filter((a) => a.role === "operator" && a.is_active);
  const accountants = accounts.filter((a) => a.role === "accountant" && a.is_active);

  const counters = [
    { label: "Models", value: models.length, icon: User },
    { label: "Operators", value: operators.length, icon: Users },
    { label: "Accountants", value: accountants.length, icon: Calculator },
  ];

  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#C9A84C]/10 rounded-xl flex items-center justify-center border border-[#C9A84C]/20 shrink-0">
          <span className="text-[#C9A84C] font-bold text-sm sm:text-base">
            {studio?.name?.charAt(0) || "S"}
          </span>
        </div>
        <div className="min-w-0">
          <h2 className="text-white font-semibold text-base sm:text-lg leading-tight truncate">
            {studio?.name || "Studio"}
          </h2>
          <p className="text-[#A8A49A]/40 text-xs capitalize">
            {studio?.subscription_tier || "Free"} Plan
          </p>
        </div>
      </div>
      <div className="flex items-center gap-6 sm:gap-8">
        {counters.map((c) => (
          <div key={c.label} className="text-center min-w-[48px] sm:min-w-[60px]">
            <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-0.5">
              {c.label}
            </p>
            <p className="text-xl sm:text-2xl font-light text-white">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
