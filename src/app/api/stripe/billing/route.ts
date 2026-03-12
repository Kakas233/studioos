import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

/** GET /api/stripe/billing — Fetch billing data for the studio */
export async function GET() {
  try {
    const stripe = getStripe();
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
      .select("id, stripe_customer_id, stripe_subscription_id, subscription_tier, subscription_status, model_limit, grace_period_ends_at")
      .eq("id", account.studio_id)
      .single();

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 });
    }

    // Count active models
    const { count: currentModelCount } = await supabase
      .from("accounts")
      .select("id", { count: "exact", head: true })
      .eq("studio_id", account.studio_id)
      .eq("role", "model")
      .eq("is_active", true);

    const billing: Record<string, unknown> = {
      plan: studio.subscription_tier || "free",
      status: studio.subscription_status || "trialing",
      model_limit: studio.model_limit || 1,
      current_model_count: currentModelCount || 0,
      grace_period_ends_at: studio.grace_period_ends_at || null,
      stripe_subscription_id: studio.stripe_subscription_id || null,
      subscription: null,
      invoices: [],
      payment_method: null,
    };

    // Fetch Stripe data if customer exists
    if (studio.stripe_customer_id) {
      try {
        if (studio.stripe_subscription_id) {
          const subscription = await stripe.subscriptions.retrieve(studio.stripe_subscription_id);
          // In newer Stripe API versions, period dates are on items, not the subscription
          const firstItem = subscription.items?.data?.[0];
          billing.subscription = {
            id: subscription.id,
            status: subscription.status,
            current_period_start: firstItem?.current_period_start ?? null,
            current_period_end: firstItem?.current_period_end ?? null,
            cancel_at_period_end: subscription.cancel_at_period_end,
          };
        }

        const invoices = await stripe.invoices.list({
          customer: studio.stripe_customer_id,
          limit: 5,
        });
        billing.invoices = invoices.data.map((inv) => ({
          id: inv.id,
          amount_paid: inv.amount_paid,
          currency: inv.currency,
          status: inv.status,
          created: inv.created,
          hosted_invoice_url: inv.hosted_invoice_url,
        }));

        const customer = await stripe.customers.retrieve(studio.stripe_customer_id) as Stripe.Customer;
        if (customer.invoice_settings?.default_payment_method) {
          const pm = await stripe.paymentMethods.retrieve(
            customer.invoice_settings.default_payment_method as string
          );
          if (pm.card) {
            billing.payment_method = {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
            };
          }
        }
      } catch (stripeErr) {
        console.error("Stripe data fetch error:", stripeErr);
      }
    }

    return NextResponse.json({ success: true, billing });
  } catch {
    return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 });
  }
}

/** POST /api/stripe/billing — Create Stripe Customer Portal session */
export async function POST() {
  try {
    const stripe = getStripe();
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
      .select("stripe_customer_id")
      .eq("id", account.studio_id)
      .single();

    if (!studio?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: studio.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
