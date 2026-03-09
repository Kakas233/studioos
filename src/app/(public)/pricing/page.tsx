"use client";

import Link from "next/link";
import { useState } from "react";
import {
  PLANS,
  BILLING_CYCLES,
  FEATURE_COMPARISON,
  getPrice,
  type BillingCycle,
} from "@/lib/pricing";

export default function PricingPage() {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(
    BILLING_CYCLES[0]
  );

  return (
    <div>
      {/* Header */}
      <section className="mx-auto max-w-7xl px-6 pb-4 pt-20 text-center md:pt-28">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[#A8A49A]/70">
          Start with a free 7-day trial. No credit card required. Scale as your
          studio grows.
        </p>
      </section>

      {/* Billing Cycle Toggle */}
      <div className="mt-10 flex justify-center">
        <div className="inline-flex rounded-lg border border-white/[0.04] bg-[#111111] p-1">
          {BILLING_CYCLES.map((cycle) => (
            <button
              key={cycle.id}
              onClick={() => setSelectedCycle(cycle)}
              className={`relative rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                selectedCycle.id === cycle.id
                  ? "bg-[#C9A84C] text-black"
                  : "text-[#A8A49A]/70 hover:text-white"
              }`}
            >
              {cycle.label}
              {cycle.discount > 0 && (
                <span
                  className={`ml-1.5 text-xs ${
                    selectedCycle.id === cycle.id
                      ? "text-black/60"
                      : "text-[#C9A84C]"
                  }`}
                >
                  -{cycle.discount * 100}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Cards */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const price = getPrice(plan.monthly, selectedCycle);
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-8 ${
                  plan.popular
                    ? "border-[#C9A84C]/30 bg-[#111111]"
                    : "border-white/[0.04] bg-[#111111]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#C9A84C] px-4 py-1 text-xs font-semibold text-black">
                    Most Popular
                  </div>
                )}

                <div className="text-center">
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: plan.color }}
                  >
                    {plan.name}
                  </h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">
                      ${price}
                    </span>
                    <span className="text-[#A8A49A]/40">/mo</span>
                  </div>
                  {selectedCycle.discount > 0 && (
                    <div className="mt-1 text-sm text-[#A8A49A]/40">
                      <span className="line-through">${plan.monthly}/mo</span>
                      <span className="ml-2 text-[#C9A84C]">
                        Save {selectedCycle.discount * 100}%
                      </span>
                    </div>
                  )}
                  <p className="mt-2 text-sm text-[#A8A49A]/40">
                    {plan.modelsIncluded} model
                    {plan.modelsIncluded > 1 ? "s" : ""} included
                    {" | "}${plan.extraModelPrice}/mo per extra
                  </p>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-[#A8A49A]/70"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: plan.color }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/sign-up?tier=${plan.id}`}
                  className={`mt-8 block w-full rounded-lg py-3 text-center text-sm font-medium transition-colors ${
                    plan.popular
                      ? "bg-[#C9A84C] text-black hover:bg-[#B89A3E]"
                      : "border border-white/[0.08] bg-transparent text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  Start Free Trial
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">
          Feature Comparison
        </h2>
        <div className="overflow-x-auto rounded-xl border border-white/[0.04]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] bg-[#111111]">
                <th className="px-6 py-4 text-left font-medium text-[#A8A49A]/40">
                  Feature
                </th>
                {PLANS.map((plan) => (
                  <th
                    key={plan.id}
                    className="px-6 py-4 text-center font-medium"
                    style={{ color: plan.color }}
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_COMPARISON.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-white/[0.04] ${
                    i % 2 === 0 ? "bg-[#0A0A0A]" : "bg-[#0e0e0e]"
                  }`}
                >
                  <td className="px-6 py-3 text-[#A8A49A]/70">
                    {row.feature}
                  </td>
                  {(["starter", "pro", "elite"] as const).map((tier) => {
                    const val = row[tier];
                    return (
                      <td key={tier} className="px-6 py-3 text-center">
                        {typeof val === "boolean" ? (
                          val ? (
                            <svg
                              className="mx-auto h-4 w-4 text-[#C9A84C]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <span className="text-[#A8A49A]/20">&mdash;</span>
                          )
                        ) : (
                          <span className="text-[#A8A49A]/70">{val}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <h2 className="text-2xl font-bold">Not sure which plan is right?</h2>
          <p className="mt-3 text-[#A8A49A]/70">
            Start with a free 7-day trial on any plan. Upgrade, downgrade, or
            cancel at any time.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block rounded-lg bg-[#C9A84C] px-8 py-3 text-base font-medium text-black transition-colors hover:bg-[#B89A3E]"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
