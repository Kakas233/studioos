"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tierParam = searchParams.get("tier");
  const selectedTier = tierParam || "starter";

  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // If no tier selected, redirect to pricing page to pick a plan
  useEffect(() => {
    if (!tierParam) {
      router.replace("/pricing");
    }
  }, [tierParam, router]);
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    password: "",
    studioName: "",
  });

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.email || !formData.password || !formData.studioName) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!agreedToTerms) {
      toast.error("You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          ownerName: formData.firstName,
          studioName: formData.studioName,
          subdomain: generateSubdomain(formData.studioName),
          tier: selectedTier,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Signup failed");
        return;
      }

      setEmailSent(true);
    } catch {
      toast.error("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[#0A0A0A] border-[#C9A84C]/10 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-[#C9A84C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#C9A84C]" />
            </div>
            <CardTitle className="text-xl text-white">Check Your Email!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-400">
              We&apos;ve sent a verification link to <strong className="text-[#C9A84C]">{formData.email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Click the link to verify your account and activate your studio. The link expires in 24 hours.
            </p>
            <p className="text-xs text-gray-600">
              Didn&apos;t receive it? Check your spam folder.
            </p>
            <div className="pt-2">
              <Link href="/sign-in">
                <Button variant="outline" className="w-full border-[#C9A84C]/20 text-[#C9A84C] hover:bg-[#C9A84C]/10">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-[#0A0A0A] border-[#C9A84C]/10 shadow-2xl">
        <CardHeader className="space-y-3 pb-4 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] bg-clip-text text-transparent mb-1">
            StudioOS
          </div>
          <CardTitle className="text-xl font-bold text-white">Create Your Studio</CardTitle>
          <p className="text-gray-500 text-sm">Start your 7-day free trial · No credit card required</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-300">Your Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#C9A84C]/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#C9A84C]/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#C9A84C]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studioName" className="text-gray-300">Studio Name</Label>
              <Input
                id="studioName"
                placeholder="My Studio"
                value={formData.studioName}
                onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#C9A84C]/50"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-[#C9A84C]"
              />
              <span className="text-xs text-gray-400 leading-relaxed">
                I agree to the{" "}
                <Link href="/legal/terms" target="_blank" className="text-[#C9A84C] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/legal/privacy" target="_blank" className="text-[#C9A84C] hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] hover:from-[#B8973B] hover:to-[#D4C07A] text-black h-11 text-base font-semibold"
              disabled={loading || !agreedToTerms}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </div>
              ) : (
                "Start Free Trial"
              )}
            </Button>

            <p className="text-xs text-center text-gray-500">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-[#C9A84C] hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
