"use client";

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { UserPlus, Users, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    number: '01',
    title: 'Create Your Studio',
    description: 'Set up your workspace in under 2 minutes — choose a plan, name your studio, and configure your rooms. Your dashboard is ready instantly.',
    detail: 'Pick your subscription tier, invite your first team members, and personalize your studio branding.',
  },
  {
    icon: Users,
    number: '02',
    title: 'Onboard Your Team',
    description: 'Add models and operators, link their cam platform usernames, assign rooms, and set weekly streaming goals.',
    detail: 'StudioOS automatically detects linked accounts across 8+ cam sites and starts tracking immediately.',
  },
  {
    icon: TrendingUp,
    number: '03',
    title: 'Track, Optimize & Scale',
    description: 'Streaming hours, earnings, and performance metrics are tracked automatically — giving you real-time data to make smarter decisions.',
    detail: 'View live dashboards, generate payout reports, and use AI-powered insights to maximize revenue.',
  },
];

function GlowLine({ inView }: { inView: boolean }) {
  return (
    <div className="hidden lg:flex absolute top-[52px] left-0 right-0 items-center justify-center z-0 px-[16.666%]">
      <div className="w-full h-px relative bg-white/[0.04]">
        <motion.div
          className="absolute inset-y-0 left-0 h-full"
          style={{
            background: 'linear-gradient(to right, transparent, #C9A84C80, #C9A84C, #C9A84C80, transparent)',
          }}
          initial={{ width: '0%' }}
          animate={inView ? { width: '100%' } : { width: '0%' }}
          transition={{ duration: 1.8, delay: 0.3, ease: 'easeOut' }}
        />
        {/* Glow effect */}
        <motion.div
          className="absolute inset-y-0 left-0 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, #C9A84C40, #C9A84C60, #C9A84C40, transparent)',
            filter: 'blur(4px)',
          }}
          initial={{ width: '0%' }}
          animate={inView ? { width: '100%' } : { width: '0%' }}
          transition={{ duration: 1.8, delay: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div className="relative py-24" id="how-it-works" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[#A8A49A]/60 text-sm tracking-widest uppercase mb-4">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-3">
            Up and Running in Minutes
          </h2>
          <p className="text-[#A8A49A]/40 text-sm max-w-md mx-auto">
            Three simple steps to transform how you manage your studio
          </p>
        </motion.div>

        <div className="relative">
          <GlowLine inView={inView} />

          <div className="grid lg:grid-cols-3 gap-6 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.2 }}
                className="flex flex-col items-center text-center"
              >
                {/* Node dot on the line */}
                <motion.div
                  className="relative mb-6"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.25, type: 'spring' }}
                >
                  <div className="w-[104px] h-[104px] rounded-2xl bg-[#111111] border border-white/[0.06] flex items-center justify-center relative overflow-hidden group">
                    {/* Subtle inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#C9A84C]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex flex-col items-center gap-1 relative z-10">
                      <span className="text-[10px] font-medium text-[#C9A84C]/40 tracking-widest">{step.number}</span>
                      <step.icon className="w-6 h-6 text-[#C9A84C]/70" />
                    </div>
                  </div>
                </motion.div>

                <h3 className="text-base font-medium text-white mb-3">{step.title}</h3>
                <p className="text-[#A8A49A]/50 leading-relaxed text-sm mb-3 max-w-xs">
                  {step.description}
                </p>
                <p className="text-[#A8A49A]/25 leading-relaxed text-xs max-w-[260px]">
                  {step.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
