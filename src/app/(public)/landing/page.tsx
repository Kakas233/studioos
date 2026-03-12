"use client";

import AnimatedBackground from "@/components/landing/animated-background";
import PublicNav from "@/components/landing/public-nav";
import Hero from "@/components/landing/hero";
import SocialProof from "@/components/landing/social-proof";
import FeatureShowcase from "@/components/landing/features/feature-showcase";
import EvolutionSection from "@/components/landing/evolution-section";
import HowItWorks from "@/components/landing/how-it-works";
import Pricing from "@/components/landing/pricing";
import FAQ from "@/components/landing/faq";
import FinalCTA from "@/components/landing/final-cta";
import EnterpriseSection from "@/components/landing/enterprise-section";
import Footer from "@/components/landing/footer";
import CookieConsent from "@/components/landing/cookie-consent";
import BackToTop from "@/components/landing/back-to-top";

export default function Landing() {
  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white"
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Hidden SEO content for crawlers */}
      <div className="sr-only" aria-hidden="false">
        <h1>Webcam Studio Management Software</h1>
        <p>
          Track model earnings, performance, and viewer activity across all
          major cam sites — from one dashboard.
        </p>
        <h2>Real-Time Earnings Tracking</h2>
        <p>
          Aggregate earnings from Chaturbate, Stripchat, MyFreeCams, LiveJasmin,
          BongaCams, and CamSoda into a single dashboard. See exactly how each
          model is performing, on which platform, right now.
        </p>
        <h2>Cross-Platform Viewer Intelligence</h2>
        <p>
          Understand who&apos;s watching your models across platforms. Identify
          high-value viewers, track cross-room activity, and uncover revenue
          patterns that individual platform dashboards can&apos;t show you.
        </p>
        <h2>Model Performance Analytics</h2>
        <p>
          Track earnings per hour, viewer retention, tip frequency, and peak
          performance windows for every model. Coach effectively with data, not
          guesswork.
        </p>
        <h2>Automated Commission Calculations</h2>
        <p>
          Set custom commission rates per model, per platform. StudioOS
          calculates payouts automatically — no more spreadsheet errors or
          payment disputes.
        </p>
        <h2>Built for Webcam Studios</h2>
        <p>
          StudioOS is a purpose-built management platform supporting Chaturbate,
          Stripchat, MyFreeCams, LiveJasmin, BongaCams, CamSoda, Cam4, and
          Flirt4Free. The best alternative to Statbate, Camerolla, and
          CBInsights.
        </p>
        <h2>Works With Every Major Cam Site</h2>
        <p>
          Chaturbate, Stripchat, MyFreeCams, LiveJasmin, BongaCams, CamSoda,
          Cam4, Flirt4Free — all tracked from one dashboard.
        </p>
        <h2>Ready to Manage Your Studio Smarter?</h2>
        <p>
          Start your 7-day free trial today. No credit card required. Plans from
          $29/month.
        </p>
        <p>Contact: support@getstudioos.com</p>
      </div>

      <AnimatedBackground />
      <PublicNav activePage="landing" />

      {/* Content */}
      <main className="pt-16 relative z-10">
        <Hero />
        <FeatureShowcase />
        <EvolutionSection />
        <SocialProof />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <FinalCTA />
        <EnterpriseSection />
        <Footer />
      </main>

      <CookieConsent />
      <BackToTop />
    </div>
  );
}
