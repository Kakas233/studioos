"use client";

import { motion } from "framer-motion";
import { Building2, Wrench, ShieldCheck, Mail } from "lucide-react";

const FEATURES = [
  {
    icon: Building2,
    title: "Full Ownership",
    description:
      "No recurring fees. The software is yours — deployed on your infrastructure, under your control.",
  },
  {
    icon: Wrench,
    title: "Fully Customizable",
    description:
      "We adapt the platform to your workflow. Add features, modify existing ones, or integrate with your tools.",
  },
  {
    icon: ShieldCheck,
    title: "Private & Secure",
    description:
      "Your data stays on your servers. No shared infrastructure, no third-party access.",
  },
];

export default function EnterpriseSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Subtle top separator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[280px] h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-[#C9A84C]/60 text-xs font-medium tracking-[0.2em] uppercase mb-4">
            Enterprise
          </p>
          <h2 className="text-2xl md:text-3xl font-light text-white tracking-tight mb-4">
            Want to Own the Software?
          </h2>
          <p className="text-[#A8A49A]/50 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            For larger studios that want a platform built exclusively for them —
            not a subscription, but a permanent solution they fully own.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 mb-14">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative rounded-2xl border border-white/[0.05] bg-[#111111]/60 p-6"
            >
              <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/[0.06] border border-[#C9A84C]/[0.08] flex items-center justify-center mb-4">
                <feature.icon className="w-4 h-4 text-[#C9A84C]/70" />
              </div>
              <h3 className="text-sm font-medium text-white mb-2 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-[#A8A49A]/40 text-xs leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#111111] to-[#0D0D0D] p-8 md:p-10 text-center max-w-2xl mx-auto"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[160px] h-[1px] bg-gradient-to-r from-transparent via-[#C9A84C]/15 to-transparent" />

          <p className="text-white text-sm md:text-base leading-relaxed mb-1.5">
            Interested in a one-time purchase?
          </p>
          <p className="text-[#A8A49A]/40 text-xs md:text-sm leading-relaxed mb-6 max-w-md mx-auto">
            Reach out and we&#39;ll walk you through the process, pricing, and
            what customizations are possible for your studio.
          </p>

          <a
            href="mailto:support@getstudioos.com?subject=Enterprise%20License%20Inquiry"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/[0.06] text-[#C9A84C] text-sm font-medium hover:bg-[#C9A84C]/[0.12] hover:border-[#C9A84C]/30 transition-all"
          >
            <Mail className="w-3.5 h-3.5" />
            support@getstudioos.com
          </a>
        </motion.div>
      </div>
    </section>
  );
}
