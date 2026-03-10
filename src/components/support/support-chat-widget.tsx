"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import SupportChatPanel from "@/components/support/support-chat-panel";
import { useAuth } from "@/lib/auth/auth-context";

// TODO: Migrate agent images to own Supabase storage bucket (studio-assets)
// These currently reference the original Base44 storage
const AGENT_IMAGES: Record<string, string> = {
  luke: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6963df2bdfca920e5f5d8cfe/1b865c1f2_8fc796920cad7587fa016ad1fb423d45.jpg",
  maria: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6963df2bdfca920e5f5d8cfe/45e99d839_b35448d5b83dfc039a1b55d27d2f41a3.jpg",
  peter: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6963df2bdfca920e5f5d8cfe/cd4039c40_f61f3a929d54fee54679551a728bb7d7.jpg",
};

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  return (
    <>
      {/* Chat panel -- full screen on mobile, floating on desktop */}
      {open && (
        <div
          className={cn(
            "fixed z-[70] overflow-hidden flex flex-col",
            // Mobile: full screen
            "inset-0 rounded-none",
            // Desktop: floating panel
            "sm:inset-auto sm:bottom-[7.5rem] sm:right-5 sm:w-[380px] sm:max-w-[calc(100vw-40px)] sm:h-[560px] sm:max-h-[calc(100vh-160px)] sm:rounded-2xl"
          )}
          style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}
        >
          <SupportChatPanel onClose={() => setOpen(false)} agentImages={AGENT_IMAGES} />
        </div>
      )}

      {/* Floating button */}
      <div className="fixed bottom-20 right-5 z-[70] sm:bottom-20 sm:right-5">
        <button
          onClick={() => { setOpen(!open); setHasUnread(false); }}
          className={cn(
            "h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200",
            "bg-[#C9A84C] hover:bg-[#B8973B] active:scale-95",
            open && "sm:flex hidden" // hide button on mobile when open (panel is full screen)
          )}
        >
          {open ? (
            <ChevronDown className="w-5 h-5 text-white" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
              <circle cx="8" cy="10" r="1.2" fill="#C9A84C"/>
              <circle cx="12" cy="10" r="1.2" fill="#C9A84C"/>
              <circle cx="16" cy="10" r="1.2" fill="#C9A84C"/>
            </svg>
          )}
          {hasUnread && !open && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">1</span>
            </span>
          )}
        </button>
      </div>
    </>
  );
}

export { AGENT_IMAGES };
