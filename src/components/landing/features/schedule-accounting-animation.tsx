"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DATES = ['Feb 23', 'Feb 24', 'Feb 25', 'Feb 26', 'Feb 27', 'Feb 28', 'Mar 1'];
const HOURS = ['8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM'];

const SHIFTS = [
  { day: 0, startHour: 1, spanHours: 2, model: 'Alexa', time: '09:00 – 11:00', color: '#C9A84C' },
  { day: 3, startHour: 1, spanHours: 2, model: 'Kait', time: '09:00 – 11:00', color: '#C9A84C' },
];

const SITES = ['MyFreeCams', 'Chaturbate', 'StripChat', 'BongaCams', 'Cam4', 'CamSoda', 'Flirt4Free', 'LiveJasmin'];

export default function ScheduleAccountingAnimation({ color }: { color?: string }) {
  const [phase, setPhase] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [showShift, setShowShift] = useState(false);
  const [tokenValues, setTokenValues] = useState<Record<string, number>>({});

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    timers.push(setTimeout(() => setShowModal(true), 1200));
    timers.push(setTimeout(() => setFormStep(1), 2000));
    timers.push(setTimeout(() => setFormStep(2), 2600));
    timers.push(setTimeout(() => setFormStep(3), 3200));
    timers.push(setTimeout(() => setFormStep(4), 3800));
    timers.push(setTimeout(() => { setShowModal(false); setShowShift(true); }, 4400));

    timers.push(setTimeout(() => setPhase(1), 5800));

    const tokens = { MyFreeCams: 4200, Chaturbate: 3100, StripChat: 1800 };
    timers.push(setTimeout(() => setTokenValues(tokens), 6800));

    timers.push(setTimeout(() => setPhase(2), 9000));

    timers.push(setTimeout(() => {
      setPhase(0);
      setShowModal(false);
      setShowShift(false);
      setFormStep(0);
      setTokenValues({});
    }, 12500));

    const loop = setInterval(() => {
      setPhase(0); setShowModal(false); setShowShift(false); setFormStep(0); setTokenValues({});
      setTimeout(() => setShowModal(true), 1200);
      setTimeout(() => setFormStep(1), 2000);
      setTimeout(() => setFormStep(2), 2600);
      setTimeout(() => setFormStep(3), 3200);
      setTimeout(() => setFormStep(4), 3800);
      setTimeout(() => { setShowModal(false); setShowShift(true); }, 4400);
      setTimeout(() => setPhase(1), 5800);
      const t2 = { MyFreeCams: 4200, Chaturbate: 3100, StripChat: 1800 };
      setTimeout(() => setTokenValues(t2), 6800);
      setTimeout(() => setPhase(2), 9000);
    }, 12500);

    return () => { timers.forEach(clearTimeout); clearInterval(loop); };
  }, []);

  return (
    <div className="p-4 md:p-6">
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px] relative">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-white">Week of Feb 23 – Mar 1, 2026</div>
              <motion.button
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A84C] text-black text-xs font-medium rounded-lg"
                animate={!showModal ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Plus className="w-3 h-3" /> Add Shift
              </motion.button>
            </div>

            <div className="bg-white/[0.02] rounded-xl border border-white/[0.04] overflow-hidden">
              <div className="grid grid-cols-8 border-b border-white/[0.04]">
                <div className="p-2 text-[9px] text-[#A8A49A]/20">Time</div>
                {DAYS.map((d, i) => (
                  <div key={d} className="p-2 text-center border-l border-white/[0.04]">
                    <div className="text-[9px] font-medium text-white/60">{d}</div>
                    <div className="text-[8px] text-[#A8A49A]/20">{DATES[i]}</div>
                  </div>
                ))}
              </div>

              {HOURS.map((hour, hi) => (
                <div key={hour} className="grid grid-cols-8 border-b border-white/[0.03] last:border-0">
                  <div className="p-2 text-[8px] text-[#A8A49A]/15">{hour}</div>
                  {DAYS.map((_, di) => {
                    const shift = SHIFTS.find(s => s.day === di && s.startHour === hi);
                    const newShift = showShift && di === 4 && hi === 3;
                    const isOccupied = SHIFTS.some(s => s.day === di && hi > s.startHour && hi < s.startHour + s.spanHours);
                    const isNewOccupied = showShift && di === 4 && hi > 3 && hi < 6;
                    if (isOccupied || isNewOccupied) return <div key={di} className="border-l border-white/[0.03]" />;
                    return (
                      <div key={di} className="p-1 border-l border-white/[0.03] min-h-[32px] relative">
                        {shift && (
                          <div
                            className="absolute left-1 right-1 top-1 rounded-lg p-2 z-[2] overflow-hidden"
                            style={{
                              backgroundColor: shift.color + '25',
                              border: `1px solid ${shift.color}40`,
                              height: `calc(${shift.spanHours * 100}% + ${(shift.spanHours - 1) * 1}px - 4px)`
                            }}
                          >
                            <div className="text-[7px] text-[#C9A84C] font-bold uppercase leading-none">Scheduled</div>
                            <div className="text-[9px] text-white font-semibold mt-1 leading-none">{shift.model}</div>
                            <div className="text-[7px] text-[#A8A49A]/40 mt-0.5 leading-none">{shift.time}</div>
                          </div>
                        )}
                        {newShift && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute left-1 right-1 top-1 rounded-lg p-2 z-[2] overflow-hidden"
                            style={{
                              backgroundColor: '#10B98125',
                              border: '1px solid #10B98140',
                              height: `calc(${3 * 100}% + ${2}px - 4px)`
                            }}
                          >
                            <div className="text-[7px] text-[#10B981] font-bold uppercase leading-none">New!</div>
                            <div className="text-[9px] text-white font-semibold mt-1 leading-none">Mia</div>
                            <div className="text-[7px] text-[#A8A49A]/40 mt-0.5 leading-none">14:00 – 18:00</div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <AnimatePresence>
              {showModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[#111111] rounded-xl border border-white/[0.08] p-5 w-72 shadow-2xl"
                  >
                    <div className="text-sm font-medium text-white mb-4">Add New Shift</div>
                    {[
                      { label: 'Model', val: formStep >= 1 ? 'Mia' : 'Select model' },
                      { label: 'Operator', val: formStep >= 2 ? 'John' : 'Select operator' },
                      { label: 'Room', val: formStep >= 3 ? 'Room A' : 'Select room' },
                    ].map((field, i) => (
                      <div key={field.label} className="mb-3">
                        <div className="text-[10px] text-[#A8A49A]/30 mb-1">{field.label} *</div>
                        <motion.div
                          className="px-3 py-2 rounded-lg border text-xs"
                          animate={{
                            borderColor: formStep === i + 1 ? '#C9A84C40' : 'rgba(255,255,255,0.06)',
                            backgroundColor: formStep > i ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.02)'
                          }}
                        >
                          <span className={formStep > i ? 'text-white' : 'text-[#A8A49A]/25'}>{field.val}</span>
                        </motion.div>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <div className="text-[10px] text-[#A8A49A]/30 mb-1">Start Time</div>
                        <div className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-white">14:00</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#A8A49A]/30 mb-1">End Time</div>
                        <div className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-white">18:00</div>
                      </div>
                    </div>
                    <motion.button
                      className="w-full py-2 bg-[#C9A84C] text-black text-xs font-semibold rounded-lg"
                      animate={formStep >= 4 ? { scale: [1, 0.97, 1] } : {}}
                      transition={{ duration: 0.2 }}
                    >
                      Create Shift
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div key="accounting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px]">
            <div className="text-sm font-medium text-white mb-4">Report Earnings</div>

            <div className="max-w-lg mx-auto">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.05] mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[9px] text-[#A8A49A]/25">Model</div>
                    <div className="text-sm text-white font-medium">Alexa</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#A8A49A]/25">Date</div>
                    <div className="text-sm text-white">Jan 8, 2026</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#A8A49A]/25">Time</div>
                    <div className="text-sm text-white">09:00 – 11:00</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#A8A49A]/25">Room</div>
                    <div className="text-sm text-white">Room A</div>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="mb-4">
                <div className="text-xs text-white mb-2">Earnings by Site</div>
                <div className="grid grid-cols-2 gap-2">
                  {SITES.map((site, i) => {
                    const val = tokenValues[site] || 0;
                    return (
                      <motion.div key={site} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.05 }}
                        className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#C9A84C]/15 text-[#C9A84C] rounded font-medium">{site.split(/(?=[A-Z])/).join(' ').substring(0, 3)}</span>
                        <span className="text-[9px] text-[#A8A49A]/25">(tokens)</span>
                        <motion.span
                          className="ml-auto text-xs font-medium text-white"
                          animate={{ opacity: val > 0 ? 1 : 0.3 }}
                        >
                          {val > 0 ? val.toLocaleString() : '0'}
                        </motion.span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div key="payouts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[380px] md:min-h-[440px]">
            <div className="text-sm font-medium text-white mb-4">Calculated Payouts</div>
            <p className="text-[10px] text-[#A8A49A]/30 mb-5">Model: 33%, Operator: 33%</p>

            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {[
                { label: 'Total Gross', value: '$455.00', sub: '175,175 Ft', Icon: TrendingUp, color: '#C9A84C' },
                { label: 'Model Pay', value: '$150.15', sub: '57,808 Ft', pct: '33%', color: '#10B981' },
                { label: 'Operator Pay', value: '$150.15', sub: '57,808 Ft', pct: '33%', color: '#3B82F6' },
                { label: 'Exchange Rate', value: '1 USD', sub: '= 385 Ft', Icon: TrendingUp, color: '#A855F7' },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.15, type: 'spring' }}
                  className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06] text-center"
                >
                  {card.pct && (
                    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[8px] font-bold mb-2"
                      style={{ backgroundColor: card.color + '20', color: card.color }}>
                      {card.pct}
                    </div>
                  )}
                  {!card.pct && card.Icon && <card.Icon className="w-4 h-4 mx-auto mb-2" style={{ color: card.color }} />}
                  <div className="text-[9px] text-[#A8A49A]/30 mb-1">{card.label}</div>
                  <motion.div
                    className="text-lg font-bold"
                    style={{ color: card.color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                  >
                    {card.value}
                  </motion.div>
                  <div className="text-[9px] text-[#A8A49A]/25 mt-0.5">{card.sub}</div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
              className="mt-5 max-w-lg mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#C9A84C]" />
                <span className="text-[10px] text-[#A8A49A]/30">Total Gross</span>
                <span className="text-sm font-bold text-[#C9A84C]">$12,042.80</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
