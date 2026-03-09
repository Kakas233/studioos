import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { STRIPE_PRICES } from "@/lib/pricing";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

export async function POST(request: NextRequest) {
  try {
    const { planId, billingCycle } = await request.json();
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
      return NextResponse.json({ error: "Only admins can manage billing" }, { status: 403 });
    }

    const { data: studio } = await supabase
      .from("studios")
      .select("stripe_customer_id, name")
      .eq("id", account.studio_id)
      .single();

    if (!studio) return NextResponse.json({ error: "Studio not found" }, { status: 404 });

    const priceId = STRIPE_PRICES[planId]?.[billingCycle];
    if (!priceId) return NextResponse.json({ error: "Invalid plan or billing cycle" }, { status: 400 });

    // Get or create Stripe customer
    const stripe = getStripe();
    let customerId = studio.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { studio_id: account.studio_id },
        name: studio.name,
      });
      customerId = customer.id;

      await supabase
        .from("studios")
        .update({ stripe_customer_id: customerId })
        .eq("id", account.studio_id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?cancelled=true`,
      metadata: {
        studio_id: account.studio_id,
        plan_id: planId,
        billing_cycle: billingCycle,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
