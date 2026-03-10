"use client";

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg font-medium text-white mb-3 tracking-tight">
              <span className="text-[#C9A84C]">Studio</span>OS
            </h3>
            <p className="text-[#A8A49A]/40 text-sm leading-relaxed">
              The #1 webcam studio management platform. Auto stream tracking, scheduling & payouts across 8 cam sites.
            </p>
          </div>

          <div>
            <h4 className="text-white/80 font-medium mb-4 text-sm tracking-wide">Product</h4>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">Features</a></li>
              <li><a href="#pricing" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">Pricing</a></li>
              <li>
                <Link href="/blog" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li><a href="#faq" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">FAQ</a></li>
              <li>
                <Link href="/help-center" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white/80 font-medium mb-4 text-sm tracking-wide">Account</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/sign-in" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white/80 font-medium mb-4 text-sm tracking-wide">Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/terms" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">
                  Cookies Policy
                </Link>
              </li>
              <li>
                <Link href="/payment-refund" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">
                  Payment & Refunds
                </Link>
              </li>
              <li>
                <Link href="/modern-slavery" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">
                  Modern Slavery
                </Link>
              </li>
              <li>
                <Link href="/acceptable-use" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">
                  Acceptable Use
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white/80 font-medium mb-4 text-sm tracking-wide">Contact</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:support@getstudioos.com" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">
                  support@getstudioos.com
                </a>
              </li>
              <li>
                <a href="https://t.me/StudioOS_updates" target="_blank" rel="noopener noreferrer" className="text-[#A8A49A]/40 hover:text-[#C9A84C]/70 transition-colors text-sm">
                  Telegram Update Channel
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.04]">
          <p className="text-[#A8A49A]/25 text-xs text-center">
            &copy; {currentYear} StudioOS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
