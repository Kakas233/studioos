"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, DollarSign, MessageSquare, Clock } from "lucide-react";

const TIPS_DATA = [
  { site: "Chaturbate", since: "November 2023" },
  { site: "Stripchat", since: "November 2023" },
  { site: "Bongacams", since: "November 2023" },
  { site: "Camsoda", since: "January 2024" },
  { site: "MFC", since: "December 2024" },
  { site: "LiveJasmin", since: "February 2026" },
];

const CHAT_DATA = [
  { site: "Chaturbate", since: "July 2024" },
  { site: "Stripchat", since: "December 2024" },
  { site: "MFC", since: "December 2024" },
  { site: "Bongacams", since: "August 2025" },
  { site: "Camsoda", since: "August 2025" },
  { site: "LiveJasmin", since: "February 2026" },
];

const SESSIONS_DATA = [
  { site: "Chaturbate", since: "March 2021" },
  { site: "Stripchat", since: "December 2025" },
  { site: "Bongacams", since: "December 2025" },
  { site: "Camsoda", since: "December 2025" },
  { site: "MFC", since: "December 2025" },
  { site: "LiveJasmin", since: "February 2026" },
];

export default function DataAvailabilityTooltip() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="text-[#A8A49A]/25 hover:text-[#A8A49A]/50 transition-colors focus:outline-none"
        aria-label="Data availability info"
      >
        <HelpCircle className="w-[15px] h-[15px]" strokeWidth={1.8} />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-[540px] sm:w-[600px]">
          <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-white/[0.05]">
              <p className="text-[13px] font-medium text-white/80 tracking-wide">Data Availability</p>
            </div>

            {/* Table */}
            <div className="grid grid-cols-3 divide-x divide-white/[0.04]">
              {/* Tips Data */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400/60" />
                  <span className="text-[11px] font-medium text-white/60 uppercase tracking-wider">Tips Data</span>
                </div>
                <div className="space-y-2">
                  {TIPS_DATA.map((row) => (
                    <div key={row.site} className="flex items-center justify-between">
                      <span className="text-[11px] text-white/30">{row.site}</span>
                      <span className="text-[11px] text-white/50 font-medium tabular-nums">{row.since}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400/60" />
                  <span className="text-[11px] font-medium text-white/60 uppercase tracking-wider">Chat Messages</span>
                </div>
                <div className="space-y-2">
                  {CHAT_DATA.map((row) => (
                    <div key={row.site} className="flex items-center justify-between">
                      <span className="text-[11px] text-white/30">{row.site}</span>
                      <span className="text-[11px] text-white/50 font-medium tabular-nums">{row.since}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sessions */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <Clock className="w-3.5 h-3.5 text-purple-400/60" />
                  <span className="text-[11px] font-medium text-white/60 uppercase tracking-wider">Sessions</span>
                </div>
                <div className="space-y-2">
                  {SESSIONS_DATA.map((row) => (
                    <div key={row.site} className="flex items-center justify-between">
                      <span className="text-[11px] text-white/30">{row.site}</span>
                      <span className="text-[11px] text-white/50 font-medium tabular-nums">{row.since}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
