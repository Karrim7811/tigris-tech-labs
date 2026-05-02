import Link from "next/link";
import { Building2, Users, BarChart3, Settings as SettingsIcon } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

/**
 * Brokerage admin dashboard — visible to workspace.role = 'admin' on Team / Brokerage plans.
 * Aggregates per-agent KPIs from brokerage_kpi_snapshots.
 */
export default async function AdminPage() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: ws } = await sb.from("workspaces").select("id, name").eq("owner_user_id", user?.id || "").maybeSingle();

  // Latest snapshot per agent
  const { data: snapshots } = await sb
    .from("brokerage_kpi_snapshots")
    .select("*, agents(full_name, headshot_url, title)")
    .eq("workspace_id", ws?.id || "")
    .order("snapshot_date", { ascending: false })
    .limit(50);

  // Aggregate KPIs across the workspace
  const totals = (snapshots || []).reduce(
    (acc, s) => ({
      active_listings: acc.active_listings + (s.active_listings || 0),
      active_buyers: acc.active_buyers + (s.active_buyers || 0),
      pipeline_total: acc.pipeline_total + Number(s.pipeline_total || 0),
      sofia_calls: acc.sofia_calls + (s.sofia_calls || 0),
      vesper_published: acc.vesper_published + (s.vesper_published || 0),
      grid_blazing: acc.grid_blazing + (s.grid_signals_blazing || 0),
    }),
    { active_listings: 0, active_buyers: 0, pipeline_total: 0, sofia_calls: 0, vesper_published: 0, grid_blazing: 0 }
  );

  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Brokerage Admin</p>
        <h1 className="serif-display text-ink text-5xl">{ws?.name || "Workspace"}.</h1>
        <p className="serif-italic text-stone text-base mt-2">Cross-agent reporting, member management, white-label settings.</p>
      </header>

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-6 gap-px bg-mist border border-mist mb-10">
        {[
          { label: "Active listings", value: String(totals.active_listings) },
          { label: "Active buyers", value: String(totals.active_buyers) },
          { label: "Pipeline", value: formatCurrency(totals.pipeline_total, { compact: true }) },
          { label: "Sofia calls / mo", value: String(totals.sofia_calls) },
          { label: "Vesper published", value: String(totals.vesper_published) },
          { label: "Grid blazing", value: String(totals.grid_blazing) },
        ].map((k) => (
          <div key={k.label} className="bg-parchment p-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-stone mb-2">{k.label}</p>
            <p className="serif-display text-ink text-3xl">{k.value}</p>
          </div>
        ))}
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { href: "/admin/members", label: "Members", desc: "Manage agents and roles", icon: Users },
          { href: "/admin/branding", label: "Branding", desc: "White-label settings", icon: Building2 },
          { href: "/admin/reporting", label: "Reporting", desc: "Cross-agent KPIs over time", icon: BarChart3 },
          { href: "/admin/compliance", label: "Compliance", desc: "Audit logs and policies", icon: SettingsIcon },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="border border-mist bg-parchment p-6 hover:border-indigo transition-colors block">
            <l.icon className="w-5 h-5 text-indigo mb-3" strokeWidth={1.5} />
            <p className="serif-display text-ink text-xl mb-1">{l.label}</p>
            <p className="text-xs text-stone">{l.desc}</p>
          </Link>
        ))}
      </section>

      {/* Per-agent ranking */}
      <section>
        <p className="eyebrow !text-brass mb-4">Per-agent · last 30 days</p>
        <div className="border border-mist bg-parchment">
          <div className="grid grid-cols-[2fr_120px_120px_140px_120px] gap-4 px-5 py-3 border-b border-mist text-[10px] uppercase tracking-[0.22em] text-stone bg-bone">
            <div>Agent</div>
            <div className="text-right">Listings</div>
            <div className="text-right">Pipeline</div>
            <div className="text-right">Sofia calls</div>
            <div className="text-right">YTD closed</div>
          </div>
          {(snapshots || []).slice(0, 10).map((s: any) => (
            <div key={s.id} className="grid grid-cols-[2fr_120px_120px_140px_120px] gap-4 px-5 py-4 items-center border-b border-mist last:border-b-0">
              <p className="text-sm text-ink font-medium">{s.agents?.full_name || "—"}</p>
              <p className="text-sm text-ink text-right">{s.active_listings ?? 0}</p>
              <p className="text-sm text-ink text-right">{formatCurrency(Number(s.pipeline_total) || 0, { compact: true })}</p>
              <p className="text-sm text-ink text-right">{s.sofia_calls ?? 0}</p>
              <p className="text-sm text-ink text-right">{formatCurrency(Number(s.closed_ytd) || 0, { compact: true })}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
