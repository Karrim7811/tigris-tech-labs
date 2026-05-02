import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function BillingPage() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: ws } = await sb.from("workspaces").select("id").eq("owner_user_id", user?.id || "").maybeSingle();
  const { data: bc } = await sb.from("billing_customers").select("*, plans(name)").eq("workspace_id", ws?.id || "").maybeSingle();
  const { data: plans } = await sb.from("plans").select("*").eq("active", true).order("display_order");

  return (
    <div className="px-10 py-12 max-w-5xl">
      <Link href="/settings" className="text-xs uppercase tracking-[0.22em] text-stone hover:text-indigo">← Settings</Link>
      <header className="mt-4 mb-10">
        <p className="eyebrow !text-indigo mb-2">Billing</p>
        <h1 className="serif-display text-ink text-5xl">Plan & usage.</h1>
      </header>

      {bc && (
        <section className="border border-mist bg-bone p-8 mb-10">
          <p className="eyebrow !text-brass mb-3">Current plan</p>
          <div className="flex items-baseline gap-4 mb-2">
            <span className="serif-display text-ink text-3xl">{(bc as any).plans?.name || bc.plan_id || "Pilot"}</span>
            <Badge tone={bc.status === "active" ? "success" : bc.status === "trialing" ? "indigo" : "warm"}>{bc.status}</Badge>
          </div>
          {bc.trial_end_at && <p className="text-sm text-stone">Trial ends {new Date(bc.trial_end_at).toLocaleDateString()}</p>}
          {bc.current_period_end && <p className="text-sm text-stone">Renews {new Date(bc.current_period_end).toLocaleDateString()}</p>}
          <form action="/api/billing/portal" method="POST" className="mt-6">
            <Button type="submit" variant="ghost">Manage in Stripe Portal</Button>
          </form>
        </section>
      )}

      <section>
        <p className="eyebrow !text-brass mb-4">Plans</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-mist border border-mist">
          {(plans || []).map((p: any) => (
            <div key={p.id} className="bg-parchment p-6">
              <p className="serif-display text-ink text-2xl mb-1">{p.name}</p>
              <p className="serif-display text-ink text-3xl mb-2">
                {p.monthly_cents === 0 ? "Free" : `$${(p.monthly_cents / 100).toLocaleString()}`}
                {p.monthly_cents > 0 && <span className="text-sm text-stone"> / mo</span>}
              </p>
              <p className="text-xs text-stone mb-4">{p.agent_seats} {p.agent_seats === 1 ? "agent" : "agents"} included</p>
              <form action="/api/billing/checkout" method="POST">
                <input type="hidden" name="plan_id" value={p.id} />
                <input type="hidden" name="billing" value="month" />
                <Button type="submit" size="sm" variant={bc?.plan_id === p.id ? "subtle" : "primary"} className="w-full" disabled={bc?.plan_id === p.id || p.id === "pilot"}>
                  {bc?.plan_id === p.id ? "Current plan" : p.id === "pilot" ? "—" : "Subscribe"}
                </Button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
