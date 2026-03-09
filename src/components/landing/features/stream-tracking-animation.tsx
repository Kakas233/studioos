"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Eye, Lock, Users, Clock } from 'lucide-react';

const PLATFORMS = [
  { name: 'Chaturbate', color: '#F47421' },
  { name: 'StripChat', color: '#A2242D' },
  { name: 'LiveJasmin', color: '#BA0000' },
  { name: 'MyFreeCams', color: '#006E00' },
];

const STREAM_LOGS = [
  { name: 'YourModel', day: 'Tue, Feb 17', platform: 'Chaturbate', time: '4h 33m online', barWidth: '85%', colors: ['#10B981', '#EC4899'] },
  { name: 'YourModel', day: 'Tue, Feb 17', platform: 'StripChat', time: '2h 10m online', barWidth: '55%', colors: ['#10B981', '#A855F7'] },
  { name: 'YourModel', day: 'Mon, Feb 16', platform: 'MyFreeCams', time: '1h 52m online', barWidth: '45%', colors: ['#10B981', '#EC4899'] },
  { name: 'YourModel', day: 'Mon, Feb 16', platform: 'LiveJasmin', time: '3h 20m online', barWidth: '70%', colors: ['#10B981'] },
  { name: 'YourModel', day: 'Sun, Feb 15', platform: 'Chaturbate', time: '58m online', barWidth: '25%', colors: ['#10B981'] },
];

const DAILY_BARS = [
  { day: 'Feb 11', heights: [40, 8, 5], total: 53 },
  { day: 'Feb 12', heights: [55, 18, 12], total: 85 },
  { day: 'Feb 13', heights: [35, 10, 8], total: 53 },
  { day: 'Feb 14', heights: [25, 14, 6], total: 45 },
  { day: 'Feb 15', heights: [30, 5, 3], total: 38 },
  { day: 'Feb 16', heights: [32, 8, 4], total: 44 },
  { day: 'Feb 17', heights: [38, 6, 3], total: 47 },
];

export default function StreamTrackingAnimation({ color }: { color?: string }) {
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [platformIdx, setPlatformIdx] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    const name = 'YourModel';

    for (let i = 0; i <= name.length; i++) {
      timers.push(setTimeout(() => setTypedText(name.slice(0, i)), 600 + i * 120));
    }

    timers.push(setTimeout(() => setPlatformIdx(1), 2200));
    timers.push(setTimeout(() => setPlatformIdx(2), 3200));
    timers.push(setTimeout(() => setPlatformIdx(3), 4200));
    timers.push(setTimeout(() => setPlatformIdx(4), 5200));

    timers.push(setTimeout(() => setPhase(1), 6800));
    timers.push(setTimeout(() => setPhase(2), 12000));

    const LOOP_TIME = 17000;
    timers.push(setTimeout(() => {
      setPhase(0); setTypedText(''); setPlatformIdx(0);
    }, LOOP_TIME));

    const loop = setInterval(() => {
      setPhase(0); setTypedText(''); setPlatformIdx(0);
      for (let i = 0; i <= name.length; i++) {
        setTimeout(() => setTypedText(name.slice(0, i)), 600 + i * 120);
      }
      setTimeout(() => setPlatformIdx(1), 2200);
      setTimeout(() => setPlatformIdx(2), 3200);
      setTimeout(() => setPlatformIdx(3), 4200);
      setTimeout(() => setPlatformIdx(4), 5200);
      setTimeout(() => setPhase(1), 6800);
      setTimeout(() => setPhase(2), 12000);
    }, LOOP_TIME);

    return () => { timers.forEach(clearTimeout); clearInterval(loop); };
  }, []);

  return (
    <div className="p-4 md:p-6">
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div
            key="typing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="min-h-[380px] md:min-h-[440px] flex flex-col items-center justify-center"
          >
            <div className="w-full max-w-lg">
              <div className="text-sm text-white font-medium mb-1">Cam Accounts</div>
              <p className="text-xs text-[#A8A49A]/30 mb-6">Add your model&apos;s usernames to start tracking automatically</p>

              {PLATFORMS.slice(0, platformIdx).map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-3 mb-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]"
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-[#A8A49A]/60 w-20">{p.name}</span>
                  <div className="flex-1 bg-white/[0.04] rounded-lg px-3 py-1.5 border border-white/[0.06]">
                    <span className="text-xs text-white/80 font-mono">
                      {typedText}
                      <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-[#C9A84C]">|</motion.span>
                    </span>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="w-6 h-6 bg-[#10B981]/20 rounded-full flex items-center justify-center"
                  >
                    <span className="text-[#10B981] text-[10px]">&#10003;</span>
                  </motion.div>
                </motion.div>
              ))}

              {platformIdx >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 text-center"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl">
                    <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                    <span className="text-xs text-[#10B981]">Tracking started — fetching 30 days of history...</span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-white">Stream Time</div>
              <div className="px-2.5 py-1 bg-white/[0.03] rounded-lg border border-white/[0.05] text-[10px] text-[#A8A49A]/40">Feb 11 &rarr; Feb 17</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { icon: Wifi, label: 'Unique Online Time', value: '36h 11m', color: '#10B981' },
                { icon: Eye, label: 'Free Chat', value: '50h 29m', color: '#A855F7' },
                { icon: Lock, label: 'Private Shows', value: '10h 10m', color: '#EC4899' },
                { icon: Users, label: 'Group Shows', value: '3h 55m', color: '#06B6D4' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.15 }}
                  className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <stat.icon className="w-3 h-3" style={{ color: stat.color }} />
                    <span className="text-[9px] text-[#A8A49A]/30 uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.15 }}
                    className="text-base font-semibold" style={{ color: stat.color }}>
                    {stat.value}
                  </motion.span>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-4">
              <div className="text-[10px] text-[#A8A49A]/30 mb-3">Daily Stream Hours by Show Type</div>
              <div className="flex items-end gap-2 h-32">
                {DAILY_BARS.map((bar, i) => (
                  <div key={bar.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col-reverse gap-0.5 h-24">
                      {bar.heights.map((h, j) => (
                        <motion.div key={j} className="w-full rounded-sm"
                          style={{ backgroundColor: ['#10B981', '#EC4899', '#A855F7'][j] }}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 1, delay: 1 + i * 0.1 + j * 0.06 }}
                        />
                      ))}
                    </div>
                    <span className="text-[8px] text-[#A8A49A]/20">{bar.day.split(' ')[1]}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 justify-center">
                {[{ label: 'Free Chat', color: '#10B981' }, { label: 'Private', color: '#EC4899' }, { label: 'Group', color: '#A855F7' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
                    <span className="text-[8px] text-[#A8A49A]/30">{l.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px]">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-sm font-medium text-white">Stream Log</span>
              <span className="text-[10px] px-2 py-0.5 bg-white/[0.04] rounded-md text-[#A8A49A]/40">18 entries</span>
            </div>
            <div className="space-y-2">
              {STREAM_LOGS.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.15 }}
                  className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                  <div className="w-8 h-8 bg-[#C9A84C]/10 rounded-full flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-[#C9A84C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/80 font-medium">{log.name}</span>
                      <span className="text-[10px] text-[#A8A49A]/25">{log.day}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-white/[0.04] rounded text-[#A8A49A]/40">{log.platform}</span>
                    </div>
                    <span className="text-[10px] text-[#10B981]">{log.time}</span>
                  </div>
                  <div className="w-24 md:w-32 h-2.5 bg-white/[0.03] rounded-full overflow-hidden flex">
                    {log.colors.map((c, ci) => (
                      <motion.div key={ci} className="h-full" style={{ backgroundColor: c }}
                        initial={{ width: 0 }} animate={{ width: ci === 0 ? log.barWidth : '15%' }}
                        transition={{ duration: 1, delay: 0.6 + i * 0.12 }}
                      />
                    ))}
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
