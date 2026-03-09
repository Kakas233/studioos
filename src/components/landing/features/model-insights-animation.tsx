"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Sparkles, Clock, RefreshCw } from 'lucide-react';

const REVENUE_POINTS = [800, 1200, 2800, 3200, 2500, 3800, 4200, 3600, 2200, 1500, 900, 600, 400, 300];
const HEATMAP_ROWS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HEATMAP_COLS = 12;

function generateHeatmapData() {
  return HEATMAP_ROWS.map(() =>
    Array.from({ length: HEATMAP_COLS }, () => Math.random())
  );
}

const SITE_DATA = [
  { name: 'MyFreeCams', value: 2437, pct: 26, color: '#006E00' },
  { name: 'CamSoda', value: 2180, pct: 23, color: '#01B0FA' },
  { name: 'Chaturbate', value: 1890, pct: 20, color: '#F47421' },
  { name: 'StripChat', value: 1420, pct: 15, color: '#A2242D' },
  { name: 'Flirt4Free', value: 820, pct: 9, color: '#E91E63' },
  { name: 'LiveJasmin', value: 596, pct: 7, color: '#BA0000' },
];

const AI_RECS = [
  { title: 'Build a Consistent Streaming Schedule', severity: 'critical', impact: 'Increased audience engagement and fan retention.', color: '#EF4444' },
  { title: 'Enhance Private Show Engagement', severity: 'high', impact: 'Better private show engagement and higher earnings.', color: '#F59E0B' },
  { title: 'Focus on High-Earning Platforms', severity: 'high', impact: 'Increased revenue through optimized audience engagement.', color: '#10B981' },
  { title: 'Adjust Pricing Across Platforms', severity: 'medium', impact: 'Higher revenue opportunities through competitive pricing.', color: '#3B82F6' },
];

export default function ModelInsightsAnimation({ color }: { color?: string }) {
  const [phase, setPhase] = useState(0);
  const [heatmap] = useState(generateHeatmapData);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setPhase(1), 4500));
    timers.push(setTimeout(() => setPhase(2), 9000));
    timers.push(setTimeout(() => setPhase(0), 13500));

    const loop = setInterval(() => {
      setPhase(0);
      setTimeout(() => setPhase(1), 4500);
      setTimeout(() => setPhase(2), 9000);
    }, 13500);

    return () => { timers.forEach(clearTimeout); clearInterval(loop); };
  }, []);

  return (
    <div className="p-4 md:p-6">
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div key="charts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px]">
            <div className="text-sm font-medium text-white mb-4">Model Insights</div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Total Stream Time', value: '138h 48m', color: '#10B981' },
                { label: 'Free Chat', value: '255h 10m', color: '#A855F7' },
                { label: 'Private Shows', value: '22h 37m', color: '#EC4899' },
                { label: 'Group Shows', value: '4h 37m', color: '#06B6D4' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                  className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                  <div className="text-[9px] text-[#A8A49A]/30 uppercase tracking-wider mb-1">{s.label}</div>
                  <div className="text-sm font-semibold text-white">{s.value}</div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-[10px] text-[#A8A49A]/30">Revenue Over Time</div>
                  <div className="text-lg font-bold text-white">$10,226.33</div>
                </div>
              </div>
              <div className="h-28 flex items-end gap-px relative">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 560 112" preserveAspectRatio="none">
                  <motion.path
                    d={`M${REVENUE_POINTS.map((p, i) => `${i * (560 / (REVENUE_POINTS.length - 1))},${112 - (p / 4500) * 112}`).join(' L')}`}
                    fill="none"
                    stroke="#C9A84C"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 0.6 }}
                  />
                  <motion.path
                    d={`M0,112 L${REVENUE_POINTS.map((p, i) => `${i * (560 / (REVENUE_POINTS.length - 1))},${112 - (p / 4500) * 112}`).join(' L')} L560,112 Z`}
                    fill="url(#revenueGrad)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ duration: 1, delay: 1.5 }}
                  />
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-3">
                <div className="text-[10px] text-[#A8A49A]/30 mb-2">Revenue by Site</div>
                <div className="text-sm font-bold text-white mb-2">$9,343.13</div>
                <div className="flex items-end gap-1 h-16">
                  {SITE_DATA.map((s, i) => (
                    <motion.div
                      key={s.name}
                      className="flex-1 rounded-t-sm"
                      style={{ backgroundColor: s.color }}
                      initial={{ height: 0 }}
                      animate={{ height: `${(s.value / 2500) * 100}%` }}
                      transition={{ duration: 0.6, delay: 1 + i * 0.08 }}
                    />
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-3">
                <div className="text-[10px] text-[#A8A49A]/30 mb-2">Show Type Breakdown</div>
                <div className="space-y-1.5 mt-1">
                  {[
                    { type: 'Free Chat', pct: 88, color: '#10B981' },
                    { type: 'True Private', pct: 8, color: '#EC4899' },
                    { type: 'Member Chat', pct: 4, color: '#3B82F6' },
                  ].map((t, i) => (
                    <div key={t.type} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="text-[9px] text-[#A8A49A]/40 w-16">{t.type}</span>
                      <div className="flex-1 h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: t.color }}
                          initial={{ width: 0 }} animate={{ width: `${t.pct}%` }}
                          transition={{ duration: 0.8, delay: 1.2 + i * 0.1 }} />
                      </div>
                      <span className="text-[8px] text-[#A8A49A]/30 w-6 text-right">{t.pct}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div key="heatmaps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px]">
            <div className="text-sm font-medium text-white mb-4">Model Insights</div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-4 mb-4">
              <div className="text-[10px] text-[#A8A49A]/30 mb-3">Streaming Activity Heatmap</div>
              <div className="space-y-1">
                {HEATMAP_ROWS.map((row, ri) => (
                  <div key={row} className="flex items-center gap-1">
                    <span className="text-[8px] text-[#A8A49A]/25 w-6">{row}</span>
                    <div className="flex gap-0.5 flex-1">
                      {Array.from({ length: HEATMAP_COLS }).map((_, ci) => {
                        const val = heatmap[ri][ci];
                        return (
                          <motion.div
                            key={ci}
                            className="flex-1 h-4 md:h-5 rounded-sm"
                            style={{ backgroundColor: `rgba(201, 168, 76, ${val * 0.7})` }}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 + (ri * HEATMAP_COLS + ci) * 0.008 }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2 justify-end">
                <span className="text-[7px] text-[#A8A49A]/20">Less</span>
                {[0.1, 0.25, 0.45, 0.65, 0.85].map((v, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(201, 168, 76, ${v})` }} />
                ))}
                <span className="text-[7px] text-[#A8A49A]/20">More</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-3">
                <div className="text-[10px] text-[#A8A49A]/30 mb-2">Earnings Efficiency</div>
                <div className="flex items-end gap-2 h-20">
                  {[
                    { w: 'W6', bar: 85, line: 45 },
                    { w: 'W7', bar: 65, line: 50 },
                    { w: 'W8', bar: 78, line: 35 },
                    { w: 'W9', bar: 30, line: 20 },
                  ].map((d, i) => (
                    <div key={d.w} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center gap-0.5 h-14">
                        <motion.div className="w-2/5 bg-[#C9A84C] rounded-t-sm" initial={{ height: 0 }} animate={{ height: `${d.bar}%` }} transition={{ delay: 1 + i * 0.1, duration: 0.6 }} />
                        <motion.div className="w-2/5 bg-[#3B82F6] rounded-t-sm" initial={{ height: 0 }} animate={{ height: `${d.line}%` }} transition={{ delay: 1.1 + i * 0.1, duration: 0.6 }} />
                      </div>
                      <span className="text-[7px] text-[#A8A49A]/20">{d.w}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-3">
                <div className="text-[10px] text-[#A8A49A]/30 mb-2">Hours vs Revenue</div>
                <div className="relative h-20">
                  {[
                    { x: 15, y: 60, s: 4 }, { x: 22, y: 50, s: 5 }, { x: 30, y: 70, s: 3 },
                    { x: 38, y: 35, s: 6 }, { x: 45, y: 25, s: 7 }, { x: 55, y: 45, s: 5 },
                    { x: 62, y: 55, s: 4 }, { x: 70, y: 20, s: 8 }, { x: 80, y: 40, s: 5 },
                    { x: 88, y: 65, s: 3 },
                  ].map((dot, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full bg-[#C9A84C]"
                      style={{ left: `${dot.x}%`, bottom: `${100 - dot.y}%`, width: dot.s * 2, height: dot.s * 2 }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 0.6, scale: 1 }}
                      transition={{ delay: 1.2 + i * 0.06 }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-sm font-medium text-white">AI Performance Coach</span>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-4 mb-4">
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-14 h-14 rounded-full border-2 border-[#10B981] flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                >
                  <span className="text-xl font-bold text-white">81</span>
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">Performance Score</span>
                    <span className="text-[9px] px-2 py-0.5 bg-[#10B981]/15 text-[#10B981] rounded-full font-medium">Strong</span>
                  </div>
                  <p className="text-[10px] text-[#A8A49A]/35 leading-relaxed">Strong earnings of $10,226 over three weeks, but schedule consistency needs improvement.</p>
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                {[
                  { label: 'Schedule', score: 22, max: 25, color: '#C9A84C' },
                  { label: 'Private Mix', score: 16, max: 25, color: '#10B981' },
                  { label: 'Volume', score: 16, max: 20, color: '#3B82F6' },
                  { label: '$/Hour', score: 17, max: 20, color: '#EC4899' },
                  { label: 'Trend', score: 10, max: 10, color: '#A855F7' },
                ].map((s, i) => (
                  <div key={s.label} className="flex-1">
                    <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: s.color }}
                        initial={{ width: 0 }} animate={{ width: `${(s.score / s.max) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }} />
                    </div>
                    <div className="text-[7px] text-[#A8A49A]/25 mt-1 text-center">{s.label} {s.score}/{s.max}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3 h-3 text-[#C9A84C]" />
                <span className="text-[10px] text-white font-medium">Recommended Weekly Schedule</span>
                <span className="text-[8px] px-1.5 py-0.5 bg-[#10B981]/15 text-[#10B981] rounded-full">40h/week</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                  <motion.div key={d} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.05 }}
                    className="text-center p-2 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <div className="text-[8px] text-[#C9A84C] font-medium">{d}</div>
                    <div className="text-[7px] text-[#A8A49A]/30 mt-0.5">{['18-02', '20-02', '20-01', '20-01', '18-01', '19-02', '18-01'][i]}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="space-y-2">
              {AI_RECS.map((rec, i) => (
                <motion.div key={rec.title} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * 0.12 }}
                  className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: rec.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-white font-medium">{rec.title}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: rec.color + '20', color: rec.color }}>{rec.severity}</span>
                    </div>
                    <p className="text-[9px] text-[#A8A49A]/30 mt-0.5">{rec.impact}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
