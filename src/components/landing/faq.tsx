"use client";

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How does the 7-day free trial work?',
    answer: 'Sign up for any plan and get full access for 7 days — no credit card required. After the trial, simply choose a billing cycle (1, 3, or 6 months) to continue. If you don\'t subscribe, your account remains accessible in read-only mode.',
  },
  {
    question: 'How do Member Alerts work?',
    answer: 'Member Alerts notify you via Telegram when high-spending members enter your monitored rooms. StudioOS checks the member\'s all-time public spending history in real time, and if it exceeds your configured threshold, you instantly receive a detailed notification with their spending breakdown — all-time, 3 months, and last month. Supported platforms include MyFreeCams, StripChat, BongaCams, Chaturbate (beta), LiveJasmin (beta), and CamSoda (beta).',
  },
  {
    question: 'How does automated tracking work?',
    answer: 'We monitor public data every 15 minutes to track your models\' streaming time across all major cam sites. No manual logging, no API keys needed. It just works — better than Chaturbate Insights or Stripchat Insights because it covers all 8 sites simultaneously.',
  },
  {
    question: 'Which cam sites are supported?',
    answer: 'MyFreeCams, Chaturbate, Stripchat, BongaCams, LiveJasmin, Cam4, CamSoda, Flirt4Free — 8 major platforms unified in one dashboard. More sites are being added regularly.',
  },
  {
    question: 'What can I see with Member and Model Lookup?',
    answer: 'Member Lookup lets you search any cam site member by username to see their complete public tipping history, spending patterns, top models tipped, daily spending charts, and chat activity. Model Lookup lets you search any cam model to view their stats, streaming sessions, tips received, top members, hourly activity heatmaps, income charts, and similar models. Both features support Chaturbate, StripChat, BongaCams, CamSoda, MyFreeCams, and LiveJasmin.',
  },
  {
    question: 'What about multi-site overlap?',
    answer: 'Our smart overlap detection ensures hours aren\'t double-counted. If a model streams on 3 sites simultaneously from 8-10 PM, we count 2 hours total, not 6. This is unique to StudioOS — tools like Camerolla and SCInsights don\'t handle cross-platform overlap.',
  },
  {
    question: 'Can I add more models than what\'s included?',
    answer: 'Absolutely. Every plan includes a base number of models. Extra models can be added at a per-model monthly fee — $20 on Starter, $15 on Pro, and $12 on Elite. The more you scale, the less you pay per model.',
  },
  {
    question: 'What happens if I cancel?',
    answer: 'Your data is never deleted. Cancel anytime and your access continues until the end of the billing period. You can resubscribe later and everything is restored instantly.',
  },
  {
    question: 'Do I save money with longer billing cycles?',
    answer: 'Yes! The 3-month plan saves 10% and the 6-month plan saves 20% compared to monthly billing. The discount applies to both the base plan and extra model fees.',
  },
  {
    question: 'What is Model Insights?',
    answer: 'Model Insights is an advanced analytics suite available on Elite — it includes revenue charts, stream heatmaps, show type breakdowns, scatter plots, earnings-per-hour analysis, and AI-powered recommendations for optimal streaming times. Far more comprehensive than what Chaturbate Insights or Stripchat Insights offer.',
  },
];

function FAQItem({ faq, index }: { faq: { question: string; answer: string }; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b border-white/[0.04] last:border-0"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-start justify-between text-left group"
      >
        <span className="text-sm font-medium text-[#A8A49A] group-hover:text-white transition-colors pr-8">
          {faq.question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#C9A84C]/50 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-[#A8A49A]/50 leading-relaxed text-sm">
          {faq.answer}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function FAQ() {
  return (
    <div className="relative py-24" id="faq">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-[#A8A49A]/60 text-sm tracking-widest uppercase mb-4">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="bg-[#111111]/80 rounded-2xl p-8 border border-white/[0.04]">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
