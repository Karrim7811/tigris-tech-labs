import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { formatNumber, formatPct } from "@/lib/utils";
import { summarizeGridSignals } from "@/lib/market-intel";
import { MarketInsightsLeadButton } from "@/components/alevant/MarketInsightsLeadButton";

export default async function MarketInsightsPage() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const svc = getSupabaseService();
  const { data: ws } = await svc.from("workspaces").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!ws) redirect("/login");

  const { data: signals } = await svc
    .from("grid_signals")
    .select(
      "id, property_address, property_city, property_state, property_zip, county, property_neighborhood, motivation_score, estimated_value, estimated_equity, years_owned, reasons_summary"
    )
    .eq("workspace_id", ws.id)
    .order("motivation_score", { ascending: false })
    .limit(500);

  const rows = signals ?? [];
  const overview = summarizeGridSignals(rows);

  return (
    <div className="px-10 py-12 max-w-[1600px]">
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Market Intelligence</p>
        <h1 className="serif-display text-ink text-5xl mb-3">Florida market pulse.</h1>
        <p className="serif-italic text-stone text-base max-w-3xl">
          Analyze neighborhood momentum across Key West to West Palm Beach. Compare city, county, ZIP, state, and neighborhood performance, then create seller leads from the strongest market signals.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6 mb-10">
        <div className="space-y-4">
          <div className="border border-mist bg-parchment p-6">
            <p className="eyebrow !text-brass mb-3">Command center</p>
            <p className="text-sm text-stone leading-relaxed mb-4">
              Use open county appraiser and MLS signals to spot where neighborhoods are selling faster, where pricing is outperforming, and which seller pools should be surfaced for outreach.
            </p>
            <MarketInsightsLeadButton autoCreate label="Auto-create top 5 market-qualified leads" />
          </div>
          <div className="border border-mist bg-parchment p-6">
            <p className="eyebrow !text-brass mb-3">Support</p>
            <p className="text-sm text-smoke leading-relaxed mb-2">Need a county feed? The feature is designed to accept both appraiser public records and MLS feeds.</p>
            <Link href="/mls" className="btn-base w-full bg-bone text-ink border border-mist hover:bg-mist text-center">
              Connect MLS data
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Signals", value: formatNumber(overview.total_signals), detail: "Properties scored" },
            { label: "Avg. motivation", value: `${overview.average_motivation}/100`, detail: "Composite seller likelihood" },
            { label: "Blazing", value: formatNumber(overview.blazing), detail: ">= 80 motivation" },
            { label: "Hot", value: formatNumber(overview.hot), detail: "65–79 motivation" },
          ].map((card) => (
            <div key={card.label} className="border border-mist bg-parchment p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-stone mb-2">{card.label}</p>
              <p className="serif-display text-4xl text-ink mb-2">{card.value}</p>
              <p className="text-sm text-stone leading-relaxed">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {rows.length === 0 ? (
        <section className="border border-mist bg-bone/50 p-10 rounded-lg">
          <p className="text-lg text-ink mb-4">No market signals available yet.</p>
          <p className="text-sm text-stone leading-relaxed mb-4">
            Run the Grid scanner on targeted appraiser addresses, or connect MLS so the dashboard can build city, county, ZIP, and neighborhood intelligence.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/grid" className="btn-base bg-indigo text-parchment hover:bg-indigo-deep">
              Open The Grid
            </Link>
            <Link href="/mls" className="btn-base bg-bone text-ink border border-mist hover:bg-mist">
              Connect MLS feeds
            </Link>
          </div>
        </section>
      ) : (
        <section className="space-y-10">
          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
            <div className="border border-mist bg-parchment p-6">
              <p className="eyebrow !text-brass mb-4">Top neighborhoods</p>
              <div className="space-y-4">
                {overview.top_neighborhoods.slice(0, 5).map((group) => (
                  <div key={`${group.level}-${group.key}`} className="border border-mist bg-bone p-4 rounded-xl">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-ink text-xl font-medium">{group.key}</p>
                        <p className="text-sm text-stone">{group.count} signals · {group.hot_share}% hot · {formatPct(group.avg_motivation)}</p>
                      </div>
                      <p className="text-2xl serif-display text-indigo">{group.avg_motivation}</p>
                    </div>
                    <p className="text-sm text-smoke leading-relaxed mb-4">
                      Top signal: {group.top_signal?.address} · {group.top_signal?.motivation_score}/100
                    </p>
                    {group.top_signal?.id ? <MarketInsightsLeadButton signalId={group.top_signal.id} label="Create lead from top signal" /> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="border border-mist bg-parchment p-6">
                <p className="eyebrow !text-brass mb-4">Top cities</p>
                <div className="space-y-3">
                  {overview.top_cities.slice(0, 5).map((group) => (
                    <div key={group.key} className="flex items-center justify-between gap-4 text-sm text-ink">
                      <div>
                        <p className="font-medium">{group.key}</p>
                        <p className="text-xs text-stone">{group.count} signals</p>
                      </div>
                      <div className="text-right">
                        <p>{group.avg_motivation}/100</p>
                        <p className="text-xs text-stone">{group.hot_share}% hot</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-mist bg-parchment p-6">
                <p className="eyebrow !text-brass mb-4">Top counties</p>
                <div className="space-y-3">
                  {overview.top_counties.slice(0, 5).map((group) => (
                    <div key={group.key} className="flex items-center justify-between gap-4 text-sm text-ink">
                      <div>
                        <p className="font-medium">{group.key}</p>
                        <p className="text-xs text-stone">{group.count} signals</p>
                      </div>
                      <div className="text-right">
                        <p>{group.avg_motivation}/100</p>
                        <p className="text-xs text-stone">{group.hot_share}% hot</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border border-mist bg-parchment p-6">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div>
                <p className="eyebrow !text-brass mb-2">Top ZIPs</p>
                <p className="text-sm text-stone leading-relaxed">High-demand ZIPs in the current scan window.</p>
              </div>
              <Link href="/grid" className="btn-base bg-bone text-ink border border-mist hover:bg-mist">
                Review grid signals
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.top_zips.slice(0, 6).map((group) => (
                <div key={group.key} className="border border-mist bg-bone p-4 rounded-xl">
                  <p className="font-medium text-ink">{group.key}</p>
                  <p className="text-xs text-stone mb-2">{group.count} signals</p>
                  <p className="text-sm text-ink">{group.avg_motivation}/100 average</p>
                  <p className="text-xs text-stone">{group.hot_share}% hot</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="text-xs text-stone mt-12 leading-relaxed max-w-3xl">
        <p>Market intelligence combines county appraiser open data and MLS feeds to surface the strongest seller signals across cities, counties, ZIP codes, states, and neighborhoods.</p>
        <p className="mt-2">The auto-create path can turn those signals into CRM leads. Manual review lets you approve individual homes before outreach.</p>
      </section>
    </div>
  );
}
