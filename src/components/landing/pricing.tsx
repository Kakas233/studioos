"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { PLANS, BILLING_CYCLES, getPrice, TRIAL_DAYS } from '@/components/lib/pricingData';

export default function Pricing() {
  const [cycle, setCycle] = useState('monthly');

  return (
    <div className="relative py-24" id="pricing">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-[#A8A49A]/60 text-sm tracking-widest uppercase mb-4">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-[#A8A49A]/50 text-base mb-2">
            All plans include a {TRIAL_DAYS}-day free trial. No credit card required. Save up to 20% with longer commitments.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-[#111111] rounded-full border border-white/[0.06] p-1">
            {BILLING_CYCLES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCycle(c.id)}
                className={`relative px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                  cycle === c.id
                    ? 'bg-[#C9A84C] text-black font-medium'
                    : 'text-[#A8A49A]/60 hover:text-white'
                }`}
              >
                {c.label}
                {c.discount > 0 && (
                  <span className={`ml-1 text-[10px] font-bold ${
                    cycle === c.id ? 'text-black/60' : 'text-[#C9A84C]'
                  }`}>
                    -{c.discount * 100}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-5 mb-10">
          {PLANS.map((plan, index) => {
            const price = getPrice(plan.monthly, cycle);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={`relative rounded-2xl p-7 ${
                  plan.popular
                    ? 'bg-[#111111] border-2 border-[#C9A84C]/25'
                    : 'bg-[#111111]/80 border border-white/[0.04]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[#C9A84C] text-black px-4 py-1 rounded-full text-xs font-medium tracking-wide">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: plan.color }} />
                    <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                  </div>
                  <p className="text-[#A8A49A]/40 text-sm mb-4">{plan.tagline}</p>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-light text-white">${price.monthly}</span>
                    <span className="text-[#A8A49A]/40">/mo</span>
                  </div>
                  {price.savings > 0 && (
                    <p className="text-xs text-[#C9A84C]">Save ${price.savings} on {BILLING_CYCLES.find(b => b.id === cycle)?.label}</p>
                  )}
                  <p className="text-xs text-[#A8A49A]/30 mt-2">{plan.modelsIncluded} model{plan.modelsIncluded > 1 ? 's' : ''} included · +${plan.extraModelPrice}/extra</p>
                </div>

                <ul className="space-y-2.5 mb-7">
                  {plan.features.slice(0, 7).map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${f.included ? 'text-[#C9A84C]/60' : 'text-[#A8A49A]/15'}`} />
                      <span className={`text-xs ${f.included ? 'text-[#A8A49A]/60' : 'text-[#A8A49A]/20'}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href={`/sign-up?tier=${plan.id}`}>
                  <Button
                    className={`w-full rounded-full ${
                      plan.popular
                        ? 'bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.06]'
                    }`}
                    size="lg"
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <p className="text-[#A8A49A]/30 text-[10px] mt-2 text-center">No credit card required</p>
              </motion.div>
            );
          })}
        </div>

        {/* See full comparison link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-[#C9A84C]/70 hover:text-[#C9A84C] text-sm transition-colors group"
          >
            See full pricing details, feature comparison & calculator
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="mt-4 flex items-center justify-center gap-6 text-[#A8A49A]/30 text-xs">
            <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A84C]/40" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A84C]/40" /> Cancel anytime</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
