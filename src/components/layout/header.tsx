"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ROLE_COLORS } from "@/lib/config";

interface HeaderProps {
  title: string;
  onMobileMenuToggle: () => void;
}

export default function Header({ title, onMobileMenuToggle }: HeaderProps) {
  const { account, role } = useAuth();
  const userRole = role || "owner";

  const roleColor = ROLE_COLORS[userRole] || ROLE_COLORS.owner;

  return (
    <header className="sticky top-0 z-40 h-14 sm:h-16 bg-gradient-to-r from-[#0e0d08]/80 via-[#0A0A0A]/80 to-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/[0.04]">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="md:hidden text-[#A8A49A]/60 hover:text-white hover:bg-white/[0.06] h-9 w-9"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-base sm:text-lg font-medium text-white tracking-tight truncate">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
            <span className="text-[#C9A84C] text-sm font-medium">
              {account?.first_name?.charAt(0) || "?"}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">
              {account?.first_name || "User"}
            </p>
            <Badge
              variant="outline"
              className={`${roleColor.bg} ${roleColor.text} text-[10px] capitalize`}
            >
              {userRole}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
