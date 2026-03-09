import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Pricing — StudioOS",
    description:
      "Simple, transparent pricing for webcam studio management. Start with a free 7-day trial. Plans from $29/mo.",
    openGraph: {
      title: "Pricing — StudioOS",
      description:
        "Simple, transparent pricing for webcam studio management. Start with a free 7-day trial. Plans from $29/mo.",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Pricing — StudioOS",
      description:
        "Simple, transparent pricing for webcam studio management. Start with a free 7-day trial. Plans from $29/mo.",
    },
    alternates: {
      canonical: "/pricing",
    },
  };
}
