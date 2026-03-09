"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

export default function SuperAdminLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if already logged in as super admin
  useEffect(() => {
    const token = localStorage.getItem("studioos_superadmin_session");
    if (token) {
      router.push("/super-admin");
    }
  }, [router]);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, step: "login" }),
      });
      const data = await res.json();

      if (data.success) {
        setStep("2fa");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("studioos_superadmin_session", data.session_token);
        router.push("/super-admin");
      } else {
        setError(data.error || "Verification failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-[#0A0A0A] border-[#AA0608]/20 shadow-2xl">
        <CardHeader className="space-y-3 pb-4 text-center">
          <div className="mx-auto w-14 h-14 bg-[#AA0608]/10 rounded-full flex items-center justify-center mb-2">
            <Shield className="w-7 h-7 text-[#AA0608]" />
          </div>
          <CardTitle className="text-xl font-bold text-white">
            Super Admin Access
          </CardTitle>
          <p className="text-gray-500 text-sm">
            {step === "credentials"
              ? "Enter your credentials"
              : "Enter the 2FA code sent to your email"}
          </p>
        </CardHeader>

        <CardContent>
          {step === "credentials" ? (
            <form onSubmit={handleCredentials} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="sa-email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="sa-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#AA0608]/50"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sa-password" className="text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="sa-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#AA0608]/50"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#AA0608] hover:bg-[#8a0506] text-white h-11 text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-[#AA0608]/5 border border-[#AA0608]/20 rounded-lg mb-2">
                <KeyRound className="w-4 h-4 text-[#AA0608] shrink-0" />
                <p className="text-sm text-gray-300">
                  A 6-digit code was sent to your email
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sa-code" className="text-gray-300">
                  Verification Code
                </Label>
                <Input
                  id="sa-code"
                  type="text"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                  maxLength={6}
                  className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-gray-600 focus:border-[#AA0608]/50"
                  placeholder="000000"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#AA0608] hover:bg-[#8a0506] text-white h-11 text-base font-semibold"
                disabled={loading || code.length !== 6}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  "Verify & Login"
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                  setCode("");
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-300 mt-2"
              >
                &larr; Back to credentials
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
