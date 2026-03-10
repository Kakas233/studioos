import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for StudioOS. Start with a free 7-day trial. Plans from $29/month. Scale as your webcam studio grows.",
  openGraph: {
    title: "Pricing | StudioOS",
    description:
      "Simple, transparent pricing for StudioOS. Start with a free 7-day trial. Plans from $29/month. Scale as your webcam studio grows.",
    url: "https://getstudioos.com/pricing",
    siteName: "StudioOS",
    type: "website",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
