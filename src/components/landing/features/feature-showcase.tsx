"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Sparkles, Calendar, Bell, Search, Eye } from 'lucide-react';
import StreamTrackingAnimation from './stream-tracking-animation';
import ModelInsightsAnimation from './model-insights-animation';
import ScheduleAccountingAnimation from './schedule-accounting-animation';
import MemberAlertsAnimation from './member-alerts-animation';
import MemberLookupAnimation from './member-lookup-animation';
import ModelLookupAnimation from './model-lookup-animation';

const FEATURES = [
  {
    id: 'stream-tracking',
    icon: Activity,
    label: 'Stream Tracking',
    title: 'Automatic Stream Time Tracking',
    subtitle: 'Add your models\' cam accounts and StudioOS tracks every stream across 8 platforms — automatically.',
    color: '#10B981',
    Component: StreamTrackingAnimation,
  },
  {
    id: 'model-insights',
    icon: Sparkles,
    label: 'Model Insights',
    title: 'AI-Powered Performance Analytics',
    subtitle: 'Revenue charts, heatmaps, show type breakdowns, and an AI Performance Coach that gives actionable recommendations.',
    color: '#A855F7',
    Component: ModelInsightsAnimation,
  },
  {
    id: 'scheduling',
    icon: Calendar,
    label: 'Scheduling',
    title: 'Shift Scheduling & Earnings',
    subtitle: 'Visual calendar scheduling with one-click shift creation, and built-in earnings reporting with automatic payout calculations.',
    color: '#3B82F6',
    Component: ScheduleAccountingAnimation,
  },
  {
    id: 'member-alerts',
    icon: Bell,
    label: 'Member Alerts',
    title: 'Real-Time Telegram Alerts',
    subtitle: 'Get instant Telegram notifications when high-spending members enter your monitored rooms.',
    color: '#F59E0B',
    Component: MemberAlertsAnimation,
  },
  {
    id: 'member-lookup',
    icon: Search,
    label: 'Member Lookup',
    title: 'Deep Member Intelligence',
    subtitle: 'Search any cam site member and instantly see their complete tipping history, spending patterns, and activity.',
    color: '#EC4899',
    Component: MemberLookupAnimation,
  },
  {
    id: 'model-lookup',
    icon: Eye,
    label: 'Model Lookup',
    title: 'Competitor & Model Research',
    subtitle: 'Look up any model across all major platforms — view their stats, streaming sessions, top tippers, and chat history.',
    color: '#06B6D4',
    Component: ModelLookupAnimation,
  },
];

export default function FeatureShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = FEATURES[activeIdx];

  return (
    <div className="relative py-24" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-[#C9A84C]/60 text-xs tracking-[0.2em] uppercase mb-4 font-medium">Platform Features</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white tracking-tight mb-4">
            See It In Action
          </h2>
          <p className="text-[#A8A49A]/40 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Every feature designed for webcam studios. Real workflows, real data, real results.
          </p>
        </motion.div>

        {/* Feature Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex flex-wrap justify-center gap-1.5 p-1.5 bg-[#111111]/80 rounded-2xl border border-white/[0.04]">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const isActive = i === activeIdx;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveIdx(i)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-[#A8A49A]/40 hover:text-[#A8A49A]/70'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFeatureTab"
                      className="absolute inset-0 rounded-xl border"
                      style={{ backgroundColor: f.color + '12', borderColor: f.color + '30' }}
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" style={isActive ? { color: f.color } : {}} />
                  <span className="relative z-10 hidden sm:inline">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            {/* Title + Description */}
            <div className="text-center mb-8">
              <h3 className="text-xl md:text-2xl font-medium text-white mb-2">{active.title}</h3>
              <p className="text-sm text-[#A8A49A]/40 max-w-lg mx-auto">{active.subtitle}</p>
            </div>

            {/* Animation Container */}
            <div className="relative max-w-5xl mx-auto">
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-2xl blur-3xl opacity-[0.04] pointer-events-none"
                style={{ backgroundColor: active.color }}
              />

              {/* App window frame */}
              <div className="relative bg-[#0A0A0A] rounded-2xl border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/50">
                {/* Window top bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-[#0D0D0D]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]/60" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 bg-white/[0.03] rounded-md text-[10px] text-[#A8A49A]/30 font-mono">
                      getstudioos.com
                    </div>
                  </div>
                </div>

                {/* Animation content */}
                <div className="relative min-h-[400px] md:min-h-[480px]">
                  <active.Component color={active.color} />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
