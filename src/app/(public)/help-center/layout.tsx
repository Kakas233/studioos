import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "StudioOS Help Center — guides, documentation, and support resources to help you get the most out of your webcam studio management platform.",
  openGraph: {
    title: "Help Center | StudioOS",
    description:
      "StudioOS Help Center — guides, documentation, and support resources to help you get the most out of your webcam studio management platform.",
    url: "https://getstudioos.com/help-center",
    siteName: "StudioOS",
    type: "website",
  },
};

export default function HelpCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The help center has its own custom navigation and layout,
  // so we override the parent public layout's wrapper styling.
  // We use a full-screen container that breaks out of the parent layout.
  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0A] overflow-auto">
      {children}
    </div>
  );
}
