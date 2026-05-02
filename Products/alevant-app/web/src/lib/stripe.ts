import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY missing");
    _stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion });
  }
  return _stripe;
}

export interface CreateCheckoutOptions {
  workspaceId: string;
  email: string;
  priceId: string;
  trialDays?: number;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(opts: CreateCheckoutOptions) {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: opts.email,
    line_items: [{ price: opts.priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    subscription_data: {
      trial_period_days: opts.trialDays,
      metadata: { workspace_id: opts.workspaceId },
    },
    metadata: { workspace_id: opts.workspaceId },
    allow_promotion_codes: true,
  });
}

export async function createPortalSession(opts: { customerId: string; returnUrl: string }) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: opts.customerId,
    return_url: opts.returnUrl,
  });
}

export function verifyWebhook(rawBody: string, signature: string): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET missing");
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
