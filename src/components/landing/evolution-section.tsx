"use client";

import { useRef, useEffect, useState } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const CURVE_PATH = "M 40 270 C 120 268, 280 262, 420 248 C 560 230, 700 160, 820 80 C 880 45, 930 25, 960 18";

const PAIN_POINTS = [
  { icon: '\u{1F4CB}', label: 'Google Sheets' },
  { icon: '\u{1F4AC}', label: 'Telegram chats' },
  { icon: '\u{1F4C1}', label: 'Excel files' },
  { icon: '\u274C', label: 'Manual tracking' },
];

const SOLUTIONS = [
  { icon: '\u{1F4E1}', label: 'Auto stream tracking' },
  { icon: '\u{1F4C5}', label: 'Smart scheduling' },
  { icon: '\u{1F4B0}', label: 'Revenue reporting' },
  { icon: '\u26A1', label: 'Real-time insights' },
];

export default function EvolutionSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });
  const lineControls = useAnimation();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const run = async () => {
      setPhase(1);
      await lineControls.start({
        pathLength: 1,
        transition: { duration: 2, ease: [0.16, 1, 0.3, 1] }
      });
      setPhase(2);
      await new Promise(r => setTimeout(r, 300));
      setPhase(3);
    };
    run();
  }, [isInView, lineControls]);

  return (
    <section ref={sectionRef} className="relative z-10 py-20 md:py-32 lg:py-40 px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#C9A84C]/[0.02] rounded-full blur-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Badge */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A84C]/15 bg-[#C9A84C]/[0.04]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
            <span className="text-[#C9A84C]/70 text-xs tracking-widest uppercase font-medium">Then vs Now</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-center text-white leading-tight tracking-tight mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          The evolution of
        </motion.h2>
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-center leading-tight tracking-tight mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] to-[#E8D48B]">
            Studio Management
          </span>
        </motion.h2>
        <motion.p
          className="text-center text-[#A8A49A]/50 text-sm md:text-base max-w-xl mx-auto mb-16 md:mb-20 tracking-wide"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          From scattered tools to one unified platform
        </motion.p>

        {/* Chart */}
        <motion.div
          className="relative w-full max-w-5xl mx-auto mb-16 md:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden">
            <div className="relative px-4 sm:px-8 md:px-12 pt-8 sm:pt-10 md:pt-14 pb-6 md:pb-8 bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.05]" style={{ borderRadius: 'inherit' }}>

              {/* Faint grid lines */}
              <div className="absolute inset-0 px-4 sm:px-8 md:px-12 pt-8 sm:pt-10 md:pt-14 pb-14 md:pb-16 pointer-events-none">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="absolute left-4 right-4 sm:left-8 sm:right-8 md:left-12 md:right-12 border-t border-white/[0.03]"
                    style={{ top: `${20 + i * 18}%` }}
                  />
                ))}
              </div>

              {/* SVG Chart */}
              <div className="relative w-full" style={{ paddingBottom: '28%', minHeight: '180px' }}>
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 1000 300"
                  preserveAspectRatio="xMidYMid meet"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="evoLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#C9A84C" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#E8D48B" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="evoFillGrad" x1="0.5" y1="0" x2="0.5" y2="1">
                      <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
                    </linearGradient>
                    <filter id="evoGlow">
                      <feGaussianBlur stdDeviation="8" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Area fill under curve */}
                  <motion.path
                    d={CURVE_PATH + " L 960 300 L 40 300 Z"}
                    fill="url(#evoFillGrad)"
                    initial={{ opacity: 0 }}
                    animate={phase >= 1 ? { opacity: 1 } : {}}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />

                  {/* Glow line */}
                  <motion.path
                    d={CURVE_PATH}
                    stroke="#C9A84C"
                    strokeWidth="16"
                    strokeLinecap="round"
                    filter="url(#evoGlow)"
                    opacity="0.15"
                    initial={{ pathLength: 0 }}
                    animate={lineControls}
                  />

                  {/* Main line */}
                  <motion.path
                    d={CURVE_PATH}
                    stroke="url(#evoLineGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={lineControls}
                  />

                  {/* Start dot */}
                  <motion.circle
                    cx="40" cy="270" r="4"
                    fill="#C9A84C"
                    opacity="0.6"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={phase >= 2 ? { opacity: 0.6, scale: 1 } : {}}
                    transition={{ duration: 0.5, ease: "backOut" }}
                  />

                  {/* End dot - pulsing */}
                  <motion.circle
                    cx="960" cy="18" r="5"
                    fill="#E8D48B"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={phase >= 2 ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.15, ease: "backOut" }}
                  />
                  <motion.circle
                    cx="960" cy="18" r="12"
                    fill="none"
                    stroke="#E8D48B"
                    strokeWidth="1"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={phase >= 2 ? { opacity: [0, 0.4, 0], scale: [0.5, 1.5, 2] } : {}}
                    transition={{ duration: 2, delay: 0.3, repeat: Infinity, repeatDelay: 1 }}
                  />
                </svg>
              </div>

              {/* Year labels */}
              <div className="flex justify-between mt-3 md:mt-4">
                {YEARS.map((year, i) => (
                  <motion.span
                    key={year}
                    className={`text-[10px] sm:text-xs font-medium tracking-wide ${
                      year === 2026
                        ? 'text-[#C9A84C]'
                        : year === 2018
                        ? 'text-white/25'
                        : 'text-white/15'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.06 }}
                  >
                    {year}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Then vs Now cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 max-w-5xl mx-auto">
          {/* THEN card */}
          <motion.div
            className="group relative rounded-2xl md:rounded-3xl overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] rounded-2xl md:rounded-3xl" />
            <div className="relative p-6 md:p-8 lg:p-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2 h-2 rounded-full bg-white/30" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Before</span>
              </div>

              <p className="text-white/60 text-sm md:text-base leading-relaxed mb-6">
                Studios depended on <span className="text-white/90">scattered tools</span> — Telegram for communication, Google Sheets for tracking, Excel for earnings. Fragmented, error-prone, and impossible to scale.
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {PAIN_POINTS.map((item, i) => (
                  <motion.div
                    key={item.label}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]"
                    initial={{ opacity: 0, x: -10 }}
                    animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                  >
                    <span className="text-sm opacity-50">{item.icon}</span>
                    <span className="text-[11px] text-white/35 font-medium">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* NOW card */}
          <motion.div
            className="group relative rounded-2xl md:rounded-3xl overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Gold gradient border effect */}
            <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#C9A84C]/15 via-[#C9A84C]/[0.04] to-transparent p-[1px]">
              <div className="w-full h-full rounded-2xl md:rounded-3xl bg-[#0A0A0A]" />
            </div>
            <div className="relative p-6 md:p-8 lg:p-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2 h-2 rounded-full bg-[#C9A84C]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A84C]/80">Now</span>
                <div className="ml-auto px-2.5 py-1 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/15">
                  <span className="text-[9px] text-[#C9A84C]/80 font-medium tracking-wide uppercase">StudioOS</span>
                </div>
              </div>

              <p className="text-white/60 text-sm md:text-base leading-relaxed mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] to-[#E8D48B]">One unified platform</span> — automatic stream tracking, intelligent scheduling, real-time revenue reporting, and seamless shift management.
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {SOLUTIONS.map((item, i) => (
                  <motion.div
                    key={item.label}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#C9A84C]/[0.04] border border-[#C9A84C]/10"
                    initial={{ opacity: 0, x: 10 }}
                    animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-[11px] text-[#C9A84C]/70 font-medium">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
