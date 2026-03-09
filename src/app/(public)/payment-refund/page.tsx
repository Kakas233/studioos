import LegalPageLayout from "@/components/legal/legal-page-layout";

export default function PaymentRefundPolicy() {
  return (
    <LegalPageLayout title="Payment and Refund Policy" lastUpdated="February 2026">
      <p>All terms not defined in this Payment and Refund Policy have the same meaning as in our <a href="/terms">Terms of Service</a>.</p>
      <p><strong>NOTE:</strong> We offer a 7-day free trial on all plans so you can evaluate the full capabilities of StudioOS before committing.</p>

      <h2>1. Payment Processing</h2>
      <p>We use Stripe and other electronic payment services for processing payments. All transactions are processed through third-party payment processors. By making a payment, you authorise StudioOS and its payment processor to charge the full amount of the transaction, including any applicable fees, to your selected payment method.</p>
      <p>You can purchase a Subscription using major credit cards (Mastercard, VISA), Google Pay, Apple Pay, and other payment methods supported by our payment processors. This list is not exhaustive.</p>
      <p>Please be aware that payment card issuers may charge additional fees for transaction processing or currency conversion.</p>
      <p>Your credit card or debit card will only be charged when you confirm your purchase. All payments by credit card or debit card need to be authorised by the relevant card issuer.</p>

      <h2>2. Payment Security and Personal Data</h2>
      <p>Card payments are processed by our PCI DSS-compliant payment processors. We do not store full card numbers. We process personal data related to payments in accordance with our <a href="/privacy">Privacy Policy</a> (e.g., payment tokens, card type, last four digits, billing country) for billing, fraud prevention, and compliance purposes.</p>

      <h2>3. Prices and Taxes</h2>
      <p>All prices are shown exclusive of any applicable taxes unless stated otherwise. Depending on your billing address and status, value added tax (VAT), sales or use taxes may apply.</p>
      <ul>
        <li>For EU/EEA customers, VAT is charged unless a valid VAT number is provided and reverse charge applies.</li>
        <li>For UK customers, UK VAT may apply.</li>
        <li>For US customers, sales or use tax may be collected where required by law.</li>
      </ul>
      <p>You are responsible for any taxes that arise from your purchase and for providing accurate tax information.</p>

      <h2>4. Subscription Plans</h2>
      <p>StudioOS offers various Subscription plans, including Starter, Pro, and Elite tiers. Plans vary in features, model limits, and pricing. Subscription plans may be subject to additional terms and conditions disclosed at the time of purchase. Visit our pricing page at getstudioos.com for current plan details.</p>

      <h2>5. Price Changes</h2>
      <p>We may change Subscription prices from time to time. Any change will be communicated at least 30 days in advance and will take effect from your next billing cycle. If you do not agree to the new price, you can cancel before the renewal date; otherwise, your continued use constitutes acceptance of the new price.</p>

      <h2>6. Automatic Renewal</h2>
      <p>If you choose a paid Subscription plan, all Subscription plans automatically renew before the end of the subscription period, unless you cancel the subscription before the renewal date. If you do not cancel, we will automatically renew your Subscription and charge your selected payment method at the then-current Subscription rate.</p>

      <h2>7. Refunds</h2>
      <p>We do not offer refunds, except as required by applicable law. You get access to StudioOS immediately after purchasing the Subscription. After that, our supply of StudioOS is considered complete, and your right to cancel or withdraw from the agreement is lost from this point.</p>

      <h3>7.1 Right of Withdrawal (EU/UK Consumers)</h3>
      <p>StudioOS is digital content supplied on a non-tangible medium. By purchasing a Subscription, you expressly request immediate access to the Service and acknowledge that once access is granted, you lose your statutory right of withdrawal for that billing period to the extent permitted by applicable law.</p>

      <h3>7.2 Refund Exceptions</h3>
      <p>Without limiting the above, we may issue refunds at our discretion in cases of:</p>
      <ul>
        <li>Duplicate charges;</li>
        <li>Proven unauthorised use of your payment method;</li>
        <li>Documented technical failures preventing access after purchase; or</li>
        <li>Where required by applicable consumer law.</li>
      </ul>
      <p>If you believe that you are entitled to a refund, please contact us at <strong>support@getstudioos.com</strong> and we will review your request. If your request is approved, you will receive your refund within up to 7 business days to the original payment method.</p>

      <h2>8. Payment Disputes</h2>
      <p>If you dispute a payment made for StudioOS, you agree to first contact StudioOS to attempt to resolve the dispute. If we cannot resolve the dispute, you may contact your payment provider or credit card issuer to initiate a chargeback. We reserve the right to contest improper chargebacks and to recoup related fees and costs where permitted by law.</p>

      <h2>9. Sanctions and Export Control</h2>
      <p>StudioOS may decline or cancel a transaction, or suspend access to the Service, if required by applicable sanctions, anti-money laundering, or export control laws, or if a payment is flagged by our payment processors for compliance reasons.</p>

      <h2>10. Relationship to Other Policies</h2>
      <p>This Payment and Refund Policy forms part of, and should be read together with, our <a href="/terms">Terms of Service</a>, <a href="/privacy">Privacy Policy</a>, and <a href="/cookies">Cookie Policy</a>.</p>

      <h2>11. Governing Law</h2>
      <p>This Payment and Refund Policy is governed by the laws of England and Wales as specified in the &ldquo;Governing Law and Jurisdiction&rdquo; section of our Terms of Service.</p>

      <h2>12. Changes to This Policy</h2>
      <p>StudioOS reserves the right to modify this Payment and Refund Policy at any time. Material changes will be communicated at least 30 days before taking effect. Your continued use of StudioOS constitutes your acceptance of those changes.</p>

      <h2>13. Contact Us</h2>
      <ul>
        <li><strong>General Support:</strong> support@getstudioos.com</li>
        <li><strong>Address:</strong> StudioOS, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</li>
      </ul>
    </LegalPageLayout>
  );
}
