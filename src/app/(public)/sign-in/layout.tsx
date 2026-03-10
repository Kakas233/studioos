import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your StudioOS account to manage your webcam studio, track earnings, and monitor model performance.",
  openGraph: {
    title: "Sign In | StudioOS",
    description:
      "Sign in to your StudioOS account to manage your webcam studio, track earnings, and monitor model performance.",
    url: "https://getstudioos.com/sign-in",
    siteName: "StudioOS",
    type: "website",
  },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
