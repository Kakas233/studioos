"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Calendar, DollarSign, Wallet, Settings,
  ChevronLeft, ChevronRight, LogOut, Users, Building2,
  HelpCircle, Database, MessageSquare, Radio, CreditCard,
  Search, Bell, BarChart3, Lock, X, UserSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  page: string;
  roles: string[];
  requiredTier: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", page: "Dashboard", roles: ["owner", "admin", "operator", "model", "accountant"], requiredTier: "free" },
  { icon: Calendar, label: "Schedule", href: "/schedule", page: "Schedule", roles: ["owner", "admin", "operator", "model"], requiredTier: "free" },
  { icon: DollarSign, label: "Accounting", href: "/accounting", page: "Accounting", roles: ["owner", "admin", "operator", "model", "accountant"], requiredTier: "free" },
  { icon: Wallet, label: "Payouts", href: "/payouts", page: "Payouts", roles: ["owner", "admin", "operator", "model", "accountant"], requiredTier: "free" },
  { icon: MessageSquare, label: "Chat", href: "/chat", page: "Chat", roles: ["owner", "admin", "operator", "model"], requiredTier: "pro" },
  { icon: Radio, label: "Stream Time", href: "/stream-time", page: "StreamTime", roles: ["owner", "admin"], requiredTier: "starter" },
  { icon: BarChart3, label: "Model Insights", href: "/model-insights", page: "ModelInsights", roles: ["owner", "admin"], requiredTier: "starter" },
  { icon: Search, label: "Member Lookup", href: "/member-lookup", page: "MemberLookup", roles: ["owner", "admin", "operator"], requiredTier: "pro" },
  { icon: UserSearch, label: "Model Lookup", href: "/model-lookup", page: "ModelLookupNew", roles: ["owner", "admin", "operator"], requiredTier: "pro" },
  { icon: Bell, label: "Member Alerts", href: "/member-alerts", page: "MemberAlerts", roles: ["owner", "admin", "operator"], requiredTier: "elite" },
  { icon: Users, label: "Users", href: "/users", page: "UsersManagement", roles: ["owner", "admin"], requiredTier: "starter" },
  { icon: Building2, label: "Rooms", href: "/rooms", page: "Rooms", roles: ["owner", "admin"], requiredTier: "starter" },
  { icon: Settings, label: "Settings", href: "/settings", page: "AdminSettings", roles: ["owner", "admin"], requiredTier: "free" },
  { icon: CreditCard, label: "Billing", href: "/billing", page: "Billing", roles: ["owner", "admin"], requiredTier: "free" },
  { icon: Database, label: "Audit & Recovery", href: "/data-backup", page: "DataBackup", roles: ["owner", "admin"], requiredTier: "free" },
  { icon: HelpCircle, label: "FAQ", href: "/faq", page: "FAQ", roles: ["owner", "admin", "operator", "model", "accountant"], requiredTier: "free" },
];

const tierOrder: Record<string, number> = { free: 0, starter: 1, pro: 2, elite: 3 };

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { account, studio, signOut, role } = useAuth();
  const userRole = role || "owner";

  const isLocked = (requiredTier: string) => {
    if (!requiredTier || requiredTier === "free") return false;
    const current = tierOrder[studio?.subscription_tier as string] || 0;
    const required = tierOrder[requiredTier] || 0;
    return current < required;
  };

  const isSoloModel = userRole === "model" && account?.works_alone;

  const filteredNav = navItems.filter((item) => {
    if (item.roles.includes(userRole as string)) return true;
    if (isSoloModel && (item.page === "MemberLookup" || item.page === "MemberAlerts" || item.page === "ModelLookupNew")) return true;
    return false;
  });

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const handleNavClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between border-b border-white/[0.04] px-4">
        <div className="flex items-center gap-3 min-w-0">
          {studio?.logo_url ? (
            <img src={studio.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 bg-[#C9A84C] rounded-lg flex items-center justify-center shrink-0">
              <span className="text-black font-semibold text-sm">{studio?.name?.charAt(0) || "S"}</span>
            </div>
          )}
          {(isMobile || !collapsed) && (
            <span className="font-medium text-base tracking-tight text-white truncate">{studio?.name || "StudioOS"}</span>
          )}
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="text-[#A8A49A]/60 hover:text-white shrink-0">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const locked = isLocked(item.requiredTier);
          const tierLabel = item.requiredTier ? item.requiredTier.charAt(0).toUpperCase() + item.requiredTier.slice(1) : "";
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    locked
                      ? "text-[#A8A49A]/35 hover:bg-white/[0.02] hover:text-[#A8A49A]/45"
                      : isActive
                        ? "bg-white/[0.06] text-white"
                        : "hover:bg-white/[0.04] text-[#A8A49A]/60 hover:text-[#e8e6e3]"
                  )}
                >
                  <item.icon className={cn("w-[18px] h-[18px] shrink-0", locked && "opacity-50")} />
                  {(isMobile || !collapsed) && (
                    <>
                      <span className={locked ? "opacity-50" : ""}>{item.label}</span>
                      {locked && (
                        <span className="ml-auto flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-white/[0.04] text-[#A8A49A]/40 rounded">
                          <Lock className="w-2.5 h-2.5" />
                          {tierLabel}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </TooltipTrigger>
              {!isMobile && collapsed && (
                <TooltipContent side="right" className="bg-[#111111] text-white border-white/[0.06]">
                  {item.label}
                  {locked && <span className="ml-1 text-[#C9A84C]">({tierLabel})</span>}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-white/[0.04]">
        {(isMobile || !collapsed) && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-white truncate">{account?.first_name || "User"}</p>
            <p className="text-xs text-[#A8A49A]/40 capitalize">{userRole}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size={!isMobile && collapsed ? "icon" : "default"}
          onClick={handleLogout}
          className={cn(
            "w-full text-[#A8A49A]/40 hover:text-[#e8e6e3] hover:bg-white/[0.04]",
            !isMobile && collapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4" />
          {(isMobile || !collapsed) && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </>
  );

  return (
    <TooltipProvider>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen text-white transition-all duration-300 z-50 flex flex-col border-r border-white/[0.04]",
          "bg-gradient-to-b from-[#0e0d08] via-[#0A0A0A] to-[#0A0A0A]",
          collapsed ? "w-16" : "w-64",
          "hidden md:flex"
        )}
      >
        {sidebarContent(false)}

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#111111] border border-white/[0.08] hover:bg-[#1a1a1a] text-[#A8A49A]/60 hover:text-[#e8e6e3]"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-gradient-to-b from-[#0e0d08] via-[#0A0A0A] to-[#0A0A0A] text-white flex flex-col border-r border-white/[0.04] shadow-2xl">
            {sidebarContent(true)}
          </aside>
        </div>
      )}
    </TooltipProvider>
  );
}
