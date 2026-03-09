"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import DashboardPreview from './dashboard-preview';

export default function Hero() {
  return (
    <div className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-16 md:pt-20 pb-8 relative z-10 w-full">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block mb-6 px-5 py-2 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/5"
          >
            <span className="text-[#C9A84C]/80 text-sm tracking-wide">The #1 Studio Management Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl md:text-5xl lg:text-6xl font-light mb-4 leading-tight tracking-tight text-white"
          >
            Webcam Studio
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] to-[#E8D48B]">Management Software</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-[#A8A49A] text-base md:text-lg mb-8 max-w-2xl mx-auto tracking-wide"
          >
            Track model earnings, performance, and viewer activity across all major cam sites — from one dashboard. Auto-track streaming hours across Chaturbate, Stripchat, MyFreeCams, LiveJasmin, BongaCams, CamSoda, Cam4 and Flirt4Free.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-2"
          >
            <a href="#pricing">
              <Button
                size="lg"
                className="bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium px-10 py-6 text-base rounded-full tracking-wide transition-all w-full sm:w-auto"
              >
                Start Free Trial
              </Button>
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-[#A8A49A]/40 text-xs mb-4"
          >
            7-day free trial · No credit card required · Works with all major cam sites
          </motion.p>

          {/* Dashboard screenshot */}
          <DashboardPreview />
        </div>
      </div>
    </div>
  );
}
