"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "already_verified" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const token = searchParams.get("token");

      // If there is a Supabase token_hash, use verifyOtp
      if (tokenHash && type) {
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "signup" | "email",
          });

          if (error) {
            if (error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("confirmed")) {
              setStatus("already_verified");
            } else {
              setStatus("error");
              setErrorMessage(error.message || "Verification failed.");
            }
          } else {
            setStatus("success");
          }
        } catch {
          setStatus("error");
          setErrorMessage("Something went wrong. Please try again.");
        }
        return;
      }

      // Legacy token-based verification fallback
      if (token) {
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: "signup",
          });

          if (error) {
            if (error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("confirmed")) {
              setStatus("already_verified");
            } else {
              setStatus("error");
              setErrorMessage(error.message || "Verification failed.");
            }
          } else {
            setStatus("success");
          }
        } catch {
          setStatus("error");
          setErrorMessage("Something went wrong. Please try again.");
        }
        return;
      }

      // No token found
      setStatus("error");
      setErrorMessage("No verification token found.");
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-[#0A0A0A] border-[#C9A84C]/10 shadow-2xl">
        <CardHeader className="text-center pb-4">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="w-12 h-12 text-[#C9A84C] animate-spin" />
              </div>
              <CardTitle className="text-xl text-white">Verifying your email...</CardTitle>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-[#C9A84C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#C9A84C]" />
              </div>
              <CardTitle className="text-xl text-white">Email Verified!</CardTitle>
            </>
          )}

          {status === "already_verified" && (
            <>
              <div className="w-16 h-16 bg-[#C9A84C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#C9A84C]" />
              </div>
              <CardTitle className="text-xl text-white">Already Verified</CardTitle>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <CardTitle className="text-xl text-white">Verification Failed</CardTitle>
            </>
          )}
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {status === "success" && (
            <>
              <p className="text-gray-400">Your studio is now active. You can sign in to your dashboard.</p>
              <Link href="/sign-in">
                <Button
                  className="w-full bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] hover:from-[#B8973B] hover:to-[#D4C07A] text-black font-semibold"
                >
                  Go to Sign In
                </Button>
              </Link>
            </>
          )}

          {status === "already_verified" && (
            <>
              <p className="text-gray-400">Your email has already been verified. You can sign in.</p>
              <Link href="/sign-in">
                <Button
                  className="w-full bg-gradient-to-r from-[#C9A84C] to-[#E8D48B] hover:from-[#B8973B] hover:to-[#D4C07A] text-black font-semibold"
                >
                  Go to Sign In
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <p className="text-red-400">{errorMessage}</p>
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full border-white/10 text-gray-300 hover:bg-white/5"
                >
                  Back to Home
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
