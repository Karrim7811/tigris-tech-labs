import Link from "next/link";
import {
  Database,
  CheckCircle2,
  Clock,
  ExternalLink,
  Zap,
  Building,
  TrendingUp,
  Grid3x3,
  Newspaper,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSupabaseService, getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ── MLS aggregator providers (one of these connects to most US MLSs) ──
const PROVIDERS = [
  {
    id: "mls_grid",
    name: "MLS Grid",
    blurb:
      "Single contract, RESO Web API, ~80% US MLS coverage including most of Florida. Recommended.",
    coverage: "Miami MLS · MLS of South Florida · Stellar MLS · MIBOR",
    pricing: "$50-300/mo per agent depending on MLS",
    url: "https://mlsgrid.com/",
    recommended: true,
  },
  {
    id: "bridge",
    name: "Bridge Interactive",
    blurb:
      "Strong Florida coverage (Miami MLS, Stellar MLS). Zillow Group product. Slower onboarding but stable.",
    coverage: "Miami MLS · Stellar MLS · Realtors of the Palm Beaches",
    pricing: "Per-MLS pricing, contact sales",
    url: "https://www.bridgeinteractive.com/",
    recommended: false,
  },
  {
    id: "trestle",
    name: "Trestle",
    blurb:
      "CoreLogic-owned. Broad coverage but enterprise-tier pricing. Strong for nationwide expansion.",
    coverage: "Most US MLSs",
    pricing: "Enterprise — typically $500+/mo per MLS",
    url: "https://trestle.corelogic.com/",
    recommended: false,
  },
  {
    id: "spark",
    name: "Spark API",
    blurb: "FBS product. Powers the Flexmls platform. Solid for MLSs on Flexmls.",
    coverage: "Flexmls-powered MLSs",
    pricing: "Per-MLS pricing",
    url: "https://sparkplatform.com/docs",
    recommended: false,
  },
];

// ── Florida MLSs Bichi will likely need ──
const FLORIDA_MLS = [
  { id: "miami_mls", name: "Miami MLS (Miami Association of Realtors)", region: "Miami-Dade · Broward", priority: "primary", member_count: "60,000+ agents" },
  { id: "mls_south_fl", name: "MLS of South Florida (Beaches MLS)", region: "Broward · Palm Beach", priority: "primary", member_count: "45,000+ agents" },
  { id: "stellar_mls", name: "Stellar MLS", region: "Central + South FL", priority: "secondary", member_count: "75,000+ agents" },
  { id: "rapb_gflr", name: "Realtors of the Palm Beaches & Greater Fort Lauderdale", region: "Palm Beach · Broward", priority: "secondary", member_count: "40,000+ agents" },
  { id: "naples", name: "Naples Area Board of Realtors", region: "Collier County", priority: "tertiary", member_count: "8,000+ agents" },
];

// ── Capabilities unlocked when MLS connects ──
const UNLOCKS = [
  { icon: Building, title: "Auto-import listings", body: "Active listings sync hourly. Status changes (active → pending → sold) flow into Vesper triggers." },
  { icon: TrendingUp, title: "Real comps for Underwriter", body: "CMA replaces public-records lookups with same-day MLS sold comps within 0.25 / 0.5 / 1 mile." },
  { icon: Grid3x3, title: "Grid · cross-reference", body: "Predicted sellers cross-checked against active MLS listings — surface owners not yet listed." },
  { icon: Newspaper, title: "Listing-level news", body: "Per-listing market activity (price drops within 0.5mi, comp closings) feeds the News & Intel feed." },
  { icon: Sparkles, title: "Vesper pre-listing brief", body: "Listing presentation packs auto-generate with MLS comps, neighborhood absorption, days-on-market trends." },
  { icon: Zap, title: "Buyer Match Engine 24/7", body: "Every new MLS listing scored against every buyer in your pipeline — auto-drafts personalized outreach." },
];

export default async function MLSPage() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  // Check if any MLS connection is configured (workspace_integrations row with service starting 'mls_')
  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  const { data: integrations } = ws
    ? await svc
        .from("workspace_integrations")
        .select("service, status, connected_at")
        .eq("workspace_id", ws.id)
        .like("service", "mls_%")
    : { data: [] };

  const connected = (integrations ?? []).filter((i) => i.status === "connected");
  const isPending = !connected.length;

  return (
    <div className="px-10 py-12 max-w-[1600px]">
      {/* Header */}
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Integrations · MLS</p>
        <h1 className="serif-display text-ink text-5xl mb-3">MLS Sync.</h1>
        <p className="serif-italic text-stone text-lg max-w-3xl">
          One connection unlocks listings, comps, market signals, and the buyer-match engine.
          Manual entry works today; MLS auto-sync flips on the moment your aggregator approves the connection.
        </p>
      </header>

      {/* Status banner */}
      <section
        className={`border p-6 mb-10 flex items-start gap-4 ${
          isPending ? "border-warm/40 bg-warm/5" : "border-success/40 bg-success/5"
        }`}
      >
        {isPending ? (
          <Clock className="w-5 h-5 text-warm flex-shrink-0 mt-1" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-1" />
        )}
        <div className="flex-1">
          <p className="serif-display text-ink text-2xl mb-1">
            {isPending ? "Awaiting aggregator approval." : `Connected · ${connected.length} provider${connected.length === 1 ? "" : "s"}`}
          </p>
          <p className="text-sm text-smoke leading-relaxed mb-3">
            {isPending
              ? "MLS Grid / Bridge / Trestle approval typically takes 30–90 days. While we wait, manual listing entry works in /listings, and the Underwriter falls back to public records + scraped comps."
              : "Listings sync hourly. Comps refresh on every CMA run."}
          </p>
          {isPending && (
            <div className="flex gap-2 flex-wrap">
              <Badge tone="warm">Status · Pending</Badge>
              <Badge tone="neutral">ETA · 30–90 days post-application</Badge>
              <Badge tone="indigo">Manual mode active</Badge>
            </div>
          )}
        </div>
      </section>

      {/* What you get */}
      <section className="mb-10">
        <p className="eyebrow !text-brass mb-4">What MLS unlocks</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-mist border border-mist">
          {UNLOCKS.map((u) => (
            <div key={u.title} className="bg-parchment p-6">
              <u.icon className="w-5 h-5 text-indigo mb-3" strokeWidth={1.5} />
              <p className="serif-display text-ink text-xl mb-2">{u.title}</p>
              <p className="text-sm text-smoke leading-relaxed">{u.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Aggregator providers */}
      <section className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="eyebrow !text-brass">Aggregator providers</p>
            <p className="text-xs text-stone mt-1">
              Pick one. They each handle the per-MLS authorization paperwork.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {PROVIDERS.map((p) => (
            <div
              key={p.id}
              className={`border p-6 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 items-start transition-colors ${
                p.recommended ? "border-indigo bg-indigo/5" : "border-mist bg-parchment"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-indigo" />
                  <p className="serif-display text-ink text-2xl">{p.name}</p>
                  {p.recommended && <Badge tone="indigo">Recommended</Badge>}
                </div>
                <p className="text-sm text-smoke leading-relaxed mb-3">{p.blurb}</p>
                <p className="text-xs text-stone mb-1">
                  <strong className="text-ink">Coverage: </strong>
                  {p.coverage}
                </p>
                <p className="text-xs text-stone">
                  <strong className="text-ink">Pricing: </strong>
                  {p.pricing}
                </p>
              </div>
              <div className="space-y-2">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-base w-full bg-bone text-ink border border-mist hover:bg-mist text-center"
                >
                  <ExternalLink className="w-3 h-3 mr-2" /> Provider site
                </a>
                <Link
                  href={`/api/mls/request?provider=${p.id}`}
                  className={`btn-base w-full text-center ${
                    p.recommended
                      ? "bg-indigo text-parchment hover:bg-indigo-deep"
                      : "bg-bone text-ink border border-mist hover:bg-mist"
                  }`}
                >
                  Request connection
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Florida MLSs */}
      <section className="mb-10">
        <p className="eyebrow !text-brass mb-4">Florida MLSs you'll likely authorize</p>
        <div className="border border-mist bg-parchment">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_120px] gap-4 px-5 py-3 border-b border-mist text-[10px] uppercase tracking-[0.22em] text-stone bg-bone">
            <div>MLS</div>
            <div>Region</div>
            <div>Members</div>
            <div className="text-right">Priority</div>
          </div>
          {FLORIDA_MLS.map((mls) => (
            <div
              key={mls.id}
              className="grid grid-cols-[1.5fr_1fr_1fr_120px] gap-4 px-5 py-4 items-center border-b border-mist last:border-b-0"
            >
              <p className="text-sm text-ink font-medium">{mls.name}</p>
              <p className="text-xs text-smoke">{mls.region}</p>
              <p className="text-xs text-stone">{mls.member_count}</p>
              <div className="text-right">
                <Badge
                  tone={
                    mls.priority === "primary"
                      ? "indigo"
                      : mls.priority === "secondary"
                      ? "warm"
                      : "neutral"
                  }
                >
                  {mls.priority}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone mt-3 leading-relaxed">
          Each MLS requires per-broker authorization paperwork (your brokerage's broker-of-record signs).
          Your aggregator manages the process. Bichi's primary is <strong>Miami MLS</strong> + <strong>MLS of South Florida</strong>.
        </p>
      </section>

      {/* Sync log placeholder */}
      <section className="mb-10">
        <p className="eyebrow !text-brass mb-4">Sync log</p>
        <div className="border border-mist bg-bone p-12 text-center">
          <Clock className="w-6 h-6 text-stone mx-auto mb-3" strokeWidth={1.2} />
          <p className="serif-display text-ink text-2xl mb-2">No syncs yet.</p>
          <p className="text-sm text-stone leading-relaxed max-w-md mx-auto">
            Once a provider is connected, this log shows hourly sync runs — listings imported,
            updated, photos refreshed, status changes detected.
          </p>
        </div>
      </section>

      {/* Manual mode CTA */}
      <section className="border border-indigo/30 bg-indigo/5 p-6 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-indigo flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="serif-display text-ink text-xl mb-1">Manual mode is active.</p>
          <p className="text-sm text-smoke leading-relaxed mb-3">
            You can add listings by hand at <Link href="/listings/new" className="text-indigo underline">/listings/new</Link>,
            or paste a Zillow / Realtor.com URL — Vesper scrapes the page and prefills the listing.
            Everything you build today auto-migrates when MLS sync goes live.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Link href="/listings/new" className="btn-base bg-indigo text-parchment hover:bg-indigo-deep">
              + New listing
            </Link>
            <Link href="/listings" className="btn-base bg-bone text-ink border border-mist hover:bg-mist">
              View listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
