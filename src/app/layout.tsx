import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "StudioOS — Webcam Studio Management Software",
    template: "%s | StudioOS",
  },
  description:
    "All-in-one webcam studio management platform. Track streams, manage models, automate earnings, and optimize performance across 8 cam sites.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://getstudioos.com"),
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "StudioOS",
    title: "StudioOS — Webcam Studio Management Software",
    description:
      "All-in-one webcam studio management platform. Track streams, manage models, automate earnings, and optimize performance across 8 cam sites.",
  },
  twitter: {
    card: "summary_large_image",
    title: "StudioOS — Webcam Studio Management Software",
    description:
      "All-in-one webcam studio management platform. Track streams, manage models, automate earnings, and optimize performance across 8 cam sites.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
