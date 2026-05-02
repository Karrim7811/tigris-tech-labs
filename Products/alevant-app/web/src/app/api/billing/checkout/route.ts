import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe";

/**
 * POST /api/billing/checkout — start a Stripe Checkout session for the user's workspace.
 * Body: { plan_id: 'agent' | 'team' | 'brokerage', billing: 'month' | 'year' }
 */
export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { plan_id, billing } = await req.json();
  const svc = getSupabaseService();
  const { data: ws } = await svc.from("workspaces").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const { data: plan } = await svc.from("plans").select("*").eq("id", plan_id).maybeSingle();
  if (!plan) return NextResponse.json({ error: "unknown plan" }, { status: 400 });

  const priceId =
    billing === "year" ? plan.stripe_price_id_year : plan.stripe_price_id_month;
  if (!priceId) return NextResponse.json({ error: "stripe price not configured for plan" }, { status: 412 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://alevant.ai";
  const session = await createCheckoutSession({
    workspaceId: ws.id,
    email: user.email!,
    priceId,
    trialDays: plan_id === "pilot" ? 90 : 14,
    successUrl: `${baseUrl}/settings/billing?status=success`,
    cancelUrl: `${baseUrl}/settings/billing?status=canceled`,
  });

  return NextResponse.json({ url: session.url });
}
