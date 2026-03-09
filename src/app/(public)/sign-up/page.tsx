"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier");

  const [formData, setFormData] = useState({
    studioName: "",
    ownerName: "",
    email: "",
    password: "",
    subdomain: "",
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
  };

  const handleStudioNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      studioName: value,
      subdomain: prev.subdomain || generateSubdomain(value),
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      toast.error("Please agree to the Terms of Service");
      return;
    }

    if (!Object.values(passwordChecks).every(Boolean)) {
      toast.error("Password does not meet requirements");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tier: tier || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Sign up failed");
        return;
      }

      setSuccess(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-border/50 bg-card text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <h2 className="mb-2 text-xl font-semibold">Check your email</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              We sent a verification link to <strong>{formData.email}</strong>.
              Click the link to activate your account.
            </p>
            <Button onClick={() => router.push("/sign-in")} variant="outline">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md border-border/50 bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-3xl font-bold text-primary">
            StudioOS
          </div>
          <CardTitle className="text-xl">Create your account</CardTitle>
          {tier && (
            <p className="text-sm text-muted-foreground">
              Starting with the{" "}
              <span className="font-medium capitalize text-primary">{tier}</span>{" "}
              plan
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studioName">Studio Name</Label>
              <Input
                id="studioName"
                placeholder="My Studio"
                value={formData.studioName}
                onChange={(e) => handleStudioNameChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="flex items-center">
                <Input
                  id="subdomain"
                  placeholder="my-studio"
                  value={formData.subdomain}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    }))
                  }
                  required
                  className="rounded-r-none"
                />
                <span className="flex h-9 items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  .getstudioos.com
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName">Your Full Name</Label>
              <Input
                id="ownerName"
                placeholder="John Smith"
                value={formData.ownerName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ownerName: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signupEmail">Email</Label>
              <Input
                id="signupEmail"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signupPassword">Password</Label>
              <div className="relative">
                <Input
                  id="signupPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 space-y-1 text-xs">
                  {[
                    { check: passwordChecks.length, label: "At least 8 characters" },
                    { check: passwordChecks.uppercase, label: "One uppercase letter" },
                    { check: passwordChecks.number, label: "One number" },
                    { check: passwordChecks.special, label: "One special character" },
                  ].map(({ check, label }) => (
                    <div
                      key={label}
                      className={check ? "text-green-500" : "text-muted-foreground"}
                    >
                      {check ? "✓" : "○"} {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    agreeToTerms: checked === true,
                  }))
                }
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground">
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
