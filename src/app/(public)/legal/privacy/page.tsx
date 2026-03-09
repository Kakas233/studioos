import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "StudioOS privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-sm text-[#A8A49A]/40">
        Last updated: March 8, 2026
      </p>

      <div className="mt-12 space-y-10 text-sm leading-relaxed text-[#A8A49A]/70">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            1. Introduction
          </h2>
          <p>
            StudioOS (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our webcam studio
            management platform and related services (collectively, the
            &quot;Service&quot;).
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            2. Information We Collect
          </h2>
          <p className="mb-3">
            We collect information you provide directly to us, including:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong className="text-white/80">Account Information:</strong>{" "}
              Name, email address, password, and studio details when you create
              an account.
            </li>
            <li>
              <strong className="text-white/80">Billing Information:</strong>{" "}
              Payment method details processed securely through our payment
              processor (Stripe). We do not store full credit card numbers.
            </li>
            <li>
              <strong className="text-white/80">Studio Data:</strong> Model
              profiles, stream records, scheduling data, earnings information,
              and member notes you enter into the platform.
            </li>
            <li>
              <strong className="text-white/80">Communications:</strong>{" "}
              Messages sent through the platform&apos;s built-in chat feature and
              support requests.
            </li>
            <li>
              <strong className="text-white/80">Usage Data:</strong> Log data,
              device information, browser type, and interaction patterns
              collected automatically when you use the Service.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>To provide, maintain, and improve the Service.</li>
            <li>To process transactions and send billing-related communications.</li>
            <li>To send technical notices, updates, and security alerts.</li>
            <li>To respond to your support requests and inquiries.</li>
            <li>To monitor and analyze usage trends to improve user experience.</li>
            <li>To detect, prevent, and address fraud or technical issues.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            4. Data Sharing
          </h2>
          <p>
            We do not sell your personal information. We may share information
            with third parties only in the following circumstances:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong className="text-white/80">Service Providers:</strong> We
              use third-party services (such as Stripe for payments, hosting
              providers, and analytics tools) that process data on our behalf
              under strict data protection agreements.
            </li>
            <li>
              <strong className="text-white/80">Legal Requirements:</strong> We
              may disclose information if required by law, regulation, or legal
              process.
            </li>
            <li>
              <strong className="text-white/80">Business Transfers:</strong> In
              connection with a merger, acquisition, or sale of assets, your
              information may be transferred as part of the transaction.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            5. Data Security
          </h2>
          <p>
            We implement industry-standard security measures to protect your
            data, including encryption in transit (TLS) and at rest,
            role-based access controls, and regular security reviews. However, no
            method of transmission over the internet or electronic storage is
            100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            6. Data Retention
          </h2>
          <p>
            We retain your information for as long as your account is active or
            as needed to provide the Service. When you delete your account, we
            will delete or anonymize your personal data within 30 days, except
            where we are required to retain it for legal or compliance purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            7. Your Rights
          </h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Access and receive a copy of your personal data.</li>
            <li>Correct inaccurate personal data.</li>
            <li>Request deletion of your personal data.</li>
            <li>Object to or restrict processing of your personal data.</li>
            <li>Data portability (receive your data in a structured format).</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, contact us at the email address provided
            below.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            8. Cookies and Tracking
          </h2>
          <p>
            We use essential cookies to maintain your session and preferences.
            We may use analytics cookies to understand how the Service is used.
            You can control cookie settings through your browser preferences.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            9. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the updated policy on this
            page and updating the &quot;Last updated&quot; date. Your continued use of the
            Service after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">
            10. Contact Us
          </h2>
          <p>
            If you have any questions about this Privacy Policy or our data
            practices, please contact us through our{" "}
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
