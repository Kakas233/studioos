"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Headset, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export default function SuperAdminReturnBanner() {
  const returnToken = typeof window !== "undefined" ? localStorage.getItem("studioos_superadmin_return") : null;
  const { isReadOnly } = useAuth();
  if (!returnToken) return null;

  const handleReturn = () => {
    localStorage.removeItem("studioos_superadmin_return");
    window.location.href = "/super-admin";
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] text-white text-center py-2 px-4 flex items-center justify-center gap-3 text-xs font-medium shadow-lg ${
      isReadOnly
        ? "bg-gradient-to-r from-[#1a5276] to-[#154360]"
        : "bg-gradient-to-r from-[#AA0608] to-[#8a0506]"
    }`}>
      <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-0.5">
        {isReadOnly ? <Eye className="w-3.5 h-3.5" /> : <Headset className="w-3.5 h-3.5" />}
        <span className="font-semibold">{isReadOnly ? "View Only" : "Admin Support"}</span>
      </div>
      <span className="text-white/80">
        {isReadOnly
          ? "Read-only mode \u2014 no changes can be made"
          : "All changes will be tagged as Admin Support"}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleReturn}
        className="h-6 text-xs text-white hover:bg-white/20 ml-2 border border-white/20"
      >
        <ArrowLeft className="w-3 h-3 mr-1" /> Exit
      </Button>
    </div>
  );
}
