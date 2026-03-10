import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Modern Slavery Statement",
  description:
    "StudioOS voluntary Modern Slavery and Human Trafficking Statement. Our commitment to ethical business practices and human rights.",
  openGraph: {
    title: "Modern Slavery Statement | StudioOS",
    description:
      "StudioOS voluntary Modern Slavery and Human Trafficking Statement. Our commitment to ethical business practices and human rights.",
    url: "https://getstudioos.com/modern-slavery",
    siteName: "StudioOS",
    type: "website",
  },
};

export default function ModernSlaveryStatement() {
  return (
    <LegalPageLayout title="Voluntary Modern Slavery and Human Trafficking Statement" lastUpdated="February 2026">
      <p>At StudioOS, we are steadfast in our commitment to conducting business ethically and with integrity across all aspects of our operations. Our dedication to empowering webcam studio owners and managers with advanced analytics and management tools is grounded in our core values of respect, fairness, and responsibility. We recognise our responsibility to ensure our operations and supply chains are free from modern slavery and human trafficking.</p>

      <h2>1. Our Business and Ethical Approach</h2>
      <p>StudioOS operates StudioOS, a web-based management platform designed specifically for webcam studios. Our services, offered on a subscription basis, aim to support our clients in enhancing their operational efficiency, team management, earnings tracking, and scheduling capabilities. As a UK-registered entity with a globally distributed team, we are uniquely positioned to promote ethical practices within the digital content creation industry.</p>

      <h2>2. Policies Against Modern Slavery</h2>
      <p>We maintain the following policies and commitments:</p>
      <ul>
        <li>Zero-tolerance approach to modern slavery, forced labour, and human trafficking;</li>
        <li>Embedded requirements in supplier and partner contracts to ensure compliance with ethical labour practices;</li>
        <li>Commitment to upholding the highest standards of ethical conduct in all business relationships;</li>
        <li>Compliance with the Modern Slavery Act 2015 and all applicable human rights legislation.</li>
      </ul>

      <h2>3. Due Diligence and Risk Management</h2>
      <p>StudioOS conducts thorough due diligence on all suppliers and third-party partners to verify their commitment to ethical labour practices. Our risk management strategies are designed to identify, assess, and mitigate any risks related to modern slavery and human trafficking in our operations and supply chains.</p>

      <h2>4. Effectiveness and Monitoring</h2>
      <p>We are committed to monitoring and reviewing our policies and practices regularly to ensure their effectiveness in combating modern slavery. This includes evaluating the success of our due diligence processes and making necessary improvements based on these assessments.</p>

      <h2>5. Training and Employee Awareness</h2>
      <p>All StudioOS team members, regardless of their global location, receive training on modern slavery and human trafficking issues. This training equips them with the knowledge and tools needed to identify and prevent unethical practices within our operations and supply chains.</p>

      <h2>6. Global Workforce Ethical Practices</h2>
      <p>StudioOS ensures that our globally distributed team is supported by fair labour practices, emphasising equitable treatment, work-life balance, and access to mental health resources. We aim to create a remote working environment that is safe, supportive, and conducive to professional growth.</p>

      <h2>7. Technology and Ethical Use</h2>
      <p>We recognise the significant impact technology has on society and are dedicated to the ethical development and deployment of our services. StudioOS is designed to foster a safe and positive environment for all users, ensuring that our technological solutions contribute positively to the webcam studio management industry.</p>

      <h2>8. Reporting Concerns</h2>
      <p>We encourage open feedback from our users, employees, and partners regarding our practices, including any concerns related to ethical practices and modern slavery. If you have any concerns or wish to report suspected modern slavery or human trafficking in connection with our operations or supply chains, please contact us immediately.</p>

      <h2>9. Continuous Improvement</h2>
      <p>Acknowledging the evolving nature of modern slavery challenges, StudioOS is dedicated to continually enhancing our policies and practices. We welcome feedback and engage in regular dialogue with our stakeholders to strengthen our efforts against modern slavery.</p>

      <h2>10. Declaration</h2>
      <p>This statement represents StudioOS&apos;s global commitment to ethical business conduct and respect for human rights. We voluntarily publish this statement to demonstrate transparency, accountability, and continuous improvement across our worldwide operations and supply chains.</p>
      <p><strong>February 2026</strong></p>
      <p>StudioOS<br />Company Number: 16286389<br />71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</p>

      <h2>11. Contact Us</h2>
      <ul>
        <li><strong>General Support:</strong> support@getstudioos.com</li>
        <li><strong>Reporting Concerns:</strong> support@getstudioos.com</li>
        <li><strong>Address:</strong> StudioOS, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom</li>
      </ul>
    </LegalPageLayout>
  );
}
