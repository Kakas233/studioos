import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "StudioOS terms of service — the rules and guidelines for using our platform.",
  openGraph: {
    title: "Terms of Service | StudioOS",
    description: "StudioOS terms of service — the rules and guidelines for using our platform.",
    url: "https://getstudioos.com/legal/terms",
    siteName: "StudioOS",
    type: "website",
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-sm text-[#A8A49A]/40">
        Last updated: March 8, 2026
      </p>

      <div className="mt-12 space-y-10 text-sm leading-relaxed text-[#A8A49A]/70">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using the StudioOS platform and related services
            (the &quot;Service&quot;), you agree to be bound by these Terms of Service
            (&quot;Terms&quot;). If you do not agree to these Terms, do not use the
            Service. These Terms constitute a legally binding agreement between
            you and StudioOS (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            2. Description of Service
          </h2>
          <p>
            StudioOS is a webcam studio management platform that provides tools
            for stream tracking, model management, earnings calculation, shift
            scheduling, team communication, and performance analytics. The
            Service is provided on a subscription basis with various plan tiers.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            3. Account Registration
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              You must provide accurate, complete, and current information when
              creating an account.
            </li>
            <li>
              You are responsible for maintaining the confidentiality of your
              account credentials.
            </li>
            <li>
              You are responsible for all activities that occur under your
              account.
            </li>
            <li>
              You must be at least 18 years old to create an account and use the
              Service.
            </li>
            <li>
              You must notify us immediately of any unauthorized use of your
              account.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            4. Subscription and Billing
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              The Service offers a free 7-day trial for new accounts. No credit
              card is required for the trial.
            </li>
            <li>
              After the trial period, continued access requires an active paid
              subscription.
            </li>
            <li>
              Subscription fees are billed in advance on a recurring basis
              (monthly, quarterly, or biannually) depending on the billing cycle
              you select.
            </li>
            <li>
              All fees are non-refundable except as required by applicable law.
            </li>
            <li>
              We reserve the right to change pricing with 30 days&apos; notice.
              Existing subscriptions will be honored at their current rate until
              the end of the billing cycle.
            </li>
            <li>
              A grace period of 5 days is provided for failed payments before
              account access is restricted.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            5. Acceptable Use
          </h2>
          <p className="mb-3">You agree not to:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Use the Service for any illegal purpose or in violation of any
              applicable laws or regulations.
            </li>
            <li>
              Attempt to gain unauthorized access to other accounts, systems, or
              networks connected to the Service.
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the
              Service.
            </li>
            <li>
              Reverse engineer, decompile, or disassemble any aspect of the
              Service.
            </li>
            <li>
              Use the Service to transmit malware, spam, or other harmful
              content.
            </li>
            <li>
              Share your account credentials or allow unauthorized third parties
              to access your account.
            </li>
            <li>
              Resell or redistribute the Service without our written consent.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            6. Your Data
          </h2>
          <p>
            You retain ownership of all data you enter into the Service,
            including model profiles, stream records, earnings data, schedules,
            and messages. You grant us a limited license to use this data solely
            to provide and improve the Service. We will not sell or share your
            studio data with third parties except as described in our Privacy
            Policy.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            7. Intellectual Property
          </h2>
          <p>
            The Service, including its design, features, code, and
            documentation, is owned by StudioOS and protected by intellectual
            property laws. Your subscription grants you a limited,
            non-exclusive, non-transferable license to use the Service for its
            intended purpose during your subscription period.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            8. Termination
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              You may cancel your subscription at any time through your account
              settings. Access continues until the end of the current billing
              period.
            </li>
            <li>
              We may suspend or terminate your account if you violate these
              Terms, with or without notice.
            </li>
            <li>
              Upon termination, your right to use the Service ceases
              immediately. We will retain your data for 30 days after
              termination to allow for export, after which it will be deleted.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            9. Disclaimers
          </h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without
            warranties of any kind, whether express or implied, including but
            not limited to implied warranties of merchantability, fitness for a
            particular purpose, and non-infringement. We do not warrant that the
            Service will be uninterrupted, error-free, or secure.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            10. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, StudioOS shall not be liable
            for any indirect, incidental, special, consequential, or punitive
            damages, or any loss of profits, revenue, data, or business
            opportunities arising out of or related to your use of the Service.
            Our total liability for any claim arising from these Terms or the
            Service shall not exceed the amount you paid us in the 12 months
            preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            11. Indemnification
          </h2>
          <p>
            You agree to indemnify and hold harmless StudioOS, its officers,
            directors, employees, and agents from any claims, damages, losses,
            liabilities, and expenses (including legal fees) arising out of your
            use of the Service or violation of these Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            12. Changes to Terms
          </h2>
          <p>
            We may modify these Terms at any time. We will notify you of
            material changes by posting the updated Terms on the Service and
            updating the &quot;Last updated&quot; date. Your continued use of the Service
            after changes take effect constitutes acceptance of the modified
            Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            13. Governing Law
          </h2>
          <p>
            These Terms are governed by and construed in accordance with
            applicable law, without regard to conflict of law principles. Any
            disputes arising from these Terms shall be resolved through binding
            arbitration or in the courts of the applicable jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            14. Contact
          </h2>
          <p>
            For questions about these Terms, please reach out through our{" "}
            <a
              href="https://t.me/StudioOS_updates"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C9A84C] underline underline-offset-4 hover:text-[#B89A3E]"
            >
              Telegram channel
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
