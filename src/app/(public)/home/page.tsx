import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Home",
  description:
    "StudioOS — the all-in-one webcam studio management platform. Track earnings, manage models, and optimize performance across all major cam sites.",
  openGraph: {
    title: "StudioOS — Webcam Studio Management Software",
    description:
      "StudioOS — the all-in-one webcam studio management platform. Track earnings, manage models, and optimize performance across all major cam sites.",
    url: "https://getstudioos.com",
    siteName: "StudioOS",
    type: "website",
  },
};

export default function HomePage() {
  redirect("/landing");
}
