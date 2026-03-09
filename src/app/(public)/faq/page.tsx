"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "What is StudioOS?",
    answer:
      "StudioOS is an all-in-one management platform designed specifically for webcam studios. It helps you track streams, manage models, automate earnings calculations, schedule shifts, and optimize performance across 8 major cam platforms from a single dashboard.",
  },
  {
    question: "Which cam platforms does StudioOS support?",
    answer:
      "StudioOS supports 8 major cam platforms, including the most popular sites in the industry. The platform automatically tracks streams, syncs earnings, and manages member data across all supported sites simultaneously.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "Every plan comes with a free 7-day trial. No credit card is required to start. You get full access to all features included in your chosen plan during the trial period. You can upgrade, downgrade, or cancel at any time.",
  },
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you will gain immediate access to additional features. When downgrading, changes take effect at the end of your current billing cycle.",
  },
  {
    question: "What billing cycles are available?",
    answer:
      "StudioOS offers three billing cycles: Monthly (no discount), Quarterly (10% discount), and Biannual (20% discount). You can switch between billing cycles at any renewal period.",
  },
  {
    question: "How does model-based pricing work?",
    answer:
      "Each plan includes a set number of models (Starter: 1, Pro: 3, Elite: 5). If you need more models, you can add them at a per-model monthly rate that varies by plan. This lets you scale your subscription to match your studio size.",
  },
  {
    question: "What is auto stream tracking?",
    answer:
      "Auto stream tracking (available on Pro and Elite plans) automatically detects when your models go live and logs their stream sessions. This eliminates manual time entry and ensures accurate records for earnings calculations and performance analytics.",
  },
  {
    question: "How does the AI Coach feature work?",
    answer:
      "The Model Insights & AI Coach feature (available on Pro and Elite plans) analyzes each model's performance data and provides actionable suggestions to improve earnings, optimize streaming schedules, and enhance overall performance.",
  },
  {
    question: "What are Member Alerts?",
    answer:
      "Member Alerts (available on the Elite plan) send real-time Telegram notifications when flagged or noteworthy members enter your models' rooms. This helps protect your models and enables proactive studio management.",
  },
  {
    question: "What team roles are available?",
    answer:
      "StudioOS supports 5 roles: Owner, Admin, Manager, Model, and Accountant. Each role has tailored permissions. The Accountant role (Elite only) provides access to financial data without exposing other studio operations.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. StudioOS uses industry-standard encryption for data in transit and at rest. Access is controlled through role-based permissions, and we never share your studio data with third parties. Elite plan users can also export and back up their data.",
  },
  {
    question: "How do payouts work?",
    answer:
      "The Financial Tracking & Payouts feature (Pro and Elite plans) lets you set up custom payout splits, calculate earnings per model across all platforms, and generate payout reports. It handles the math so you can focus on running your studio.",
  },
  {
    question: "Can I communicate with my team within StudioOS?",
    answer:
      "Yes. StudioOS includes built-in chat channels for team communication. Starter gets 1 channel, Pro gets 3 channels, and Elite gets unlimited channels. Use them for shift coordination, announcements, or private coaching conversations.",
  },
  {
    question: "What kind of support do you offer?",
    answer:
      "Support varies by plan: Starter includes email support, Pro includes priority support with faster response times, and Elite includes premium support with dedicated assistance. You can also join our Telegram community for updates and tips.",
  },
  {
    question: "How do I get started?",
    answer:
      "Simply sign up for a free trial on the plan that fits your studio. You will have full access for 7 days with no credit card required. Set up your studio, invite your team, connect your platforms, and start tracking right away.",
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-lg text-[#A8A49A]/70">
          Everything you need to know about StudioOS. Can&apos;t find what
          you&apos;re looking for? Reach out on{" "}
          <a
            href="https://t.me/StudioOS_updates"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C9A84C] underline underline-offset-4 hover:text-[#B89A3E]"
          >
            Telegram
          </a>
          .
        </p>
      </div>

      <div className="mt-16">
        <Accordion>
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem
              key={index}
              className="border-b border-white/[0.04]"
            >
              <AccordionTrigger className="py-5 text-left text-base font-medium text-white hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="pb-4 text-sm leading-relaxed text-[#A8A49A]/70">
                  {item.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
