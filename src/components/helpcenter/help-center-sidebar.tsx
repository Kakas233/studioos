"use client";

import {
  LayoutDashboard, Calendar, DollarSign, Users, Monitor,
  Search, Bell, MessageSquare, Settings, CreditCard,
  Play, Shield, HelpCircle, Sparkles, Clock, Home, Eye, Database,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarSection {
  group: string;
  items: SidebarItem[];
}

export const SECTIONS: SidebarSection[] = [
  {
    group: "Getting Started",
    items: [
      { id: "overview", label: "Platform Overview", icon: Home },
      { id: "registration", label: "Registration & Setup", icon: Play },
      { id: "roles", label: "Roles & Permissions", icon: Shield },
    ]
  },
  {
    group: "Core Features",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "schedule", label: "Shift Scheduling", icon: Calendar },
      { id: "streamtime", label: "Stream Time Tracking", icon: Clock },
      { id: "accounting", label: "Earnings & Accounting", icon: DollarSign },
      { id: "payouts", label: "Payouts", icon: CreditCard },
    ]
  },
  {
    group: "Intelligence Tools",
    items: [
      { id: "modelinsights", label: "Model Insights & AI", icon: Sparkles },
      { id: "modellookup", label: "Model Lookup", icon: Eye },
      { id: "memberlookup", label: "Member Lookup", icon: Search },
      { id: "memberalerts", label: "Member Alerts", icon: Bell },
      { id: "livemonitor", label: "Live Stream Monitor", icon: Monitor },
    ]
  },
  {
    group: "Management",
    items: [
      { id: "users", label: "User Management", icon: Users },
      { id: "rooms", label: "Room Management", icon: LayoutDashboard },
      { id: "chat", label: "Team Chat", icon: MessageSquare },
      { id: "billing", label: "Billing & Plans", icon: CreditCard },
      { id: "settings", label: "Studio Settings", icon: Settings },
      { id: "databackup", label: "Data Backup", icon: Database },
    ]
  },
  {
    group: "Support",
    items: [
      { id: "support", label: "Contact Support", icon: MessageSquare },
      { id: "faq", label: "FAQ", icon: HelpCircle },
    ]
  }
];

interface HelpCenterSidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function HelpCenterSidebar({ activeSection, onSectionChange, mobileOpen, onMobileClose }: HelpCenterSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onMobileClose} />
      )}

      <aside className={cn(
        "fixed top-16 left-0 bottom-0 w-72 bg-[#0A0A0A] border-r border-white/[0.04] overflow-y-auto z-50 transition-transform duration-300",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-5 space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.group}>
              <p className="text-[10px] font-semibold text-[#A8A49A]/30 uppercase tracking-[0.1em] mb-2 px-2">
                {section.group}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onSectionChange(item.id); onMobileClose?.(); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                        isActive
                          ? "bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20"
                          : "text-[#A8A49A]/50 hover:text-white hover:bg-white/[0.03] border border-transparent"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
