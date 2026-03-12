"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Globe, Calendar, DollarSign, MessageSquare, BarChart3,
  Search, Bell, Lock, Eye, Users, Zap, TrendingUp, ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Activity,
    title: 'Real-Time Earnings Tracking',
    description: 'Aggregate earnings from Chaturbate, Stripchat, MyFreeCams, LiveJasmin, BongaCams, and CamSoda into a single dashboard. See exactly how each model is performing right now.',
    color: '#C9A84C',
    stats: [
      { label: 'Sites tracked', value: '8' },
      { label: 'Accuracy', value: '99.9%' },
    ],
    visual: 'tracker' as const,
  },
  {
    icon: BarChart3,
    title: 'Model Performance Analytics',
    description: 'Track earnings per hour, viewer retention, tip frequency, and peak performance windows for every model. Coach effectively with data, not guesswork.',
    color: '#A855F7',
    stats: [
      { label: 'Chart types', value: '8+' },
      { label: 'Customizable', value: 'Yes' },
    ],
    visual: 'insights' as const,
  },
  {
    icon: Globe,
    title: '8 Cam Sites Unified',
    description: 'MyFreeCams, Chaturbate, Stripchat, BongaCams, LiveJasmin, Camsoda, Cam4, Flirt4Free — all in one place.',
    color: '#10B981',
    stats: [
      { label: 'Platforms', value: '8' },
      { label: 'Token rates', value: 'Auto' },
    ],
    visual: 'sites' as const,
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Book shifts, manage rooms, avoid conflicts. Models can request shifts, admins approve with one click.',
    color: '#3B82F6',
    stats: [
      { label: 'Drag & drop', value: 'Yes' },
      { label: 'Room mgmt', value: 'Built-in' },
    ],
    visual: 'schedule' as const,
  },
  {
    icon: DollarSign,
    title: 'Automated Commission Calculations',
    description: 'Set custom commission rates per model, per platform. StudioOS calculates payouts automatically — no more spreadsheet errors or payment disputes.',
    color: '#F59E0B',
    stats: [
      { label: 'Currencies', value: '2+' },
      { label: 'Auto-calc', value: 'Yes' },
    ],
    visual: 'earnings' as const,
  },
  {
    icon: Search,
    title: 'Cross-Platform Viewer Intelligence',
    description: "Understand who's watching your models across platforms. Identify high-value viewers, track cross-room activity, and uncover revenue patterns.",
    color: '#EC4899',
    stats: [
      { label: 'Sites', value: '8' },
      { label: 'Tip history', value: 'Full' },
    ],
    visual: 'lookup' as const,
  },
];

const SITE_NAMES = ['MFC', 'CB', 'SC', 'BC', 'LJ', 'CS', 'C4', 'F4F'];
const SITE_COLORS = ['#006E00', '#F47421', '#A2242D', '#A02239', '#BA0000', '#01B0FA', '#FC531D', '#2D91AF'];

function MiniTracker() {
  return (
    <div className="space-y-1.5">
      {['Public', 'Private', 'Group'].map((type, i) => (
        <div key={type} className="flex items-center gap-2">
          <div className="w-10 text-[9px] text-[#A8A49A]/30">{type}</div>
          <div className="flex-1 h-2 bg-white/[0.03] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: ['#10B981', '#EC4899', '#06B6D4'][i] }}
              initial={{ width: 0 }}
              whileInView={{ width: `${[75, 45, 30][i]}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
            />
          </div>
          <div className="text-[9px] text-white/50 w-8 text-right">{['4h 2m', '2h 1m', '1h 8m'][i]}</div>
        </div>
      ))}
    </div>
  );
}

function MiniInsights() {
  const bars = [30, 55, 40, 70, 85, 60, 45, 50, 75, 65, 90, 55];
  return (
    <div className="flex items-end gap-px h-12">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-t-sm"
          style={{ backgroundColor: '#A855F7' }}
          initial={{ height: 0, opacity: 0 }}
          whileInView={{ height: `${h}%`, opacity: 0.15 + (h / 100) * 0.6 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.04 }}
        />
      ))}
    </div>
  );
}

function MiniSites() {
  return (
    <div className="flex flex-wrap gap-1">
      {SITE_NAMES.map((s, i) => (
        <motion.div
          key={s}
          className="px-2 py-0.5 rounded text-[8px] font-medium border"
          style={{ borderColor: SITE_COLORS[i] + '30', color: SITE_COLORS[i], backgroundColor: SITE_COLORS[i] + '08' }}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          {s}
        </motion.div>
      ))}
    </div>
  );
}

function MiniSchedule() {
  const slots = [
    { time: '08:00', w: '60%', color: '#3B82F6' },
    { time: '14:00', w: '75%', color: '#10B981' },
    { time: '20:00', w: '90%', color: '#C9A84C' },
  ];
  return (
    <div className="space-y-1.5">
      {slots.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[8px] text-[#A8A49A]/25 w-7">{s.time}</span>
          <div className="flex-1 h-2.5 bg-white/[0.02] rounded">
            <motion.div
              className="h-full rounded"
              style={{ backgroundColor: s.color, opacity: 0.5 }}
              initial={{ width: 0 }}
              whileInView={{ width: s.w }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.12 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniEarnings() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="text-lg font-semibold text-[#F59E0B]">$12,480</div>
        <div className="text-[8px] text-[#A8A49A]/25 mt-0.5">This month gross</div>
      </div>
      <div className="flex items-end gap-px h-8">
        {[20, 35, 25, 50, 45, 60, 55].map((h, i) => (
          <motion.div
            key={i}
            className="w-1.5 rounded-t-sm bg-[#F59E0B]"
            initial={{ height: 0, opacity: 0 }}
            whileInView={{ height: `${h}%`, opacity: 0.3 + (h / 100) * 0.5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          />
        ))}
      </div>
    </div>
  );
}

function MiniLookup() {
  return (
    <div className="space-y-1">
      {['BigSpender99', 'VIPGuest42'].map((name, i) => (
        <div key={name} className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#EC4899]/15 flex items-center justify-center">
            <Users className="w-2 h-2 text-[#EC4899]" />
          </div>
          <span className="text-[9px] text-white/50 flex-1">{name}</span>
          <span className="text-[9px] text-[#EC4899]">{['$3,200', '$1,890'][i]}</span>
        </div>
      ))}
    </div>
  );
}

const VISUALS: Record<string, React.ComponentType> = {
  tracker: MiniTracker,
  insights: MiniInsights,
  sites: MiniSites,
  schedule: MiniSchedule,
  earnings: MiniEarnings,
  lookup: MiniLookup,
};

export default function Features() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="relative py-24" id="features">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[#A8A49A]/60 text-sm tracking-widest uppercase mb-4">Features</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-4">
            Everything You Need, Nothing You Don&apos;t
          </h2>
          <p className="text-[#A8A49A]/50 text-base max-w-xl mx-auto">
            Built specifically for webcam studios. Real-time earnings tracking, cross-platform viewer intelligence, model performance analytics, and automated commission calculations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => {
            const Visual = VISUALS[feature.visual];
            const isHovered = hoveredIdx === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative bg-[#111111]/80 rounded-xl p-6 border border-white/[0.04] hover:border-white/[0.08] transition-all duration-500 group overflow-hidden"
              >
                {/* Subtle color glow on hover */}
                <div
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none"
                  style={{ backgroundColor: feature.color, opacity: isHovered ? 0.06 : 0 }}
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-lg" style={{ backgroundColor: feature.color + '10' }}>
                      <feature.icon className="w-4.5 h-4.5" style={{ color: feature.color }} />
                    </div>
                    <div className="flex gap-2">
                      {feature.stats.map((s, si) => (
                        <div key={si} className="text-right">
                          <div className="text-[10px] font-semibold text-white/70">{s.value}</div>
                          <div className="text-[8px] text-[#A8A49A]/25">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-white mb-1.5 group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-[#A8A49A]/45 leading-relaxed text-xs mb-4">
                    {feature.description}
                  </p>

                  {/* Mini visual */}
                  <div className="bg-white/[0.015] rounded-lg border border-white/[0.03] p-3">
                    {Visual && <Visual />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Extra features row */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { icon: MessageSquare, label: 'Team Chat', desc: 'Built-in channels' },
            { icon: Bell, label: 'Member Alerts', desc: 'Telegram & room alerts' },
            { icon: Lock, label: 'Role-Based Access', desc: '5 permission levels' },
            { icon: Zap, label: 'Real-Time Monitor', desc: 'See who\'s live now' },
          ].map((f, i) => (
            <div key={i} className="bg-[#111111]/60 rounded-lg p-4 border border-white/[0.03] hover:border-white/[0.06] transition-colors">
              <f.icon className="w-4 h-4 text-[#C9A84C]/50 mb-2" />
              <p className="text-xs font-medium text-white/80 mb-0.5">{f.label}</p>
              <p className="text-[10px] text-[#A8A49A]/30">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
