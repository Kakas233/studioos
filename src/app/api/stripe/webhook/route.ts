import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { MODEL_LIMITS } from "@/lib/pricing";
import { sendPaymentFailedEmail } from "@/lib/email";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency: insert first, then check if we own the lock.
  // This closes the race window between check and insert.
  const idempotencyKey = `stripe_event_${event.id}`;
  const { data: inserted } = await admin.from("error_logs").insert({
    error_type: "stripe_webhook_processed",
    message: idempotencyKey,
    metadata: { event_type: event.type },
  }).select("id").single();

  if (!inserted) {
    // Insert failed (likely duplicate) — skip processing
    return NextResponse.json({ received: true, deduplicated: true });
  }

  // Double-check: if another request slipped through, only the first inserted row should process
  const { data: allEntries } = await admin
    .from("error_logs")
    .select("id")
    .eq("error_type", "stripe_webhook_processed")
    .eq("message", idempotencyKey)
    .order("created_at", { ascending: true })
    .limit(2);

  if (allEntries && allEntries.length > 1 && allEntries[0].id !== inserted.id) {
    // We lost the race — another row was inserted first
    return NextResponse.json({ received: true, deduplicated: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const studioId = session.metadata?.studio_id;
        const planId = session.metadata?.plan_id;

        if (studioId && planId) {
          await admin
            .from("studios")
            .update({
              subscription_tier: planId as "starter" | "pro" | "elite",
              subscription_status: "active",
              stripe_subscription_id: session.subscription as string,
              model_limit: MODEL_LIMITS[planId] || 1,
              last_payment_date: new Date().toISOString(),
            })
            .eq("id", studioId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const { data: studio } = await admin
          .from("studios")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (studio) {
          const statusMap: Record<string, string> = {
            active: "active",
            trialing: "trialing",
            past_due: "past_due",
            canceled: "cancelled",
            unpaid: "suspended",
          };

          const updateData: Record<string, unknown> = {
            subscription_status: (statusMap[subscription.status] || "active") as import("@/lib/supabase/types").SubscriptionStatus,
          };

          // Track payment dates from subscription billing cycle
          const subAny = subscription as unknown as Record<string, unknown>;
          if (subAny.current_period_end) {
            updateData.next_payment_date = new Date((subAny.current_period_end as number) * 1000).toISOString();
          }
          if (subAny.current_period_start) {
            updateData.last_payment_date = new Date((subAny.current_period_start as number) * 1000).toISOString();
          }

          await admin
            .from("studios")
            .update(updateData)
            .eq("id", studio.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const { data: studio } = await admin
          .from("studios")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (studio) {
          // Set grace period (5 days)
          const gracePeriodEnds = new Date();
          gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 5);

          await admin
            .from("studios")
            .update({
              subscription_status: "cancelled",
              grace_period_ends_at: gracePeriodEnds.toISOString(),
            })
            .eq("id", studio.id);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const paidInvoice = event.data.object as Stripe.Invoice;
        const paidSubId = (paidInvoice as unknown as { subscription?: string | { id: string } }).subscription
          ?? paidInvoice.parent?.subscription_details?.subscription;
        if (paidSubId) {
          const paidSubIdStr = typeof paidSubId === "string" ? paidSubId : paidSubId.id;
          const { data: paidStudio } = await admin
            .from("studios")
            .select("id")
            .eq("stripe_subscription_id", paidSubIdStr)
            .single();

          if (paidStudio) {
            await admin
              .from("studios")
              .update({
                last_payment_date: new Date().toISOString(),
                subscription_status: "active",
                grace_period_ends_at: null,
              })
              .eq("id", paidStudio.id);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as unknown as { subscription?: string | { id: string } }).subscription
          ?? invoice.parent?.subscription_details?.subscription;
        if (subscriptionId) {
          const subIdStr = typeof subscriptionId === "string" ? subscriptionId : subscriptionId.id;
          const { data: studio } = await admin
            .from("studios")
            .select("id, name, grace_period_ends_at")
            .eq("stripe_subscription_id", subIdStr)
            .single();

          if (studio) {
            // Set grace period (5 days) and mark as past_due
            const gracePeriodEnds = new Date();
            gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 5);

            await admin
              .from("studios")
              .update({
                subscription_status: "past_due",
                grace_period_ends_at: gracePeriodEnds.toISOString(),
              })
              .eq("id", studio.id);

            // Send payment failed email to owner
            try {
              const { data: owners } = await admin
                .from("accounts")
                .select("email")
                .eq("studio_id", studio.id)
                .eq("role", "owner")
                .eq("is_active", true)
                .limit(1);

              if (owners?.[0]?.email) {
                await sendPaymentFailedEmail(
                  owners[0].email,
                  studio.name || "Your Studio",
                  5
                );
              }
            } catch (emailErr) {
              console.error("Payment failed email error:", emailErr);
            }
          }
        }
        break;
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Log to error_logs
    await admin.from("error_logs").insert({
      error_type: "stripe_webhook",
      message: `Failed to process ${event.type}: ${error instanceof Error ? error.message : "Unknown error"}`,
      metadata: { event_type: event.type, event_id: event.id },
    });
  }

  return NextResponse.json({ received: true });
}
