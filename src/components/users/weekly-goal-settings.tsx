"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Target } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface WeeklyGoalSettingsProps {
  user: {
    id: string;
    weekly_goal_enabled?: boolean | null;
    weekly_goal_hours?: number | null;
    [key: string]: unknown;
  };
}

export default function WeeklyGoalSettings({ user }: WeeklyGoalSettingsProps) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [enabled, setEnabled] = useState(user?.weekly_goal_enabled !== false);
  const [hours, setHours] = useState(user?.weekly_goal_hours || 20);
  const [saving, setSaving] = useState(false);

  const updateAccount = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("accounts")
        .update(data)
        .eq("id", user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Weekly goal updated");
    } catch {
      toast.error("Failed to update weekly goal");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (val: boolean) => {
    setEnabled(val);
    updateAccount({ weekly_goal_enabled: val });
  };

  const handleHoursChange = (val: string) => {
    const h = Math.max(1, Math.min(168, Number(val) || 1));
    setHours(h);
  };

  const handleHoursBlur = () => {
    updateAccount({ weekly_goal_hours: hours });
  };

  return (
    <div className="p-3 bg-emerald-500/[0.04] rounded-lg border border-emerald-500/10 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-emerald-300">Weekly Stream Goal</p>
            <p className="text-xs text-emerald-400/50 mt-0.5">
              Shown on model&apos;s dashboard
            </p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>
      {enabled && (
        <div className="flex items-center gap-2 pl-6">
          <span className="text-xs text-[#A8A49A]/50">Target:</span>
          <Input
            type="number"
            min="1"
            max="168"
            value={hours}
            onChange={(e) => handleHoursChange(e.target.value)}
            onBlur={handleHoursBlur}
            className="w-20 h-7 bg-white/[0.04] border-white/[0.06] text-white text-sm"
          />
          <span className="text-xs text-[#A8A49A]/50">hours/week</span>
        </div>
      )}
    </div>
  );
}
