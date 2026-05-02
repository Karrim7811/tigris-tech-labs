import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import { verifyWebhook } from "@/lib/stripe";

export const config = { api: { bodyParser: false } };

/**
 * Stripe webhook handler.
 * Events: customer.subscription.created/updated/deleted, invoice.paid, invoice.payment_failed
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event;
  try {
    event = verifyWebhook(raw, sig);
  } catch (e) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const svc = getSupabaseService();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub: any = event.data.object;
      const workspaceId = sub.metadata?.workspace_id;
      if (!workspaceId) break;
      const item = sub.items.data[0];
      await svc.from("billing_customers").upsert(
        {
          workspace_id: workspaceId,
          stripe_customer_id: sub.customer,
          stripe_subscription_id: sub.id,
          plan_id: planFromPriceId(item?.price?.id),
          status: sub.status,
          trial_end_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id" }
      );
      break;
    }
    case "customer.subscription.deleted": {
      const sub: any = event.data.object;
      await svc
        .from("billing_customers")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
    case "invoice.payment_failed": {
      const inv: any = event.data.object;
      await svc
        .from("billing_customers")
        .update({ status: "past_due" })
        .eq("stripe_customer_id", inv.customer);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function planFromPriceId(priceId: string | undefined): string | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_AGENT_MONTH || priceId === process.env.STRIPE_PRICE_AGENT_YEAR) return "agent";
  if (priceId === process.env.STRIPE_PRICE_TEAM_MONTH || priceId === process.env.STRIPE_PRICE_TEAM_YEAR) return "team";
  if (priceId === process.env.STRIPE_PRICE_BROKERAGE_MONTH || priceId === process.env.STRIPE_PRICE_BROKERAGE_YEAR) return "brokerage";
  return null;
}
