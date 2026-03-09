"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, DollarSign, TrendingUp, Heart, Calendar, Clock, MessageSquare, User } from 'lucide-react';

const TIP_HISTORY = [
  { model: 'SweetAlexa', amount: '900 tk', date: 'Feb 16, 2026', time: '21:42' },
  { model: 'MidnightJade', amount: '500 tk', date: 'Feb 14, 2026', time: '19:15' },
  { model: 'SweetAlexa', amount: '350 tk', date: 'Feb 12, 2026', time: '22:08' },
  { model: 'RubyRose', amount: '200 tk', date: 'Feb 10, 2026', time: '20:33' },
  { model: 'MidnightJade', amount: '150 tk', date: 'Feb 8, 2026', time: '18:55' },
];

const TOP_MODELS = [
  { name: 'SweetAlexa', total: '$312', tips: 24 },
  { name: 'MidnightJade', total: '$195', tips: 16 },
  { name: 'RubyRose', total: '$87', tips: 8 },
  { name: 'LunaStar', total: '$62', tips: 5 },
  { name: 'DiamondKay', total: '$45', tips: 3 },
];

const CHAT_MESSAGES = [
  { text: 'amazing show tonight!', time: '21:42' },
  { text: 'you look stunning', time: '21:38' },
  { text: 'can we do a private?', time: '21:35' },
  { text: 'tipped for dance', time: '21:30' },
];

export default function MemberLookupAnimation({ color }: { color?: string }) {
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    const name = 'BigSpender69';

    for (let i = 0; i <= name.length; i++) {
      timers.push(setTimeout(() => setTypedText(name.slice(0, i)), 500 + i * 100));
    }
    timers.push(setTimeout(() => setSearching(true), 2200));
    timers.push(setTimeout(() => { setSearching(false); setPhase(1); }, 3500));

    timers.push(setTimeout(() => setPhase(2), 8500));
    timers.push(setTimeout(() => setPhase(3), 13500));

    const LOOP = 18000;
    timers.push(setTimeout(() => {
      setPhase(0); setTypedText(''); setSearching(false);
    }, LOOP));

    const loop = setInterval(() => {
      setPhase(0); setTypedText(''); setSearching(false);
      for (let i = 0; i <= name.length; i++) {
        setTimeout(() => setTypedText(name.slice(0, i)), 500 + i * 100);
      }
      setTimeout(() => setSearching(true), 2200);
      setTimeout(() => { setSearching(false); setPhase(1); }, 3500);
      setTimeout(() => setPhase(2), 8500);
      setTimeout(() => setPhase(3), 13500);
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
              <div className="text-sm font-medium text-white mb-1">Member Lookup</div>
              <p className="text-xs text-[#A8A49A]/30 mb-6">Search cam site members by username to view their tipping stats and history.</p>
              <div className="flex gap-2 mb-4">
                <div className="px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.06] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#006E00]" />
                  <span className="text-xs text-[#A8A49A]/50">MyFreeCams</span>
                </div>
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-lg border border-[#C9A84C]/20">
                  <Search className="w-3.5 h-3.5 text-[#A8A49A]/20" />
                  <span className="text-xs text-white font-mono">
                    {typedText}
                    <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-[#C9A84C]">|</motion.span>
                  </span>
                </div>
                <motion.button className="px-4 py-2 bg-[#C9A84C] text-black text-xs font-medium rounded-lg flex items-center gap-1.5"
                  animate={searching ? { scale: [1, 0.97, 1] } : {}}>
                  <Search className="w-3 h-3" /> Lookup
                </motion.button>
              </div>
              {searching && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 py-12">
                  <div className="w-5 h-5 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-[#A8A49A]/30">Searching member data...</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px]">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl border border-white/[0.05] mb-4">
              <div className="w-10 h-10 bg-white/[0.05] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-[#A8A49A]/30" />
              </div>
              <div>
                <span className="text-sm text-white font-medium">bigspender69</span>
                <span className="ml-2 text-[8px] px-2 py-0.5 bg-[#006E00]/15 text-[#006E00] rounded-full">MyFreeCams</span>
                <div className="text-[9px] text-[#A8A49A]/25">Data since 05/01/2025</div>
              </div>
            </motion.div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-5">
              {[
                { icon: DollarSign, label: 'All-Time Tokens', value: '11,421', sub: '\u2248 $571', color: '#C9A84C' },
                { icon: TrendingUp, label: 'Last Tip', value: '900 tk', sub: '16/02/2026', color: '#10B981' },
                { icon: Heart, label: 'Models Tipped', value: '5', sub: '36 messages', color: '#EC4899' },
                { icon: Calendar, label: 'First Tip', value: '05/01/2025', sub: '', color: '#3B82F6' },
                { icon: Clock, label: 'Last Active', value: '18/02/2026', sub: '', color: '#A855F7' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.12 }}
                  className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                  <div className="flex items-center gap-1 mb-1">
                    <s.icon className="w-3 h-3" style={{ color: s.color }} />
                    <span className="text-[7px] text-[#A8A49A]/25 uppercase tracking-wider">{s.label}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{s.value}</div>
                  {s.sub && <div className="text-[8px] text-[#A8A49A]/20 mt-0.5">{s.sub}</div>}
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
              className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-[#C9A84C]" />
                <span className="text-[10px] text-white font-medium">Daily Token Spending</span>
              </div>
              <div className="h-24 relative">
                <svg className="w-full h-full" viewBox="0 0 400 96" preserveAspectRatio="none">
                  <motion.path
                    d="M0,90 C40,88 60,85 100,70 C140,55 160,30 200,20 C240,10 260,25 300,40 C340,55 360,50 400,60"
                    fill="none" stroke="#C9A84C" strokeWidth="2"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, delay: 1.2 }}
                  />
                  <motion.path
                    d="M0,90 C40,88 60,85 100,70 C140,55 160,30 200,20 C240,10 260,25 300,40 C340,55 360,50 400,60 L400,96 L0,96 Z"
                    fill="url(#spendGrad)"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 0.6 }}
                  />
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div key="tips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <span className="text-xs text-white font-medium">Tip History</span>
                </div>
                <div className="space-y-1.5">
                  {TIP_HISTORY.map((tip, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.15 }}
                      className="flex items-center gap-2 p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                      <div className="w-6 h-6 bg-[#EC4899]/10 rounded-full flex items-center justify-center">
                        <Heart className="w-3 h-3 text-[#EC4899]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-white">{tip.model}</span>
                        <div className="text-[8px] text-[#A8A49A]/20">{tip.date} &bull; {tip.time}</div>
                      </div>
                      <span className="text-xs font-semibold text-[#C9A84C]">{tip.amount}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-3.5 h-3.5 text-[#EC4899]" />
                  <span className="text-xs text-white font-medium">Top Models Tipped</span>
                </div>
                <div className="space-y-1.5">
                  {TOP_MODELS.map((m, i) => (
                    <motion.div key={m.name} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.15 }}
                      className="flex items-center gap-3 p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                      <span className="text-[9px] text-[#A8A49A]/20 w-4">#{i + 1}</span>
                      <span className="text-[10px] text-white flex-1">{m.name}</span>
                      <span className="text-[9px] text-[#A8A49A]/25">{m.tips} tips</span>
                      <span className="text-xs font-semibold text-[#10B981]">{m.total}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 3 && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px]">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-xs text-white font-medium">Chat History</span>
              <span className="text-[9px] text-[#A8A49A]/20">in SweetAlexa&apos;s room</span>
            </div>
            <div className="max-w-md space-y-2">
              {CHAT_MESSAGES.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.2 }}
                  className="flex items-start gap-2.5 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                  <div className="w-7 h-7 bg-[#EC4899]/10 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-[#EC4899]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#EC4899] font-medium">BigSpender69</span>
                      <span className="text-[8px] text-[#A8A49A]/15">{msg.time}</span>
                    </div>
                    <p className="text-xs text-[#A8A49A]/50 mt-0.5">{msg.text}</p>
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
