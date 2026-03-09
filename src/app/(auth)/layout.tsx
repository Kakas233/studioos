"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/schedule": "Schedule",
  "/accounting": "Accounting",
  "/payouts": "Payouts",
  "/chat": "Team Chat",
  "/stream-time": "Stream Time",
  "/model-insights": "Model Insights",
  "/member-lookup": "Member Lookup",
  "/model-lookup": "Model Lookup",
  "/member-alerts": "Member Alerts",
  "/users": "Team Management",
  "/rooms": "Rooms",
  "/settings": "Settings",
  "/billing": "Billing",
  "/data-backup": "Audit & Recovery",
  "/faq": "FAQ & Support",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // The middleware should handle redirects, but this is a fallback
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  const title = PAGE_TITLES[pathname] || "StudioOS";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        <Header
          title={title}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />
        <main className="p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
