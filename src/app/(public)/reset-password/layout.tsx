import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description:
    "Set a new password for your StudioOS account.",
  openGraph: {
    title: "Reset Password | StudioOS",
    description:
      "Set a new password for your StudioOS account.",
    url: "https://getstudioos.com/reset-password",
    siteName: "StudioOS",
    type: "website",
  },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
