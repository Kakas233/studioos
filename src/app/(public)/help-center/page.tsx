"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, X, Search, ArrowLeft } from "lucide-react";
import HelpCenterSidebar, { SECTIONS } from "@/components/helpcenter/help-center-sidebar";
import HelpCenterContent from "@/components/helpcenter/help-center-content";

export default function HelpCenter() {
  const [activeSection, setActiveSection] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof allItems>([]);

  // Get all section items flat for search
  const allItems = SECTIONS.flatMap((s) => s.items);

  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setSearchResults(
        allItems.filter((item) => item.label.toLowerCase().includes(q))
      );
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Handle URL hash
  useEffect(() => {
    const hash = window.location.hash?.replace("#", "");
    if (hash && allItems.find((i) => i.id === hash)) {
      setActiveSection(hash);
    }
  }, []);

  const handleSectionChange = (id: string) => {
    setActiveSection(id);
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen bg-[#0A0A0A] text-white"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-[#A8A49A]/50 hover:text-white p-1"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <Link href="/home" className="flex items-center gap-2">
              <span className="text-lg font-semibold bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] bg-clip-text text-transparent">
                StudioOS
              </span>
            </Link>
            <span className="text-[#A8A49A]/25 text-sm hidden sm:inline">
              |
            </span>
            <span className="text-[#A8A49A]/50 text-sm font-medium hidden sm:inline">
              Help Center
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A49A]/30" />
              <Input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-56 h-8 bg-white/[0.03] border-white/[0.06] text-white text-sm placeholder:text-[#A8A49A]/30 rounded-lg focus:border-[#C9A84C]/30"
              />
              {searchResults.length > 0 && searchQuery && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[#111111] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50">
                  {searchResults.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleSectionChange(item.id);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                      >
                        <Icon className="w-4 h-4 text-[#C9A84C]" />
                        <span className="text-sm text-white">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Link href="/home">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#A8A49A]/40 hover:text-white text-xs gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Site
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                size="sm"
                className="bg-[#C9A84C] hover:bg-[#B8973B] text-black text-xs font-medium rounded-full px-4"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <HelpCenterSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <main className="pt-16 lg:pl-72">
        <div className="p-6 sm:p-10 lg:p-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 text-xs text-[#A8A49A]/30">
            <span>Help Center</span>
            <span>&rsaquo;</span>
            <span className="text-[#C9A84C]/60">
              {allItems.find((i) => i.id === activeSection)?.label ||
                "Overview"}
            </span>
          </div>

          <HelpCenterContent activeSection={activeSection} />

          {/* Bottom nav */}
          <div className="mt-16 pt-8 border-t border-white/[0.04] flex items-center justify-between">
            <div>
              {(() => {
                const idx = allItems.findIndex(
                  (i) => i.id === activeSection
                );
                const prev = idx > 0 ? allItems[idx - 1] : null;
                if (!prev) return null;
                return (
                  <button
                    onClick={() => handleSectionChange(prev.id)}
                    className="text-sm text-[#A8A49A]/40 hover:text-white transition-colors"
                  >
                    &larr; {prev.label}
                  </button>
                );
              })()}
            </div>
            <div>
              {(() => {
                const idx = allItems.findIndex(
                  (i) => i.id === activeSection
                );
                const next =
                  idx < allItems.length - 1 ? allItems[idx + 1] : null;
                if (!next) return null;
                return (
                  <button
                    onClick={() => handleSectionChange(next.id)}
                    className="text-sm text-[#A8A49A]/40 hover:text-white transition-colors"
                  >
                    {next.label} &rarr;
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-white/[0.04] text-center">
            <p className="text-[#A8A49A]/20 text-xs">
              &copy; {new Date().getFullYear()} StudioOS. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
