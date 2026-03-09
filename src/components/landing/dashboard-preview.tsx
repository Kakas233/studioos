"use client";

import { motion } from 'framer-motion';

const SCREENSHOT_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6963df2bdfca920e5f5d8cfe/ff7948851_Screenshot2026-02-09at00725.png';

export default function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative max-w-5xl mx-auto mt-12 md:mt-16"
    >
      {/* Very subtle gold glow behind */}
      <div className="absolute -inset-6 bg-gradient-to-b from-[#C9A84C]/[0.04] via-[#C9A84C]/[0.02] to-transparent blur-3xl rounded-3xl pointer-events-none" />

      {/* Image container */}
      <div className="relative z-10">
        {/* Greyish border + rounded corners */}
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/40 bg-[#0c0c0c]">
          <img
            src={SCREENSHOT_URL}
            alt="StudioOS Dashboard"
            className="w-full h-auto block"
            loading="eager"
          />
        </div>

        {/* Bottom fade to background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[35%] pointer-events-none z-20"
          style={{
            background: 'linear-gradient(to top, #0A0A0A 0%, #0A0A0A 15%, rgba(10,10,10,0.9) 40%, rgba(10,10,10,0.5) 70%, transparent 100%)',
          }}
        />

        {/* Subtle inner glow along the top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-px z-20 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, transparent 10%, rgba(201,168,76,0.15) 50%, transparent 90%)',
          }}
        />
      </div>
    </motion.div>
  );
}
