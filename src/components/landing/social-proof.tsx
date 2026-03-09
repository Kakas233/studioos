"use client";

import { motion } from 'framer-motion';

const stats = [
  { value: '8', label: 'Cam Sites Supported', desc: 'All major platforms unified in one dashboard.' },
  { value: '15min', label: 'Auto-Tracking Interval', desc: 'Real-time monitoring across every connected platform.' },
];

export default function SocialProof() {
  return (
    <div className="relative py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[#A8A49A]/60 text-sm tracking-widest uppercase mb-4">Where Function Meets Simplicity</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight">
            Tailored for Webcam Studios
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-[#111111]/80 rounded-2xl p-8 border border-white/[0.04] text-center"
            >
              <div className="text-4xl md:text-5xl font-light text-[#C9A84C] mb-2">{stat.value}</div>
              <div className="text-white text-lg mb-2">{stat.label}</div>
              <p className="text-[#A8A49A]/50 text-sm leading-relaxed">{stat.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto mt-16 bg-[#111111]/80 rounded-2xl p-8 md:p-10 border border-[#C9A84C]/[0.06]"
        >
          <blockquote className="text-base md:text-lg text-[#A8A49A] leading-relaxed mb-4 italic">
            &quot;Stop managing your studio from spreadsheets and Telegram groups. StudioOS automates stream tracking, calculates payouts instantly, and gives you real-time visibility into every model&apos;s performance.&quot;
          </blockquote>
          <p className="text-[#C9A84C]/60 text-sm">
            — The StudioOS Team
          </p>
        </motion.div>
      </div>
    </div>
  );
}
