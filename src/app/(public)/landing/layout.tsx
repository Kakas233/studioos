import type { Metadata } from "next";
import LandingLayoutClient from "./landing-layout-client";

export const metadata: Metadata = {
  title: "Webcam Studio Management Software",
  description:
    "Track model earnings, performance, and viewer activity across all major cam sites from one dashboard. The all-in-one operating system for webcam studios.",
  openGraph: {
    title: "StudioOS — Webcam Studio Management Software",
    description:
      "Track model earnings, performance, and viewer activity across all major cam sites from one dashboard. The all-in-one operating system for webcam studios.",
    url: "https://getstudioos.com/landing",
    siteName: "StudioOS",
    type: "website",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LandingLayoutClient>{children}</LandingLayoutClient>;
}
