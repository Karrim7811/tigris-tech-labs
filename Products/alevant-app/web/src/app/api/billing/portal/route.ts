import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { createPortalSession } from "@/lib/stripe";

export async function POST() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getSupabaseService();
  const { data: ws } = await svc.from("workspaces").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const { data: bc } = await svc.from("billing_customers").select("stripe_customer_id").eq("workspace_id", ws.id).maybeSingle();
  if (!bc?.stripe_customer_id) return NextResponse.json({ error: "no Stripe customer on file" }, { status: 412 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://alevant.ai";
  const session = await createPortalSession({
    customerId: bc.stripe_customer_id,
    returnUrl: `${baseUrl}/settings/billing`,
  });
  return NextResponse.json({ url: session.url });
}
