"use client";

import { useAuth } from "@/lib/auth/auth-context";
import type { ReactNode, MouseEvent } from "react";

/**
 * Wraps children and blocks all click/submit/input events when in read-only mode.
 * Shows a toast-style message when the user tries to interact.
 */
export default function ReadOnlyOverlay({ children }: { children: ReactNode }) {
  const { isReadOnly } = useAuth();

  if (!isReadOnly) return <>{children}</>;

  const handleBlock = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const tag = target.tagName;
    const isInteractive =
      tag === "BUTTON" ||
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      target.closest("button") ||
      target.closest("a[href]") ||
      target.closest('[role="button"]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[role="option"]') ||
      target.closest("[contenteditable]");

    // Allow navigation links (sidebar, tabs) but block form actions
    const isNavLink = target.closest("a[href]") && !target.closest("form");
    const isSidebarOrTab = target.closest("[data-allow-readonly]") || target.closest("nav");

    if (isInteractive && !isNavLink && !isSidebarOrTab) {
      e.preventDefault();
      e.stopPropagation();

      // Show a brief visual hint
      const existing = document.getElementById("readonly-toast");
      if (existing) existing.remove();

      const toast = document.createElement("div");
      toast.id = "readonly-toast";
      toast.style.cssText =
        "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:10000;background:#1a5276;color:white;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:8px;animation:fadeIn 0.2s ease-out;";
      toast.innerHTML = "\uD83D\uDC41\uFE0F View Only Mode \u2014 Changes are disabled";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  };

  return (
    <div onClickCapture={handleBlock}>
      {children}
    </div>
  );
}
