"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail, Send } from 'lucide-react';

export default function FinalCTA() {
  return (
    <div className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C9A84C]/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6 tracking-tight">
            Ready to Manage Your Studio Smarter?
          </h2>

          <p className="text-base text-[#A8A49A]/50 mb-10 max-w-xl mx-auto">
            Set up in under 2 minutes. Automate tracking, scheduling, and payouts from day one.
          </p>

          <a href="#pricing">
            <Button
              size="lg"
              className="bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium px-10 py-6 text-base rounded-full tracking-wide transition-all mb-3"
            >
              View Plans & Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>

          <p className="text-[#A8A49A]/40 text-xs mb-8">
            7-day free trial · No credit card required · Cancel anytime
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center gap-2 text-[#A8A49A]/40 text-sm"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Questions?</span>
            <a href="mailto:support@getstudioos.com" className="text-[#C9A84C]/70 hover:text-[#C9A84C] transition-colors">
              support@getstudioos.com
            </a>
          </motion.div>
        </motion.div>

        {/* Telegram Channel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 max-w-lg mx-auto"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#111111] to-[#0D0D0D] p-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />

            <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/[0.06] border border-[#C9A84C]/[0.08] flex items-center justify-center mx-auto mb-4">
              <Send className="w-4 h-4 text-[#C9A84C]/60" />
            </div>
            <h3 className="text-base font-medium text-white mb-1.5 tracking-tight">Follow Us on Telegram</h3>
            <p className="text-[#A8A49A]/40 text-xs leading-relaxed max-w-sm mx-auto mb-5">
              Quick video guides, platform updates, and tips — straight to your Telegram.
            </p>
            <a href="https://t.me/studioos_updates" target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium rounded-full px-6 text-sm h-9">
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Join Our Channel
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
