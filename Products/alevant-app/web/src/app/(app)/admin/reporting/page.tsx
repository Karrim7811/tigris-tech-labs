import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export default async function AdminReportingPage() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: ws } = await sb.from("workspaces").select("id").eq("owner_user_id", user?.id || "").maybeSingle();

  const { data: snaps } = await sb
    .from("brokerage_kpi_snapshots")
    .select("*")
    .eq("workspace_id", ws?.id || "")
    .order("snapshot_date", { ascending: false })
    .limit(120);

  // Aggregate by snapshot_date for the trend chart (text-render only)
  const byDate: Record<string, { listings: number; pipeline: number; calls: number }> = {};
  for (const s of snaps || []) {
    const d = s.snapshot_date;
    if (!byDate[d]) byDate[d] = { listings: 0, pipeline: 0, calls: 0 };
    byDate[d].listings += s.active_listings || 0;
    byDate[d].pipeline += Number(s.pipeline_total) || 0;
    byDate[d].calls += s.sofia_calls || 0;
  }
  const dates = Object.keys(byDate).sort().slice(-30);

  return (
    <div className="px-10 py-12 max-w-7xl">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-stone hover:text-indigo mb-6">
        <ArrowLeft className="w-3 h-3" /> Admin
      </Link>
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Reporting</p>
        <h1 className="serif-display text-ink text-5xl">Trends across the team.</h1>
        <p className="serif-italic text-stone text-base mt-2">Last 30 days · daily snapshots.</p>
      </header>

      <section className="border border-mist bg-parchment">
        <div className="grid grid-cols-[140px_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-mist bg-bone text-[10px] uppercase tracking-[0.22em] text-stone">
          <div>Date</div>
          <div className="text-right">Active listings</div>
          <div className="text-right">Pipeline</div>
          <div className="text-right">Sofia calls</div>
        </div>
        {dates.map((d) => (
          <div key={d} className="grid grid-cols-[140px_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-mist last:border-b-0">
            <p className="text-xs text-stone">{d}</p>
            <p className="text-sm text-ink text-right">{byDate[d].listings}</p>
            <p className="text-sm text-ink text-right">{formatCurrency(byDate[d].pipeline, { compact: true })}</p>
            <p className="text-sm text-ink text-right">{byDate[d].calls}</p>
          </div>
        ))}
        {!dates.length && (
          <p className="px-5 py-12 text-center text-sm text-stone">
            Snapshots populate after the first cron run. Comes online once your team has been active for 24 hours.
          </p>
        )}
      </section>
    </div>
  );
}
