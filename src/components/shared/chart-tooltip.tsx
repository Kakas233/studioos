"use client";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    color?: string;
    stroke?: string;
    name?: string;
    dataKey?: string;
    value: number;
  }>;
  label?: string;
  formatters?: Record<string, (value: number) => string>;
}

export default function ChartTooltip({ active, payload, label, formatters = {} }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] text-[#A8A49A]/50 mb-1.5 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.stroke }} />
          <span className="text-[11px] text-[#A8A49A]/50">{p.name || p.dataKey}:</span>
          <span className="text-[11px] text-white font-medium ml-auto">
            {p.dataKey && formatters[p.dataKey] ? formatters[p.dataKey](p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
