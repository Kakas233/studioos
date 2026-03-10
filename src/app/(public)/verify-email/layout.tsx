import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email",
  description:
    "Verify your email address to activate your StudioOS account and start managing your webcam studio.",
  openGraph: {
    title: "Verify Email | StudioOS",
    description:
      "Verify your email address to activate your StudioOS account and start managing your webcam studio.",
    url: "https://getstudioos.com/verify-email",
    siteName: "StudioOS",
    type: "website",
  },
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
