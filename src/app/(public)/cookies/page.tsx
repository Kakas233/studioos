import LegalPageLayout from "@/components/legal/legal-page-layout";

export default function CookiesPolicy() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdated="February 2026">
      <p>This Cookie Policy explains how <strong>StudioOS</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;StudioOS&rdquo;) uses cookies and similar technologies on our website and platform at getstudioos.com. This policy should be read together with our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</p>

      <h2>1. What Are Cookies</h2>
      <p>Cookies are small text files placed on your device (e.g., computer, smartphone, or other electronic device) when you visit a website. They are widely used to make websites work more efficiently, provide a better user experience, and supply information to website operators. We use cookies and other similar tracking technologies such as single-pixel gifs, web beacons, and action tags on our website.</p>

      <h2>2. Cookies We Use</h2>

      <h3>2.1 Strictly Necessary Cookies</h3>
      <p>These cookies are essential for the platform to function. They enable core features such as authentication, session management, and security. You cannot opt out of these cookies as the platform would not function without them.</p>
      <ul>
        <li><strong>Session cookies</strong> — Maintain your login session — Duration: Session</li>
        <li><strong>Authentication tokens</strong> — Verify your identity — Duration: Session / 30 days</li>
        <li><strong>CSRF tokens (XSRF-TOKEN)</strong> — Protect against cross-site request forgery — Duration: Session / 7 days</li>
      </ul>
      <p><strong>Legal Basis:</strong> Legitimate interest / Contract performance (Art. 6(1)(b) and (f) GDPR)</p>

      <h3>2.2 Analytics Cookies</h3>
      <p>We use Google Analytics to understand how visitors interact with our website and platform. These cookies collect information in an aggregated form to help us improve our services.</p>
      <ul>
        <li><strong>_ga</strong> — Distinguishes users (Google Analytics) — Duration: 2 years</li>
        <li><strong>_ga_*</strong> — Maintains session state (Google Analytics) — Duration: 2 years</li>
        <li><strong>_gid</strong> — Distinguishes users (Google Analytics) — Duration: 24 hours</li>
        <li><strong>_gat</strong> — Throttles request rate (Google Analytics) — Duration: 1 minute</li>
      </ul>
      <p><strong>Legal Basis:</strong> Consent (Art. 6(1)(a) GDPR)</p>

      <h3>2.3 Functional Cookies</h3>
      <p>These cookies remember your preferences and choices to enhance your experience.</p>
      <ul>
        <li><strong>Language/locale</strong> — Remembers your language preference — Duration: 1 year</li>
        <li><strong>UI preferences</strong> — Remembers layout and display settings — Duration: 1 year</li>
      </ul>
      <p><strong>Legal Basis:</strong> Consent (Art. 6(1)(a) GDPR)</p>

      <h3>2.4 Third-Party Cookies</h3>
      <p>Our platform integrates with third-party services that may set their own cookies:</p>
      <ul>
        <li><strong>Stripe:</strong> Payment processing cookies for secure transactions.</li>
        <li><strong>Base44:</strong> Platform hosting cookies for application functionality.</li>
      </ul>
      <p>These cookies are governed by the respective privacy policies of these third parties.</p>

      <h2>3. Your Choices</h2>

      <h3>3.1 Cookie Consent</h3>
      <p>When you first visit our platform, you will be presented with a cookie consent banner that allows you to accept or reject non-essential cookies. Under EU and UK law, we use non-essential cookies only with your prior consent.</p>

      <h3>3.2 Browser Settings</h3>
      <p>You can also control cookies through your browser settings. Most browsers allow you to block or delete cookies. Please note that blocking essential cookies may prevent you from using the platform. For more information on managing cookies in your browser:</p>
      <ul>
        <li>Chrome: chrome://settings/cookies</li>
        <li>Firefox: about:preferences#privacy</li>
        <li>Safari: Preferences &gt; Privacy</li>
        <li>Edge: edge://settings/content/cookies</li>
      </ul>

      <h3>3.3 Google Analytics Opt-Out</h3>
      <p>You can opt out of Google Analytics by installing the Google Analytics Opt-out Browser Add-on, available at: <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">https://tools.google.com/dlpage/gaoptout</a></p>

      <h3>3.4 Withdrawal of Consent</h3>
      <p>You can withdraw your consent to the use of non-essential cookies at any time. This does not affect the lawfulness of processing based on consent before its withdrawal.</p>

      <h3>3.5 California Residents</h3>
      <p>We do not sell your personal information within the meaning of the California Consumer Privacy Act (CCPA).</p>

      <h2>4. Lodging a Complaint</h2>
      <p>If you are based in the UK, you have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) at <a href="https://ico.org.uk/concerns/" target="_blank" rel="noopener noreferrer">https://ico.org.uk/concerns/</a>.</p>
      <p>If you are based in the EU, you may lodge a complaint with the relevant data protection authority in your member state.</p>

      <h2>5. Changes to This Policy</h2>
      <p>We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated &ldquo;Last Updated&rdquo; date. We will inform you of material changes via our official communication channels.</p>

      <h2>6. Contact Us</h2>
      <p>If you have any questions about this Cookie Policy or the information we hold about you:</p>
      <ul>
        <li><strong>Privacy Contact:</strong> support@getstudioos.com</li>
        <li><strong>General Support:</strong> support@getstudioos.com</li>
        <li><strong>Address:</strong> StudioOS, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</li>
      </ul>
    </LegalPageLayout>
  );
}
