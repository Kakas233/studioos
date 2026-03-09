"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BarChart3, Clock, Users, User, Eye } from 'lucide-react';

const STATS_DATA = [
  { label: 'Avg. Viewers', value: '342', trend: '+12%', color: '#10B981' },
  { label: 'Total Tips (30d)', value: '$4,820', trend: '+8%', color: '#C9A84C' },
  { label: 'Stream Hours', value: '186h', trend: '-3%', color: '#3B82F6' },
  { label: 'Top Rank', value: '#24', trend: '+5', color: '#A855F7' },
];

const TOP_TIPPERS = [
  { name: 'WhaleKing99', total: '$2,180', tips: 48 },
  { name: 'DiamondDave', total: '$1,420', tips: 35 },
  { name: 'BigSpender69', total: '$890', tips: 22 },
  { name: 'TipMachine', total: '$650', tips: 18 },
  { name: 'RoyalGuest', total: '$420', tips: 12 },
];

const SESSION_LOG = [
  { date: 'Feb 17', start: '20:00', end: '02:30', duration: '6h 30m', platform: 'Chaturbate' },
  { date: 'Feb 16', start: '19:00', end: '01:00', duration: '6h 00m', platform: 'StripChat' },
  { date: 'Feb 15', start: '21:00', end: '03:00', duration: '6h 00m', platform: 'Chaturbate' },
  { date: 'Feb 14', start: '18:00', end: '00:30', duration: '6h 30m', platform: 'MyFreeCams' },
];

const HEATMAP_DATA = Array.from({ length: 7 }, (_, r) =>
  Array.from({ length: 24 }, (_, c) => {
    const isEvening = c >= 18 || c <= 3;
    const base = isEvening ? 0.4 + Math.random() * 0.6 : Math.random() * 0.2;
    return base;
  })
);

export default function ModelLookupAnimation({ color }: { color?: string }) {
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    const name = 'CompetitorModel';

    for (let i = 0; i <= name.length; i++) {
      timers.push(setTimeout(() => setTypedText(name.slice(0, i)), 500 + i * 80));
    }
    timers.push(setTimeout(() => setSearching(true), 2200));
    timers.push(setTimeout(() => { setSearching(false); setPhase(1); }, 3500));
    timers.push(setTimeout(() => setPhase(2), 9000));
    timers.push(setTimeout(() => setPhase(3), 14000));

    const LOOP = 19000;
    timers.push(setTimeout(() => {
      setPhase(0); setTypedText(''); setSearching(false);
    }, LOOP));

    const loop = setInterval(() => {
      setPhase(0); setTypedText(''); setSearching(false);
      for (let i = 0; i <= name.length; i++) {
        setTimeout(() => setTypedText(name.slice(0, i)), 500 + i * 80);
      }
      setTimeout(() => setSearching(true), 2200);
      setTimeout(() => { setSearching(false); setPhase(1); }, 3500);
      setTimeout(() => setPhase(2), 9000);
      setTimeout(() => setPhase(3), 14000);
    }, LOOP);

    return () => { timers.forEach(clearTimeout); clearInterval(loop); };
  }, []);

  return (
    <div className="p-4 md:p-6">
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-[380px] md:min-h-[440px] flex flex-col items-center justify-center">
            <div className="w-full max-w-lg">
              <div className="text-sm font-medium text-white mb-1">Model Lookup</div>
              <p className="text-xs text-[#A8A49A]/30 mb-6">Search any cam model across all major platforms.</p>
              <div className="flex gap-2 mb-4">
                <div className="px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.06] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#F47421]" />
                  <span className="text-xs text-[#A8A49A]/50">Chaturbate</span>
                </div>
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-lg border border-[#06B6D4]/20">
                  <Search className="w-3.5 h-3.5 text-[#A8A49A]/20" />
                  <span className="text-xs text-white font-mono">
                    {typedText}
                    <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-[#06B6D4]">|</motion.span>
                  </span>
                </div>
                <motion.button className="px-4 py-2 bg-[#C9A84C] text-black text-xs font-medium rounded-lg flex items-center gap-1.5"
                  animate={searching ? { scale: [1, 0.97, 1] } : {}}>
                  <Eye className="w-3 h-3" /> Lookup
                </motion.button>
              </div>
              {searching && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 py-12">
                  <div className="w-5 h-5 border-2 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-[#A8A49A]/30">Loading model data...</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px]">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-xl border border-white/[0.05] mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#06B6D4]/20 to-[#A855F7]/20 rounded-xl flex items-center justify-center border border-white/[0.08]">
                <User className="w-7 h-7 text-[#A8A49A]/20" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base text-white font-medium">CompetitorModel</span>
                  <span className="text-[8px] px-2 py-0.5 bg-[#F47421]/15 text-[#F47421] rounded-full">Chaturbate</span>
                </div>
                <div className="text-[10px] text-[#A8A49A]/25 mt-0.5">Female &bull; 26 &bull; Active since 2023</div>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                <span className="text-[9px] text-[#10B981]">Online Now</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
              {STATS_DATA.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.12 }}
                  className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                  <div className="text-[8px] text-[#A8A49A]/25 uppercase tracking-wider mb-1">{s.label}</div>
                  <div className="flex items-end gap-1.5">
                    <span className="text-sm font-semibold text-white">{s.value}</span>
                    <span className="text-[9px] font-medium" style={{ color: s.color }}>{s.trend}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
              className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-4">
              <div className="text-[10px] text-[#A8A49A]/30 mb-2">Hourly Activity Heatmap</div>
              <div className="space-y-0.5">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, ri) => (
                  <div key={day} className="flex items-center gap-1">
                    <span className="text-[7px] text-[#A8A49A]/15 w-5">{day}</span>
                    <div className="flex gap-px flex-1">
                      {HEATMAP_DATA[ri].map((val, ci) => (
                        <motion.div key={ci} className="flex-1 h-3 rounded-[1px]"
                          style={{ backgroundColor: `rgba(6, 182, 212, ${val * 0.7})` }}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: 1.2 + (ri * 24 + ci) * 0.004 }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div key="tippers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <span className="text-xs text-white font-medium">Top Members</span>
                </div>
                <div className="space-y-1.5">
                  {TOP_TIPPERS.map((t, i) => (
                    <motion.div key={t.name} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.15 }}
                      className="flex items-center gap-2.5 p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                      <span className="text-[9px] text-[#C9A84C] font-bold w-4">#{i + 1}</span>
                      <div className="w-6 h-6 bg-[#C9A84C]/10 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-[#C9A84C]" />
                      </div>
                      <span className="text-[10px] text-white flex-1">{t.name}</span>
                      <span className="text-[9px] text-[#A8A49A]/25">{t.tips} tips</span>
                      <span className="text-xs font-semibold text-[#10B981]">{t.total}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span className="text-xs text-white font-medium">Recent Sessions</span>
                </div>
                <div className="space-y-1.5">
                  {SESSION_LOG.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.15 }}
                      className="flex items-center gap-2.5 p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                      <div className="w-6 h-6 bg-[#3B82F6]/10 rounded-full flex items-center justify-center">
                        <Clock className="w-3 h-3 text-[#3B82F6]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-white">{s.date}</span>
                        <div className="text-[8px] text-[#A8A49A]/20">{s.start} – {s.end}</div>
                      </div>
                      <span className="text-[8px] px-1.5 py-0.5 bg-white/[0.04] rounded text-[#A8A49A]/30">{s.platform}</span>
                      <span className="text-xs font-medium text-[#3B82F6]">{s.duration}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 3 && (
          <motion.div key="income" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px]">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-xs text-white font-medium">Income & Rankings</span>
            </div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-4 mb-4">
              <div className="text-[10px] text-[#A8A49A]/30 mb-2">Daily Income (30d)</div>
              <div className="flex items-end gap-px h-28">
                {Array.from({ length: 30 }).map((_, i) => {
                  const h = 10 + Math.random() * 80;
                  return (
                    <motion.div key={i} className="flex-1 rounded-t-sm bg-[#06B6D4]"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${h}%`, opacity: 0.2 + (h / 100) * 0.6 }}
                      transition={{ duration: 0.5, delay: 0.5 + i * 0.03 }}
                    />
                  );
                })}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
              className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-4">
              <div className="text-[10px] text-[#A8A49A]/30 mb-3">Similar Models</div>
              <div className="grid grid-cols-4 gap-2">
                {['SimilarModel1', 'SimilarModel2', 'SimilarModel3', 'SimilarModel4'].map((m, i) => (
                  <motion.div key={m} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5 + i * 0.12 }}
                    className="text-center p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#06B6D4]/15 to-[#A855F7]/15 rounded-xl flex items-center justify-center mx-auto mb-2 border border-white/[0.06]">
                      <User className="w-5 h-5 text-[#A8A49A]/15" />
                    </div>
                    <div className="text-[9px] text-white truncate">{m}</div>
                    <div className="text-[8px] text-[#A8A49A]/20">Chaturbate</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
