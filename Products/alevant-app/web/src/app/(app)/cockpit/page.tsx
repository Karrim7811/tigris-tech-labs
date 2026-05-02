import Link from "next/link";
import { Bell, Phone, Sparkles, Grid3x3, Newspaper, ExternalLink } from "lucide-react";
import { Card, CardEyebrow, CardTitle, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSupabaseServer } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/utils";

const NEWS_CATEGORY_LABEL: Record<string, string> = {
  market: "Market",
  listing: "Listing",
  farm_zone: "Farm Zone",
  sphere: "Sphere",
  competitor: "Competitor",
  regulatory: "Regulatory",
  mortgage_rates: "Rates",
  pre_construction: "Pre-Con",
};

export default async function CockpitPage() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: ws } = await sb.from("workspaces").select("id").eq("owner_user_id", user?.id || "").maybeSingle();
  const { data: news } = await sb
    .from("news_alerts")
    .select("id, title, summary, category, severity, source_url, source_name, surfaced_at, related_listing_id, listings:listings(address)")
    .eq("workspace_id", ws?.id || "")
    .is("dismissed_at", null)
    .order("surfaced_at", { ascending: false })
    .limit(5);
  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <p className="eyebrow !text-indigo mb-2">Cockpit</p>
          <h1 className="serif-display text-ink text-5xl">Good morning, Thomas.</h1>
          <p className="serif-italic text-stone text-lg mt-2">Tuesday, May 1 · Miami · 73°F · clear</p>
        </div>
        <button className="btn-base bg-ink text-parchment hover:bg-ink/90">
          <Bell className="w-4 h-4 mr-2" /> Play 90-second standup
        </button>
      </header>

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-px bg-mist border border-mist mb-10">
        {[
          { label: "Active listings", value: "7", trend: "+1" },
          { label: "Active buyers", value: "23", trend: "+3" },
          { label: "Hot leads", value: "5", trend: "+2" },
          { label: "Weighted pipeline", value: "$3.4M", trend: "+12%" },
          { label: "Grid signals (blazing)", value: "11", trend: "+4" },
        ].map((k) => (
          <div key={k.label} className="bg-parchment p-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-stone mb-2">{k.label}</p>
            <p className="serif-display text-ink text-4xl mb-1">{k.value}</p>
            <p className="text-xs text-success">{k.trend} this week</p>
          </div>
        ))}
      </section>

      {/* Two-column ops */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardEyebrow>Sofia · Voice ISA</CardEyebrow>
              <CardTitle>3 leads handled overnight.</CardTitle>
            </CardHeader>
            <CardBody>
              All three qualified. Two booked Saturday showings. One investor flagged for direct handoff — Brickell condo, $1.4M, cash. <Link href="/inbox" className="text-indigo hover:underline">Review →</Link>
            </CardBody>
            <CardFooter>+1 (305) 555 · 0184</CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex items-start justify-between">
              <div>
                <CardEyebrow>Vesper · Marketing</CardEyebrow>
                <CardTitle>Listing film ready for review.</CardTitle>
              </div>
              <Badge tone="brass">Awaiting approval</Badge>
            </CardHeader>
            <CardBody>
              <strong className="text-ink">2150 Ocean Drive</strong> · 90s cinematic cut · scored · voiceover in <em>The Insider</em> tone. Microsite live at{" "}
              <a href="#" className="text-indigo hover:underline">bichi.alevant.ai/m/2150-ocean-drive-ph4</a>.
            </CardBody>
            <CardFooter>Approve · Edit · Reroute</CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardEyebrow>The Grid · Today</CardEyebrow>
              <CardTitle>11 blazing motivation signals in your farm.</CardTitle>
            </CardHeader>
            <CardBody>
              Top: <strong className="text-ink">1287 SW 12th Ave</strong> · 18 yrs owned · est. equity 84% · probate filing 11 days ago. Direct mail draft ready.{" "}
              <Link href="/grid" className="text-indigo hover:underline">View grid →</Link>
            </CardBody>
            <CardFooter>11 blazing · 24 hot · 47 warm</CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardEyebrow>Sphere · Right call today</CardEyebrow>
              <CardTitle>Maria Delgado.</CardTitle>
            </CardHeader>
            <CardBody>
              Closed three years ago this month. Building +22%. Suggested: free valuation update + soft refi conversation. Script ready.
            </CardBody>
            <CardFooter>Open call · Send text · Defer</CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardEyebrow>Transactions · Risk flag</CardEyebrow>
              <CardTitle>Friday close — lender silence.</CardTitle>
            </CardHeader>
            <CardBody>
              448 Coconut Grove · loan commitment due in 36 hours · no response from lender in 5 days. Auto-nudge sent.
            </CardBody>
            <CardFooter>View timeline</CardFooter>
          </Card>
        </div>
      </div>

      {/* News & Intel feed */}
      <section className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <p className="eyebrow !text-brass flex items-center gap-2"><Newspaper className="w-3 h-3" /> News & Intel</p>
          <Link href="/news" className="text-[10px] uppercase tracking-[0.22em] text-stone hover:text-indigo">View all →</Link>
        </div>
        {(news || []).length === 0 ? (
          <div className="border border-mist bg-bone p-8 text-center">
            <p className="text-sm text-stone leading-relaxed">No alerts yet. The feed populates twice daily — or hit refresh in the news view.</p>
          </div>
        ) : (
          <div className="border border-mist bg-parchment divide-y divide-mist">
            {(news || []).map((n: any) => (
              <article key={n.id} className="grid grid-cols-[80px_1fr_120px] gap-4 px-5 py-4 items-start">
                <div>
                  <Badge tone={n.severity === "act" ? "hot" : n.severity === "watch" ? "warm" : "neutral"}>{n.severity}</Badge>
                  <p className="text-[9px] uppercase tracking-[0.22em] text-stone mt-2">{NEWS_CATEGORY_LABEL[n.category] || n.category}</p>
                </div>
                <div>
                  <p className="text-sm text-ink font-medium leading-snug mb-1">{n.title}</p>
                  {n.summary && <p className="text-xs text-smoke leading-relaxed">{n.summary}</p>}
                  {n.source_url && (
                    <a href={n.source_url} target="_blank" rel="noreferrer" className="text-xs text-indigo hover:underline inline-flex items-center gap-1 mt-2">
                      <ExternalLink className="w-3 h-3" /> {n.source_name || "Source"}
                    </a>
                  )}
                </div>
                <p className="text-xs text-stone text-right">{relativeTime(n.surfaced_at)}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="border border-mist p-6 bg-bone">
        <p className="eyebrow !text-brass mb-4">Quick actions</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/listings/new" className="btn-base bg-indigo text-parchment hover:bg-indigo-deep">
            <Sparkles className="w-4 h-4 mr-2" /> New listing
          </Link>
          <Link href="/underwriter" className="btn-base bg-brass text-ink hover:bg-brass-deep hover:text-parchment">
            Run underwriter
          </Link>
          <Link href="/sofia" className="btn-base bg-bone text-ink border border-mist hover:bg-mist">
            <Phone className="w-4 h-4 mr-2" /> Sofia config
          </Link>
          <Link href="/grid" className="btn-base bg-bone text-ink border border-mist hover:bg-mist">
            <Grid3x3 className="w-4 h-4 mr-2" /> The Grid
          </Link>
        </div>
      </section>
    </div>
  );
}
