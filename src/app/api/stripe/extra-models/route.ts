import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STRIPE_EXTRA_MODEL_PRICES } from "@/lib/pricing";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

/** POST /api/stripe/extra-models — Purchase extra model slots */
export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const { quantity } = await request.json();
    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: account } = await supabase
      .from("accounts")
      .select("studio_id, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!account || !["owner", "admin"].includes(account.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: studio } = await supabase
      .from("studios")
      .select("stripe_customer_id, subscription_tier, subscription_status, model_limit")
      .eq("id", account.studio_id)
      .single();

    if (!studio?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account. Subscribe to a plan first." }, { status: 400 });
    }

    // Block suspended studios
    if (studio.subscription_status === "suspended" || studio.subscription_status === "cancelled") {
      return NextResponse.json({ error: "Your subscription is not active. Please renew first." }, { status: 403 });
    }

    // Use tier-specific Stripe price ID
    const tier = studio.subscription_tier || "starter";
    const extraModelPriceId = STRIPE_EXTRA_MODEL_PRICES[tier] || process.env.STRIPE_EXTRA_MODEL_PRICE_ID;
    if (!extraModelPriceId) {
      return NextResponse.json({ error: "Extra model pricing not configured" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      customer: studio.stripe_customer_id,
      mode: "subscription",
      line_items: [{ price: extraModelPriceId, quantity }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?extra_models=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      metadata: {
        studio_id: account.studio_id,
        type: "extra_models",
        quantity: String(quantity),
        tier,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Extra models checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
