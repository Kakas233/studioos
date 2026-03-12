"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'studioos_cookie_consent';

export function getCookieConsent(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(COOKIE_CONSENT_KEY);
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.opt_out_capturing();
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-gradient-to-t from-[#1a1a1a] to-[#1a1a1a]/95 border-t border-white/[0.06] backdrop-blur-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <p className="text-[#A8A49A]/60 text-xs sm:text-sm text-center sm:text-left">
          We use{' '}
          <Link href="/cookies" className="text-[#A8A49A] underline underline-offset-2 hover:text-white transition-colors">
            cookies
          </Link>
          {' '}to improve your experience.
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleDecline}
            className="text-[#A8A49A]/50 text-xs sm:text-sm hover:text-white transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="bg-[#C9A84C] hover:bg-[#B8973B] text-black text-xs sm:text-sm font-medium px-4 py-1.5 rounded-md transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
