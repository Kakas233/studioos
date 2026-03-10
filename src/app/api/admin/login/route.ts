import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";
import { sendAdmin2FAEmail } from "@/lib/email";
import crypto from "crypto";

// Simple in-memory rate limiter
const loginAttempts = new Map<string, number[]>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) return true;
  const recent = entry.filter((t) => now - t < WINDOW_MS);
  loginAttempts.set(ip, recent);
  return recent.length < MAX_ATTEMPTS;
}

function recordAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || [];
  entry.push(now);
  loginAttempts.set(ip, entry);
}

function generateCode(): string {
  const bytes = crypto.randomBytes(4);
  return String(100000 + (bytes.readUInt32BE(0) % 900000));
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many login attempts. Please try again in 15 minutes.",
        },
        { status: 429 }
      );
    }

    const { email, password, step } = await request.json();
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

    if (step === "login") {
      if (!email || !password) {
        return NextResponse.json({
          success: false,
          error: "Email and password are required",
        });
      }

      if (
        !SUPER_ADMIN_EMAIL ||
        email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()
      ) {
        recordAttempt(ip);
        return NextResponse.json({
          success: false,
          error: "Invalid credentials",
        });
      }

      const adminClient = createAdminClient();

      const { data: accounts } = await adminClient
        .from("accounts")
        .select("id, email, password_hash, is_super_admin")
        .eq("email", SUPER_ADMIN_EMAIL.toLowerCase())
        .limit(1);

      if (!accounts || accounts.length === 0) {
        recordAttempt(ip);
        return NextResponse.json({
          success: false,
          error: "Super admin account not found",
        });
      }

      const account = accounts[0] as any;

      if (!account.is_super_admin) {
        recordAttempt(ip);
        return NextResponse.json({
          success: false,
          error: "Invalid credentials",
        });
      }

      const passwordMatch = await bcrypt.compare(
        password,
        account.password_hash
      );
      if (!passwordMatch) {
        recordAttempt(ip);
        return NextResponse.json({
          success: false,
          error: "Invalid credentials",
        });
      }

      // Generate 2FA code
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await (adminClient.from("email_verifications") as any).insert({
        email: SUPER_ADMIN_EMAIL.toLowerCase(),
        token: code,
        studio_id: "super_admin_2fa",
        verified: false,
        expires_at: expiresAt,
      });

      // Send styled 2FA email
      await sendAdmin2FAEmail(SUPER_ADMIN_EMAIL, code);

      console.log("Super admin 2FA code sent");
      return NextResponse.json({
        success: true,
        message: "2FA code sent to your email",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid step" });
  } catch (error) {
    console.error("Super admin login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
