"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Plus, DollarSign } from 'lucide-react';

const TELEGRAM_ALERTS = [
  {
    room: "alexa_diamond's room",
    site: 'Stripchat',
    member: 'carquinyoli69',
    allTime: '6,946 tk ($347)',
    threeMonth: '316 tk ($16)',
    lastMonth: '1 tk ($0)',
    minThreshold: '$20',
    time: '23:18',
  },
  {
    room: "alexa_diamond's room",
    site: 'Myfreecams',
    member: 'diamonds4',
    allTime: '8,785 tk ($439)',
    threeMonth: '1,330 tk ($67)',
    lastMonth: '5 tk ($0)',
    minThreshold: '$100',
    time: '23:19',
  },
  {
    room: "mia_velvet's room",
    site: 'Myfreecams',
    member: 'kevinmc12345',
    allTime: '15,609 tk ($780)',
    threeMonth: '3,869 tk ($193)',
    lastMonth: '1,209 tk ($60)',
    minThreshold: '$100',
    time: '23:20',
  },
];

export default function MemberAlertsAnimation({ color }: { color?: string }) {
  const [phase, setPhase] = useState(0);
  const [connectStep, setConnectStep] = useState(0);
  const [alertIdx, setAlertIdx] = useState(-1);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    timers.push(setTimeout(() => setConnectStep(1), 1000));
    timers.push(setTimeout(() => setConnectStep(2), 3000));
    timers.push(setTimeout(() => setConnectStep(3), 5000));
    timers.push(setTimeout(() => setConnectStep(4), 7500));

    timers.push(setTimeout(() => setPhase(1), 10500));

    timers.push(setTimeout(() => setPhase(2), 16500));
    timers.push(setTimeout(() => setAlertIdx(0), 17500));
    timers.push(setTimeout(() => setAlertIdx(1), 21000));
    timers.push(setTimeout(() => setAlertIdx(2), 24500));

    const LOOP = 28500;
    timers.push(setTimeout(() => {
      setPhase(0); setConnectStep(0); setAlertIdx(-1);
    }, LOOP));

    const loop = setInterval(() => {
      setPhase(0); setConnectStep(0); setAlertIdx(-1);
      setTimeout(() => setConnectStep(1), 1000);
      setTimeout(() => setConnectStep(2), 3000);
      setTimeout(() => setConnectStep(3), 5000);
      setTimeout(() => setConnectStep(4), 7500);
      setTimeout(() => setPhase(1), 10500);
      setTimeout(() => setPhase(2), 16500);
      setTimeout(() => setAlertIdx(0), 17500);
      setTimeout(() => setAlertIdx(1), 21000);
      setTimeout(() => setAlertIdx(2), 24500);
    }, LOOP);

    return () => { timers.forEach(clearTimeout); clearInterval(loop); };
  }, []);

  return (
    <div className="p-4 md:p-6">
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div key="telegram" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="min-h-[380px] md:min-h-[440px] flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              <div className="text-sm font-medium text-white mb-1">Member Alerts</div>
              <p className="text-xs text-[#A8A49A]/30 mb-6">Get real-time Telegram alerts when high-spending members enter your monitored rooms.</p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="p-5 bg-white/[0.03] rounded-2xl border border-white/[0.06] mb-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-[#0088cc]/15 rounded-xl flex items-center justify-center">
                    <Send className="w-4 h-4 text-[#0088cc]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white font-medium">Telegram Bot Connection</span>
                      <AnimatePresence>
                        {connectStep >= 3 && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-[8px] px-2 py-0.5 bg-[#10B981]/15 text-[#10B981] rounded-full font-semibold"
                          >Connected</motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="text-[9px] text-[#A8A49A]/25 mt-0.5">
                      {connectStep < 3
                        ? 'Connect your Telegram account to receive real-time alerts when tracked members come online or tip in your room.'
                        : ''
                      }
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {connectStep >= 1 && connectStep < 2 && (
                    <motion.div
                      key="connect-btn"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                    >
                      <motion.button
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#0088cc] text-white text-xs font-medium rounded-xl"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        Connect Telegram Bot
                      </motion.button>
                      <p className="text-[8px] text-[#A8A49A]/20 mt-2">You&apos;ll be redirected to Telegram to start the bot</p>
                    </motion.div>
                  )}

                  {connectStep === 2 && (
                    <motion.div
                      key="connecting"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                      className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl"
                    >
                      <div className="w-5 h-5 border-2 border-[#0088cc] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-[#A8A49A]/40">Connecting to Telegram...</span>
                    </motion.div>
                  )}

                  {connectStep >= 3 && (
                    <motion.div
                      key="connected"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl mb-3">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                          className="w-8 h-8 bg-[#10B981]/15 rounded-full flex items-center justify-center"
                        >
                          <CheckCircle className="w-4 h-4 text-[#10B981]" />
                        </motion.div>
                        <div className="flex-1">
                          <div className="text-xs text-white font-medium">Telegram connected</div>
                          <div className="text-[9px] text-[#A8A49A]/25">@yourstudio</div>
                        </div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex gap-2"
                      >
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] rounded-lg text-[10px] text-[#A8A49A]/50 border border-white/[0.06]">
                          <Send className="w-3 h-3" /> Send Test
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/5 rounded-lg text-[10px] text-red-400/60 border border-red-500/10">
                          &#10005; Disconnect
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {connectStep >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="p-5 bg-white/[0.03] rounded-2xl border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">&#9889;</span>
                      <span className="text-xs text-white font-medium">How Room Alerts Work</span>
                    </div>
                    <p className="text-[10px] text-[#A8A49A]/35 leading-relaxed mb-4">
                      When a member enters one of your monitored rooms, we automatically check their all-time spending history. If their spending is above your configured threshold, you&apos;ll instantly receive a detailed Telegram notification.
                    </p>
                    <div className="flex gap-2">
                      {[
                        { icon: '\u{1F464}', label: 'Member Enters Room', sub: 'Detected automatically' },
                        { icon: '\u{1F4B0}', label: 'Spending Checked', sub: 'All-time, 3mo, 1mo' },
                        { icon: '\u{1F514}', label: 'Telegram Alert', sub: 'Instant notification' },
                      ].map((step, i) => (
                        <motion.div key={step.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.15 }}
                          className="text-center p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] flex-1"
                        >
                          <div className="text-base mb-1.5">{step.icon}</div>
                          <div className="text-[9px] text-white font-medium leading-tight">{step.label}</div>
                          <div className="text-[7px] text-[#A8A49A]/20 mt-0.5">{step.sub}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div key="rooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="min-h-[380px] md:min-h-[440px] flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              <div className="text-sm font-medium text-white mb-1">Monitored Rooms</div>
              <p className="text-xs text-[#A8A49A]/30 mb-5">Choose which rooms to monitor and set spending thresholds for alerts.</p>

              {[
                { model: 'alexa_diamond', platforms: ['Chaturbate', 'MyFreeCams', 'StripChat'], threshold: '$20', members: 142 },
                { model: 'mia_velvet', platforms: ['StripChat', 'BongaCams', 'Myfreecams'], threshold: '$100', members: 89 },
              ].map((room, i) => (
                <motion.div key={room.model}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.5, duration: 0.5 }}
                  className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.05] mb-3"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#C9A84C]/10 rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-[#C9A84C] font-bold">{room.model[0].toUpperCase()}</span>
                      </div>
                      <span className="text-xs text-white font-medium">{room.model}</span>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-[#10B981]/10 text-[#10B981] rounded-full">Active</span>
                  </div>
                  <div className="flex gap-1.5 mb-2.5 flex-wrap">
                    {room.platforms.map(p => (
                      <span key={p} className="text-[8px] px-2 py-0.5 bg-white/[0.04] rounded text-[#A8A49A]/40">{p}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-[#C9A84C]/50" />
                      <span className="text-[9px] text-[#A8A49A]/30">Min threshold: </span>
                      <span className="text-[9px] text-[#C9A84C] font-semibold">{room.threshold}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-[#A8A49A]/20">{room.members} tracked members</span>
                    </div>
                  </div>
                </motion.div>
              ))}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
                className="flex items-center gap-2 p-3 bg-white/[0.02] rounded-xl border border-dashed border-white/[0.06]">
                <Plus className="w-4 h-4 text-[#C9A84C]/40" />
                <span className="text-xs text-[#A8A49A]/30">Add Room to Monitor</span>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}
                className="mt-4 flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                <span className="text-[10px] text-[#A8A49A]/30">Monitoring Capacity</span>
                <div className="flex-1" />
                <span className="text-xs font-medium text-white">2 / 5</span>
                <div className="w-16 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div className="h-full bg-[#C9A84C] rounded-full" initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ delay: 3.2, duration: 0.8 }} />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-[380px] md:min-h-[440px] flex flex-col items-center justify-start">
            <div className="w-full max-w-md">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3 px-4 py-3 bg-[#17212B] rounded-t-2xl border-b border-[#0E1621]"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#E8D48B] flex items-center justify-center shadow-lg shadow-[#C9A84C]/10">
                  <Send className="w-4.5 h-4.5 text-black" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white font-medium leading-tight">StudioOS Alerts</div>
                  <div className="text-[10px] text-[#6C7883]">bot</div>
                </div>
                <div className="flex items-center gap-4 text-[#6C7883]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
                </div>
              </motion.div>

              <div className="bg-[#0E1621] rounded-b-2xl px-4 py-3 min-h-[310px] md:min-h-[360px] overflow-hidden">
                {TELEGRAM_ALERTS.map((alert, i) => (
                  <AnimatePresence key={alert.member}>
                    {alertIdx >= i && (
                      <motion.div
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        {i > 0 && (
                          <div className="py-2 my-1">
                            <div className="h-[1px] bg-[#1D2A3A]" />
                          </div>
                        )}

                        <div className="relative">
                          <div className="absolute top-0 right-0 text-[10px] text-[#6C7883]">{alert.time}</div>

                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[13px]">&#128276;</span>
                            <span className="text-[13px] text-white font-medium leading-tight">
                              Spender in {alert.room}
                            </span>
                            <span className="text-[11px] text-[#6C7883]">({alert.site})</span>
                          </div>

                          <div className="flex items-center gap-1.5 mb-2.5 ml-1">
                            <span className="text-[12px]">&#128100;</span>
                            <span className="text-[13px] text-white font-medium">{alert.member}</span>
                            <span className="text-[12px] text-[#6C7883]">just entered</span>
                          </div>

                          <div className="ml-1 space-y-[2px] mb-2">
                            <div className="text-[12px] font-mono leading-relaxed">
                              <span className="text-[#6C7883]">All-time:{'    '}</span>
                              <span className="text-[#D4D7DA]">{alert.allTime}</span>
                            </div>
                            <div className="text-[12px] font-mono leading-relaxed">
                              <span className="text-[#6C7883]">3 months:{'   '}</span>
                              <span className="text-[#D4D7DA]">{alert.threeMonth}</span>
                            </div>
                            <div className="text-[12px] font-mono leading-relaxed">
                              <span className="text-[#6C7883]">Last month: </span>
                              <span className="text-[#D4D7DA]">{alert.lastMonth}</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-[#C9A84C]/70 italic ml-1">
                            (min {alert.minThreshold})
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
