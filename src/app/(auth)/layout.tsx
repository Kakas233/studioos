"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import SuperAdminReturnBanner from "@/components/shared/super-admin-return-banner";
import SuspendedBanner from "@/components/shared/suspended-banner";
import ReadOnlyOverlay from "@/components/shared/read-only-overlay";
import SupportChatWidget from "@/components/support/support-chat-widget";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/schedule": "Schedule",
  "/accounting": "Accounting",
  "/payouts": "Payouts",
  "/chat": "Team Chat",
  "/users": "User Management",
  "/rooms": "Room Management",
  "/settings": "Settings",
  "/data-backup": "Data Backup",
  "/stream-time": "Stream Time",
  "/billing": "Billing",
  "/model-insights": "Model Insights",
  "/member-lookup": "Member Lookup",
  "/member-alerts": "Member Alerts",
  "/model-lookup": "Model Lookup",
  "/faq": "FAQ",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasSuperAdminReturn, setHasSuperAdminReturn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, account, studio, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    setHasSuperAdminReturn(!!localStorage.getItem("studioos_superadmin_return"));
  }, []);

  // Redirect to sign-in if not authenticated (after loading completes)
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/sign-in");
    }
  }, [loading, user, router]);

  // Show spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No user at all — redirect is happening via useEffect above
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // User exists but account not loaded yet — show a helpful message instead of infinite spinner
  if (!account) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#A8A49A]/50 text-sm">Loading your account...</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-[#C9A84C] hover:underline mt-2"
        >
          Taking too long? Click to reload
        </button>
      </div>
    );
  }

  // Block non-admin users from accessing anything except Billing when suspended
  const isSuspended = studio?.subscription_status === "suspended";
  const canAccessBilling = account?.role === "owner" || account?.role === "admin";
  const isBillingPage = pathname === "/billing";
  const isFaqPage = pathname === "/faq";
  const blockedBySuspension = isSuspended && !isBillingPage && !isFaqPage;

  const title = PAGE_TITLES[pathname] || "StudioOS";

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <SuperAdminReturnBanner />
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      <div
        className={cn(
          "transition-all duration-300",
          "ml-0 md:ml-16",
          !sidebarCollapsed && "md:ml-64",
          hasSuperAdminReturn && "pt-8"
        )}
      >
        <Header
          title={title}
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />
        <main className="p-3 sm:p-6">
          <SuspendedBanner />
          <ReadOnlyOverlay>
            {blockedBySuspension ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-5">
                  <Lock className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-lg font-medium text-white mb-2">Studio Access Paused</h2>
                <p className="text-sm text-[#A8A49A]/50 max-w-md">
                  {canAccessBilling
                    ? "Your subscription has expired. Please go to Billing to subscribe and restore access."
                    : "This studio's subscription has expired. Please contact your studio administrator."}
                </p>
              </div>
            ) : (
              children
            )}
          </ReadOnlyOverlay>
        </main>
      </div>
      <SupportChatWidget />
    </div>
  );
}
