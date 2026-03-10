"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  Mail,
  CheckCircle2,
} from "lucide-react";

export default function SignInPage() {
  const { account, studio, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendVerificationSent, setResendVerificationSent] = useState(false);

  // If already logged in, redirect to dashboard (don't block rendering)
  useEffect(() => {
    if (!authLoading && account && studio) {
      window.location.href = "/dashboard";
    }
  }, [authLoading, account, studio]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call Supabase directly — bypasses auth context to avoid any race conditions
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const errMsg = signInError.message || "Login failed";
        setError(errMsg);
        setLoading(false);
        // Detect unverified email error
        const lower = errMsg.toLowerCase();
        if (lower.includes("not confirmed") || lower.includes("not verified") || lower.includes("email_not_confirmed")) {
          setShowResendVerification(true);
        }
        return;
      }

      // Hard redirect — auth context will initialize fresh on the dashboard page
      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setForgotError("Please enter your email");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-[#0A0A0A] border-[#C9A84C]/10 shadow-2xl">
        <CardHeader className="space-y-3 pb-4 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] bg-clip-text text-transparent mb-1">
            StudioOS
          </div>
          <CardTitle className="text-xl font-bold text-white">Welcome Back</CardTitle>
          <p className="text-[#A8A49A]/50 text-sm">Sign in to your account</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-400">{error}</p>
                  {showResendVerification && (
                    <button
                      type="button"
                      disabled={resendingVerification || resendVerificationSent}
                      className="mt-2 text-xs text-[#C9A84C] hover:underline disabled:opacity-50"
                      onClick={async () => {
                        setResendingVerification(true);
                        try {
                          const res = await fetch("/api/auth/resend-verification", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email }),
                          });
                          if (res.ok) {
                            setResendVerificationSent(true);
                          }
                        } catch {
                          setError("Failed to resend verification email. Please try again.");
                        } finally {
                          setResendingVerification(false);
                        }
                      }}
                    >
                      {resendingVerification
                        ? "Sending..."
                        : resendVerificationSent
                          ? "Verification email sent! Check your inbox."
                          : "Resend verification email"}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/[0.04] border-white/[0.06] text-white placeholder:text-[#A8A49A]/30 focus:border-[#C9A84C]/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 bg-white/[0.04] border-white/[0.06] text-white placeholder:text-[#A8A49A]/30 focus:border-[#C9A84C]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A49A]/50 hover:text-white/70"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] hover:from-[#B8973B] hover:to-[#D4C07A] text-black h-11 text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setForgotEmail(email);
                }}
                className="text-[#C9A84C] hover:underline font-medium"
              >
                Forgot password?
              </button>
              <p className="text-[#A8A49A]/50">
                Don&apos;t have an account?{" "}
                <Link href="/pricing" className="text-[#C9A84C] hover:underline font-medium">
                  Create Studio
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <Card className="w-full max-w-md bg-[#0A0A0A] border-[#C9A84C]/10 shadow-2xl">
            <CardHeader className="space-y-3 pb-4 text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] bg-clip-text text-transparent mb-1">
                StudioOS
              </div>
              {forgotSent ? (
                <>
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg font-bold text-white">Check Your Email</CardTitle>
                </>
              ) : (
                <CardTitle className="text-lg font-bold text-white">Reset Password</CardTitle>
              )}
            </CardHeader>
            <CardContent>
              {forgotSent ? (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-[#A8A49A]/60">
                    If an admin/owner account exists for <strong className="text-[#C9A84C]">{forgotEmail}</strong>, we&apos;ve sent a temporary password.
                  </p>
                  <p className="text-xs text-[#A8A49A]/50">
                    Check your inbox and use the temporary password to sign in, then change it in Settings.
                  </p>
                  <Button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotSent(false);
                      setForgotEmail("");
                      setForgotError("");
                    }}
                    className="w-full bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] hover:from-[#B8973B] hover:to-[#D4C07A] text-black h-11 font-semibold"
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[#A8A49A]/60 text-center">
                    Enter your admin email address. We&apos;ll send you a password reset link.
                  </p>
                  <p className="text-xs text-[#A8A49A]/50 text-center">
                    This feature is only available for studio owners & admins. Models and operators should contact their studio admin for password resets.
                  </p>

                  {forgotError && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-400">{forgotError}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="forgotEmail" className="text-white/70">Email Address</Label>
                    <Input
                      id="forgotEmail"
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="bg-white/[0.04] border-white/[0.06] text-white placeholder:text-[#A8A49A]/30 focus:border-[#C9A84C]/50"
                    />
                  </div>

                  <Button
                    onClick={handleForgotPassword}
                    className="w-full bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] hover:from-[#B8973B] hover:to-[#D4C07A] text-black h-11 font-semibold"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Send Reset Link
                      </div>
                    )}
                  </Button>

                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotError("");
                    }}
                    className="w-full text-sm text-[#A8A49A]/50 hover:text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to Sign In
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
