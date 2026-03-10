import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface AuthResult {
  user: { id: string; email?: string };
  account: { id: string; studio_id: string; role: string };
  studio: { id: string; subscription_status: string; subscription_tier: string };
}

/**
 * Authenticate a request, verify account, and check subscription status.
 * Returns the user, account, and studio if valid.
 * Returns a NextResponse error if any check fails.
 */
export async function authenticateRequest(options?: {
  requiredRoles?: string[];
  allowSuspended?: boolean;
}): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: account } = await supabase
    .from("accounts")
    .select("id, studio_id, role")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 403 });
  }

  if (options?.requiredRoles && !options.requiredRoles.includes(account.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: studio } = await supabase
    .from("studios")
    .select("id, subscription_status, subscription_tier")
    .eq("id", account.studio_id)
    .single();

  if (!studio) {
    return NextResponse.json({ error: "Studio not found" }, { status: 404 });
  }

  // Block suspended/cancelled studios from write operations (unless explicitly allowed)
  if (!options?.allowSuspended) {
    if (studio.subscription_status === "suspended" || studio.subscription_status === "cancelled") {
      return NextResponse.json(
        { error: "Your subscription is not active. Please renew to continue." },
        { status: 403 }
      );
    }
  }

  return { user, account, studio };
}

/** Type guard: checks if the result is an error response */
export function isErrorResponse(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
