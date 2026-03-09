import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "StudioOS — The Operating System for Webcam Studios",
  description:
    "All-in-one webcam studio management platform. Track streams, manage models, automate earnings, and optimize performance across 8 cam sites.",
};

const FEATURES = [
  {
    title: "Multi-Platform Tracking",
    description:
      "Automatically track streams across 8 major cam platforms in real time. No more switching between tabs or manual logging.",
  },
  {
    title: "Shift Scheduling",
    description:
      "Create and manage shift schedules for all your models. Set recurring schedules, handle swaps, and track attendance effortlessly.",
  },
  {
    title: "Earnings & Payouts",
    description:
      "Consolidate earnings from every platform into a single dashboard. Calculate payouts, splits, and bonuses automatically.",
  },
  {
    title: "Model Insights & AI Coach",
    description:
      "AI-powered performance analysis gives each model actionable suggestions to improve earnings and stream quality.",
  },
  {
    title: "Member & Model Lookup",
    description:
      "Instantly search members and models across platforms. Track notes, history, and flags to protect your studio.",
  },
  {
    title: "Live Stream Monitor",
    description:
      "See who is currently live at a glance. Monitor room status, viewer counts, and stream health from one screen.",
  },
  {
    title: "Team Chat & Channels",
    description:
      "Built-in messaging keeps your team connected. Create channels for shifts, announcements, or one-on-one coaching.",
  },
  {
    title: "Member Alerts",
    description:
      "Get Telegram notifications when flagged members enter your rooms. Protect your models with real-time alerts.",
  },
];

const STATS = [
  { value: "8", label: "Platforms" },
  { value: "16", label: "Show Types" },
  { value: "5", label: "Roles" },
  { value: "Real-time", label: "Tracking" },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C9A84C]/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 text-center md:pt-32 md:pb-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/5 px-4 py-1.5 text-sm text-[#C9A84C]">
            Built for webcam studios
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl md:leading-tight">
            The Operating System for{" "}
            <span className="text-[#C9A84C]">Webcam Studios</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#A8A49A]/70 md:text-xl">
            Track streams, manage models, automate earnings, and optimize
            performance across 8 platforms — all from one dashboard.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded-lg bg-[#C9A84C] px-8 py-3 text-base font-medium text-black transition-colors hover:bg-[#B89A3E]"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-white/[0.08] bg-[#111111] px-8 py-3 text-base font-medium text-white transition-colors hover:bg-[#1a1a1a]"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/[0.04] bg-[#111111]/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-[#C9A84C] md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-[#A8A49A]/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to run your studio
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#A8A49A]/70">
              From stream tracking to payouts, StudioOS handles the operations
              so you can focus on growing your business.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-white/[0.04] bg-[#111111] p-6 transition-colors hover:border-white/[0.08]"
              >
                <h3 className="text-base font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#A8A49A]/60">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center md:py-28">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to streamline your studio?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#A8A49A]/70">
            Join studios already using StudioOS to manage their operations. Start
            your free 7-day trial today.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded-lg bg-[#C9A84C] px-8 py-3 text-base font-medium text-black transition-colors hover:bg-[#B89A3E]"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-white/[0.08] bg-[#111111] px-8 py-3 text-base font-medium text-white transition-colors hover:bg-[#1a1a1a]"
            >
              Compare Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
