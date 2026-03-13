import { NextResponse } from "next/server";

const BLOCKED_STATUSES = ["suspended", "cancelled"];

/**
 * Check if a studio's subscription status blocks write operations.
 * Returns a NextResponse error if blocked, or null if allowed.
 */
export function checkSubscriptionBlocked(
  subscriptionStatus: string | null | undefined
): NextResponse | null {
  if (subscriptionStatus && BLOCKED_STATUSES.includes(subscriptionStatus)) {
    return NextResponse.json(
      { error: "Your subscription is not active. Please renew to continue." },
      { status: 403 }
    );
  }
  return null;
}
