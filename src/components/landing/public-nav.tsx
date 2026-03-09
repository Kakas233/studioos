"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function PublicNav({ activePage }: { activePage?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLanding = activePage === 'landing';

  const navLinks = [
    ...(isLanding
      ? [
          { label: 'Features', href: '#features' },
          { label: 'Pricing', href: '#pricing' },
        ]
      : [
          { label: 'Home', to: '/home' },
          { label: 'Pricing', href: '/home#pricing', external: true },
        ]),
    { label: 'Blog', to: '/blog' },
    { label: 'Help Center', to: '/help-center' },
    ...(isLanding
      ? [{ label: 'FAQ', href: '#faq' }]
      : [{ label: 'FAQ', href: '/home#faq', external: true }]),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/[0.04]" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/home" className="text-lg font-medium text-white tracking-tight hover:text-[#C9A84C] transition-colors">
          StudioOS
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          {navLinks.map((link) => {
            if ('to' in link && link.to) {
              return (
                <Link
                  key={link.label}
                  href={link.to}
                  className="text-[#A8A49A]/60 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              );
            }
            return (
              <a key={link.label} href={link.href} className="text-[#A8A49A]/60 hover:text-white transition-colors">
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-[#A8A49A]/60 hover:text-white hover:bg-white/[0.04] text-sm">
              Sign In
            </Button>
          </Link>
          {isLanding ? (
            <a href="#pricing">
              <Button className="bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium rounded-full px-5 text-sm">
                Start Free Trial
              </Button>
            </a>
          ) : (
            <Link href="/sign-up">
              <Button className="bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium rounded-full px-5 text-sm">
                Get Started
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[#A8A49A] hover:text-white transition-colors p-1"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/[0.04] px-6 py-4 space-y-3">
          {navLinks.map((link) =>
            'to' in link && link.to ? (
              <Link key={link.label} href={link.to} onClick={() => setMobileMenuOpen(false)} className="block text-[#A8A49A]/60 hover:text-white transition-colors text-sm py-2">
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block text-[#A8A49A]/60 hover:text-white transition-colors text-sm py-2">
                {link.label}
              </a>
            )
          )}
          <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-2">
            <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full text-[#A8A49A]/60 hover:text-white hover:bg-white/[0.04] text-sm">
                Sign In
              </Button>
            </Link>
            {isLanding ? (
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium rounded-full text-sm">
                  Start Free Trial
                </Button>
              </a>
            ) : (
              <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium rounded-full text-sm">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
