import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#0A0A0A]/95 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[#C9A84C]" />
            <h1 className="text-sm font-semibold text-white tracking-wide">
              Super Admin
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs text-[#A8A49A]/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="p-3 sm:p-6">{children}</main>
    </div>
  );
}
