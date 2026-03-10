import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Studio",
  description:
    "Create your StudioOS account and start your 7-day free trial. No credit card required. Manage your webcam studio smarter from day one.",
  openGraph: {
    title: "Create Your Studio | StudioOS",
    description:
      "Create your StudioOS account and start your 7-day free trial. No credit card required. Manage your webcam studio smarter from day one.",
    url: "https://getstudioos.com/sign-up",
    siteName: "StudioOS",
    type: "website",
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
