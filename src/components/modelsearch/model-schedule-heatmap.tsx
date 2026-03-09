"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getColor(value: number) {
  if (value === 0) return "bg-white/[0.03]";
  if (value <= 0.25) return "bg-emerald-500/20";
  if (value <= 0.5) return "bg-emerald-500/40";
  if (value <= 0.75) return "bg-emerald-500/60";
  return "bg-emerald-500/90";
}

interface ModelScheduleHeatmapProps {
  schedule: number[][];
}

export default function ModelScheduleHeatmap({ schedule }: ModelScheduleHeatmapProps) {
  if (!schedule || schedule.length < 7) return null;

  // Generate hour labels for every 2 hours
  const hourLabels: string[] = [];
  for (let h = 0; h < 24; h += 2) {
    hourLabels.push(`${h.toString().padStart(2, "0")}:00`);
  }

  return (
    <Card className="bg-[#111111] border-white/[0.04]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          Online Schedule (Last 28 Days, UTC)
        </CardTitle>
        <p className="text-xs text-[#A8A49A]/40 mt-1">
          Each cell shows how often the model was online in that 30-minute window. Brighter = more often online.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Hour labels */}
            <div className="flex mb-1 ml-10">
              {hourLabels.map((label) => (
                <div key={label} className="text-[9px] text-[#A8A49A]/30" style={{ width: `${100 / 12}%` }}>
                  {label}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] text-[#A8A49A]/40 w-8 text-right shrink-0">{day}</span>
                <div className="flex-1 flex gap-[1px]">
                  {schedule[dayIndex].map((value, slotIndex) => (
                    <div
                      key={slotIndex}
                      className={`flex-1 h-4 rounded-[2px] ${getColor(value)} transition-colors`}
                      title={`${day} ${Math.floor(slotIndex / 2).toString().padStart(2, "0")}:${slotIndex % 2 === 0 ? "00" : "30"} UTC \u2014 ${Math.round(value * 100)}% online`}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 ml-10">
              <span className="text-[9px] text-[#A8A49A]/30">Less</span>
              <div className="flex gap-[2px]">
                <div className="w-3 h-3 rounded-sm bg-white/[0.03]" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/90" />
              </div>
              <span className="text-[9px] text-[#A8A49A]/30">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
