import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights, guides, and resources for webcam studio operators. Learn about studio management, cam site strategies, and industry best practices.",
  openGraph: {
    title: "Blog | StudioOS",
    description:
      "Insights, guides, and resources for webcam studio operators. Learn about studio management, cam site strategies, and industry best practices.",
    url: "https://getstudioos.com/blog",
    siteName: "StudioOS",
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
