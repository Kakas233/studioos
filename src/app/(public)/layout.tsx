import Link from "next/link";
import SupportChatWidget from "@/components/support/support-chat-widget";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="public-layout" className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#0A0A0A]/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/home" className="text-xl font-bold tracking-tight">
            <span className="text-[#C9A84C]">Studio</span>OS
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/home#features"
              className="text-sm text-[#A8A49A]/70 transition-colors hover:text-white"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-[#A8A49A]/70 transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/faq"
              className="text-sm text-[#A8A49A]/70 transition-colors hover:text-white"
            >
              FAQ
            </Link>
            <Link
              href="/blog"
              className="text-sm text-[#A8A49A]/70 transition-colors hover:text-white"
            >
              Blog
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm text-[#A8A49A]/70 transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#B89A3E]"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Support Chat Widget */}
      <SupportChatWidget />

      {/* Footer */}
      <footer className="border-t border-white/[0.04] bg-[#0A0A0A]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/home" className="text-lg font-bold tracking-tight">
                <span className="text-[#C9A84C]">Studio</span>OS
              </Link>
              <p className="mt-3 text-sm text-[#A8A49A]/40">
                The operating system for webcam studios.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold text-white/80">Product</h3>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/home#features"
                    className="text-sm text-[#A8A49A]/40 transition-colors hover:text-white"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-sm text-[#A8A49A]/40 transition-colors hover:text-white"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-sm text-[#A8A49A]/40 transition-colors hover:text-white"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold text-white/80">Legal</h3>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-[#A8A49A]/40 transition-colors hover:text-white"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-[#A8A49A]/40 transition-colors hover:text-white"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookies"
                    className="text-sm text-[#A8A49A]/40 transition-colors hover:text-white"
                  >
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/acceptable-use"
                    className="text-sm text-[#A8A49A]/40 transition-colors hover:text-white"
                  >
                    Acceptable Use
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-white/80">Resources</h3>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/blog"
                    className="text-sm text-[#A8A49A]/40 transition-colors hover:text-white"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help-center"
                    className="text-sm text-[#A8A49A]/40 transition-colors hover:text-white"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <a
                    href="https://t.me/StudioOS_updates"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#A8A49A]/40 transition-colors hover:text-white"
                  >
                    Telegram Updates
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/[0.04] pt-6 text-center text-sm text-[#A8A49A]/40">
            &copy; {new Date().getFullYear()} StudioOS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
