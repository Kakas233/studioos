"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const HUE_CONFIGS: Record<string, { colors: string[] }> = {
  gold: {
    colors: [
      "rgba(201,168,76,0.06)",
      "rgba(201,168,76,0.15)",
      "rgba(201,168,76,0.3)",
      "rgba(201,168,76,0.5)",
      "rgba(201,168,76,0.7)",
    ],
  },
  pink: {
    colors: [
      "rgba(236,72,153,0.06)",
      "rgba(236,72,153,0.12)",
      "rgba(236,72,153,0.25)",
      "rgba(236,72,153,0.4)",
      "rgba(236,72,153,0.6)",
    ],
  },
  green: {
    colors: [
      "rgba(16,185,129,0.06)",
      "rgba(16,185,129,0.12)",
      "rgba(16,185,129,0.25)",
      "rgba(16,185,129,0.4)",
      "rgba(16,185,129,0.6)",
    ],
  },
  blue: {
    colors: [
      "rgba(59,130,246,0.06)",
      "rgba(59,130,246,0.12)",
      "rgba(59,130,246,0.25)",
      "rgba(59,130,246,0.4)",
      "rgba(59,130,246,0.6)",
    ],
  },
};

function getInlineColor(value: number, max: number, hue: string): string {
  if (!value || max === 0) return "rgba(255,255,255,0.02)";
  const c = HUE_CONFIGS[hue] || HUE_CONFIGS.gold;
  const intensity = value / max;
  if (intensity > 0.75) return c.colors[4];
  if (intensity > 0.5) return c.colors[3];
  if (intensity > 0.25) return c.colors[2];
  if (intensity > 0.1) return c.colors[1];
  return c.colors[0];
}

interface StreamHeatmapProps {
  title: string;
  data: Record<number, Record<number, number>>;
  hue?: string;
}

export default function StreamHeatmap({
  title,
  data,
  hue = "gold",
}: StreamHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    day: number;
    hour: number;
  } | null>(null);

  let max = 0;
  for (const day of Object.values(data || {})) {
    for (const val of Object.values(day || {})) {
      if (val > max) max = val;
    }
  }

  const c = HUE_CONFIGS[hue] || HUE_CONFIGS.gold;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#111111] border border-white/[0.04] rounded-xl p-5 overflow-visible"
    >
      <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide mb-4">
        {title}
      </p>
      <div className="overflow-x-auto overflow-y-visible">
        <div className="min-w-[600px] pt-8">
          {/* Hour labels */}
          <div className="flex items-center mb-1 pl-10">
            {HOURS.filter((_, i) => i % 3 === 0).map((h) => (
              <div
                key={h}
                className="text-[9px] text-[#A8A49A]/25 text-center"
                style={{ width: `${(3 / 24) * 100}%` }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {/* Grid */}
          {DAYS.map((day, di) => (
            <div key={day} className="flex items-center gap-1 mb-0.5">
              <div className="w-9 text-[10px] text-[#A8A49A]/30 text-right pr-1 shrink-0">
                {day}
              </div>
              <div className="flex-1 flex gap-px">
                {HOURS.map((h) => {
                  const val = data?.[di]?.[h] || 0;
                  const isHovered =
                    hoveredCell?.day === di && hoveredCell?.hour === h;
                  return (
                    <div
                      key={h}
                      className="flex-1 h-5 rounded-[3px] cursor-crosshair relative"
                      style={{
                        backgroundColor: getInlineColor(val, max, hue),
                        transition:
                          "background-color 0.15s ease, transform 0.1s ease",
                        transform: isHovered ? "scale(1.3)" : "scale(1)",
                        zIndex: isHovered ? 10 : 1,
                        boxShadow: isHovered
                          ? `0 0 8px ${c.colors[3]}`
                          : "none",
                      }}
                      onMouseEnter={() =>
                        setHoveredCell({ day: di, hour: h })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {isHovered && val > 0 && (
                        <div
                          className="bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl pointer-events-none"
                          style={{
                            position: "absolute",
                            bottom: "calc(100% + 8px)",
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 9999,
                          }}
                        >
                          <p className="text-[9px] text-[#A8A49A]/50">
                            {day} {String(h).padStart(2, "0")}:00
                          </p>
                          <p className="text-[11px] text-white font-medium">
                            {Math.round(val)} min
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 pl-10">
            <span className="text-[9px] text-[#A8A49A]/25">Less</span>
            {c.colors.map((color, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-[2px]"
                style={{
                  backgroundColor:
                    i === 0 ? "rgba(255,255,255,0.02)" : color,
                }}
              />
            ))}
            <span className="text-[9px] text-[#A8A49A]/25">More</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
