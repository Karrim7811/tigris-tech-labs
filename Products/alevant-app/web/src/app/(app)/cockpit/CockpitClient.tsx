"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  Phone,
  Sparkles,
  Grid3x3,
  Newspaper,
  ExternalLink,
  Flame,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Heart,
  Mail,
  MessageCircle,
  Megaphone,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fmtP, type CockpitAction } from "./types";
import { relativeTime } from "@/lib/utils";

// ── types ──────────────────────────────────────────────────────────────
interface KPI {
  label: string;
  value: string;
  sub: string;
  alert: boolean;
}
interface DealMomentumItem {
  id: string;
  title: string;
  subtitle: string;
  value: number;
  score: number;
  tier: string;
  href: string;
}
interface GridSignal {
  id: string;
  property_address: string;
  property_city?: string;
  property_zip?: string;
  motivation_score: number;
  reasons_summary?: string;
}
interface VesperQueueItem {
  id: string;
  asset_type: string;
  channel?: string | null;
  scheduled_for?: string | null;
}
interface SphereSignal {
  id: string;
  contact_id: string;
  signal_type: string;
  signal_data?: any;
  confidence?: number;
  surfaced_at?: string;
}
interface NewsItem {
  id: string;
  category: string;
  severity: string;
  title: string;
  summary?: string;
  source_name?: string;
  source_url?: string;
  surfaced_at?: string;
  related_listing_id?: string;
}
interface TaskItem {
  id: string;
  contact_id?: string;
  activity_type: string;
  summary?: string;
  next_action?: string;
  next_date?: string;
}
interface LeadItem {
  id: string;
  full_name?: string;
  category?: string;
  relationship_score?: number;
  last_touch_at?: string;
  source?: string;
  _score: number;
}

interface CockpitClientProps {
  agentName: string;
  dateLabel: string;
  kpis: KPI[];
  actions: CockpitAction[];
  dealMomentum: DealMomentumItem[];
  gridTop: GridSignal[];
  vesperQueue: VesperQueueItem[];
  sphereSignals: SphereSignal[];
  news: NewsItem[];
  todayTasks: TaskItem[];
  overdueCount: number;
  prioritizedLeads: LeadItem[];
  counts: {
    listings: number;
    buyers: number;
    rentals: number;
    investorDeals: number;
    transactions: number;
  };
}

const NEWS_LABEL: Record<string, string> = {
  market: "Market", listing: "Listing", farm_zone: "Farm",
  sphere: "Sphere", competitor: "Competitor", regulatory: "Regulatory",
  mortgage_rates: "Rates", pre_construction: "Pre-Con",
};

function actionIcon(type: string) {
  switch (type) {
    case "OVERDUE": return <Clock className="w-3 h-3" />;
    case "CLOSE_NEAR": return <AlertCircle className="w-3 h-3" />;
    case "HOT_STALE": return <Flame className="w-3 h-3" />;
    case "GRID_BLAZING": return <Grid3x3 className="w-3 h-3" />;
    case "VESPER_QUEUE": return <Sparkles className="w-3 h-3" />;
    case "SPHERE_CALL": return <Heart className="w-3 h-3" />;
    case "LISTING_STALE": return <TrendingDown className="w-3 h-3" />;
    default: return <ChevronRight className="w-3 h-3" />;
  }
}

function tierMeta(tier: string) {
  switch (tier) {
    case "accelerating": return { label: "Accelerating", icon: TrendingUp, color: "text-success" };
    case "coasting": return { label: "Coasting", icon: TrendingUp, color: "text-warm" };
    case "stalling": return { label: "Stalling", icon: TrendingDown, color: "text-hot" };
    default: return { label: "—", icon: TrendingUp, color: "text-stone" };
  }
}

// ── component ─────────────────────────────────────────────────────────
export default function CockpitClient({
  agentName, dateLabel, kpis, actions, dealMomentum,
  gridTop, vesperQueue, sphereSignals, news, todayTasks,
  overdueCount, prioritizedLeads, counts,
}: CockpitClientProps) {
  const [activeTab, setActiveTab] = useState<"all" | "stalling" | "coasting" | "accelerating">("all");
  const [standupPlaying, setStandupPlaying] = useState(false);

  const filteredDeals = activeTab === "all"
    ? dealMomentum
    : dealMomentum.filter((d) => d.tier === activeTab);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="px-10 py-12 max-w-[1600px]">
      {/* Header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="eyebrow !text-indigo mb-2">Cockpit</p>
          <h1 className="serif-display text-ink text-5xl">{greeting}, {agentName}.</h1>
          <p className="serif-italic text-stone text-lg mt-2">{dateLabel}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setStandupPlaying((s) => !s)}
            className="btn-base bg-ink text-parchment hover:bg-ink/90"
          >
            <Bell className="w-4 h-4 mr-2" />
            {standupPlaying ? "Stop standup" : "Play 90-second standup"}
          </button>
          <Link href="/inbox" className="btn-base bg-bone text-ink border border-mist hover:bg-mist">
            View inbox
          </Link>
        </div>
      </header>

      {/* KPI strip */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-mist border border-mist mb-10">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`bg-parchment p-5 ${k.alert ? "ring-1 ring-hot/30" : ""}`}
          >
            <p className="text-[10px] uppercase tracking-[0.22em] text-stone mb-2">{k.label}</p>
            <p className={`serif-display text-3xl mb-1 ${k.alert ? "text-hot" : "text-ink"}`}>{k.value}</p>
            <p className="text-[11px] text-stone leading-snug">{k.sub}</p>
          </div>
        ))}
      </section>

      {/* Pipeline counts strip */}
      <section className="flex flex-wrap items-center gap-5 mb-10 px-5 py-4 bg-bone border border-mist text-xs">
        <span className="eyebrow !text-brass">Pipeline</span>
        <Link href="/listings" className="text-ink hover:text-indigo">
          <strong className="text-ink">{counts.listings}</strong> active listings
        </Link>
        <span className="text-mist">·</span>
        <Link href="/pipelines/buyer" className="text-ink hover:text-indigo">
          <strong className="text-ink">{counts.buyers}</strong> buyers
        </Link>
        <span className="text-mist">·</span>
        <Link href="/pipelines/rental" className="text-ink hover:text-indigo">
          <strong className="text-ink">{counts.rentals}</strong> rentals
        </Link>
        <span className="text-mist">·</span>
        <Link href="/pipelines/investor" className="text-ink hover:text-indigo">
          <strong className="text-ink">{counts.investorDeals}</strong> investor deals
        </Link>
        <span className="text-mist">·</span>
        <Link href="/transactions" className="text-ink hover:text-indigo">
          <strong className="text-ink">{counts.transactions}</strong> in escrow
        </Link>
        {overdueCount > 0 && (
          <>
            <span className="text-mist">·</span>
            <span className="text-hot">
              <Clock className="inline w-3 h-3 mr-1" />
              <strong>{overdueCount}</strong> overdue task{overdueCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </section>

      {/* Two-column main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mb-10">
        {/* LEFT — actions / momentum / grid */}
        <div className="space-y-6 min-w-0">
          {/* Action queue */}
          <section className="border border-mist bg-parchment">
            <div className="px-6 py-5 border-b border-mist flex items-center justify-between">
              <div>
                <p className="eyebrow !text-brass">Today's actions</p>
                <h3 className="serif-display text-2xl text-ink mt-1">
                  {actions.length === 0 ? "All clear." : `Top ${actions.length} actions, ranked.`}
                </h3>
              </div>
              <Badge tone={actions.length > 6 ? "hot" : actions.length > 0 ? "warm" : "success"}>
                {actions.length === 0 ? "Clear" : `${actions.length} action${actions.length === 1 ? "" : "s"}`}
              </Badge>
            </div>
            {actions.length === 0 ? (
              <p className="px-6 py-12 text-sm text-stone text-center">
                Nothing pressing. Sphere Brain runs again in 6 hours.
              </p>
            ) : (
              <ul className="divide-y divide-mist">
                {actions.map((a, i) => (
                  <li key={i}>
                    <Link
                      href={a.href}
                      className="px-6 py-4 grid grid-cols-[24px_1fr_auto] gap-4 items-center hover:bg-bone transition-colors group"
                    >
                      <div className="text-stone group-hover:text-indigo">{actionIcon(a.type)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-ink font-medium truncate">{a.title}</p>
                          <Badge tone={a.badgeTone}>{a.badge}</Badge>
                        </div>
                        <p className="text-xs text-stone truncate">{a.detail}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone group-hover:text-indigo flex-shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Deal momentum */}
          {dealMomentum.length > 0 && (
            <section className="border border-mist bg-parchment">
              <div className="px-6 py-5 border-b border-mist flex items-center justify-between">
                <div>
                  <p className="eyebrow !text-brass">Deal momentum</p>
                  <h3 className="serif-display text-2xl text-ink mt-1">
                    {dealMomentum.filter((d) => d.tier === "stalling").length} stalling ·{" "}
                    {dealMomentum.filter((d) => d.tier === "coasting").length} coasting ·{" "}
                    {dealMomentum.filter((d) => d.tier === "accelerating").length} accelerating
                  </h3>
                </div>
                <div className="flex gap-1">
                  {(["all", "stalling", "coasting", "accelerating"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] border transition-colors ${
                        activeTab === t
                          ? "bg-ink text-parchment border-ink"
                          : "bg-bone text-stone border-mist hover:bg-mist"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="divide-y divide-mist">
                {filteredDeals.length === 0 ? (
                  <li className="px-6 py-12 text-center text-sm text-stone">
                    No {activeTab !== "all" ? activeTab : ""} deals.
                  </li>
                ) : (
                  filteredDeals.map((d) => {
                    const meta = tierMeta(d.tier);
                    const Icon = meta.icon;
                    return (
                      <li key={d.id}>
                        <Link
                          href={d.href}
                          className="px-6 py-4 grid grid-cols-[60px_1fr_120px_24px] gap-4 items-center hover:bg-bone transition-colors group"
                        >
                          <div
                            className={`text-center serif-display text-2xl font-light ${
                              d.score >= 70 ? "text-success" : d.score >= 45 ? "text-warm" : "text-hot"
                            }`}
                          >
                            {d.score}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-ink font-medium truncate">{d.title}</p>
                            <p className="text-xs text-stone truncate">{d.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <Icon className={`w-3 h-3 ${meta.color}`} />
                            <span className={`text-[10px] uppercase tracking-[0.18em] ${meta.color}`}>
                              {meta.label}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone group-hover:text-indigo" />
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>
          )}

          {/* Grid blazing */}
          {gridTop.length > 0 && (
            <section className="border border-mist bg-parchment">
              <div className="px-6 py-5 border-b border-mist flex items-center justify-between">
                <div>
                  <p className="eyebrow !text-brass flex items-center gap-2">
                    <Grid3x3 className="w-3 h-3" /> The Grid · top signals
                  </p>
                  <h3 className="serif-display text-2xl text-ink mt-1">
                    Predicted sellers in your farm zones.
                  </h3>
                </div>
                <Link
                  href="/grid"
                  className="text-[10px] uppercase tracking-[0.22em] text-stone hover:text-indigo"
                >
                  View grid →
                </Link>
              </div>
              <ul className="divide-y divide-mist">
                {gridTop.map((g) => (
                  <li key={g.id} className="px-6 py-4 grid grid-cols-[60px_1fr_140px] gap-4 items-center">
                    <div
                      className={`text-center serif-display text-2xl font-light ${
                        g.motivation_score >= 80 ? "text-hot" :
                        g.motivation_score >= 65 ? "text-warm" : "text-stone"
                      }`}
                    >
                      {g.motivation_score}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-ink font-medium truncate">{g.property_address}</p>
                      <p className="text-xs text-stone truncate">{g.reasons_summary || `${g.property_city ?? ""} ${g.property_zip ?? ""}`}</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Link href={`/grid`} className="btn-base !text-[9px] !px-2 !py-1.5 bg-indigo text-parchment hover:bg-indigo-deep">
                        <Mail className="w-2.5 h-2.5 mr-1" /> Mail
                      </Link>
                      <Link href={`/grid`} className="btn-base !text-[9px] !px-2 !py-1.5 bg-bone text-ink border border-mist hover:bg-mist">
                        <Megaphone className="w-2.5 h-2.5 mr-1" /> Ad
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* News & Intel */}
          <section className="border border-mist bg-parchment">
            <div className="px-6 py-5 border-b border-mist flex items-center justify-between">
              <div>
                <p className="eyebrow !text-brass flex items-center gap-2">
                  <Newspaper className="w-3 h-3" /> News & Intel
                </p>
                <h3 className="serif-display text-2xl text-ink mt-1">
                  {news.length > 0 ? "Live feed." : "Quiet."}
                </h3>
              </div>
              <Link href="/news" className="text-[10px] uppercase tracking-[0.22em] text-stone hover:text-indigo">
                View all →
              </Link>
            </div>
            {news.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-stone">
                Feed populates twice daily at 7am and 5pm ET. Hit refresh on the news page to run a manual scan.
              </p>
            ) : (
              <ul className="divide-y divide-mist">
                {news.slice(0, 5).map((n) => (
                  <li key={n.id} className="px-6 py-4 grid grid-cols-[80px_1fr_100px] gap-4 items-start">
                    <div>
                      <Badge tone={n.severity === "act" ? "hot" : n.severity === "watch" ? "warm" : "neutral"}>
                        {n.severity}
                      </Badge>
                      <p className="text-[9px] uppercase tracking-[0.22em] text-stone mt-1.5">
                        {NEWS_LABEL[n.category] ?? n.category}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-ink font-medium leading-snug mb-1">{n.title}</p>
                      {n.summary && <p className="text-xs text-smoke leading-relaxed line-clamp-2">{n.summary}</p>}
                      {n.source_url && (
                        <a
                          href={n.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo hover:underline inline-flex items-center gap-1 mt-1.5"
                        >
                          <ExternalLink className="w-2.5 h-2.5" /> {n.source_name ?? "Source"}
                        </a>
                      )}
                    </div>
                    <p className="text-[10px] text-stone text-right">
                      {n.surfaced_at ? relativeTime(n.surfaced_at) : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* RIGHT rail */}
        <aside className="space-y-6">
          {/* Today's tasks */}
          <section className="border border-mist bg-parchment">
            <div className="px-5 py-4 border-b border-mist">
              <p className="eyebrow !text-brass">Today</p>
              <p className="text-xs text-stone mt-1">
                {todayTasks.length} task{todayTasks.length !== 1 ? "s" : ""} · {overdueCount} overdue
              </p>
            </div>
            {todayTasks.length === 0 ? (
              <p className="px-5 py-6 text-center text-xs text-stone">No tasks scheduled today.</p>
            ) : (
              <ul className="divide-y divide-mist">
                {todayTasks.slice(0, 6).map((t) => (
                  <li key={t.id} className="px-5 py-3">
                    <p className="text-xs text-ink font-medium leading-snug">
                      {t.summary ?? t.next_action ?? t.activity_type}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-stone mt-1">
                      {t.activity_type}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Vesper queue */}
          {vesperQueue.length > 0 && (
            <section className="border border-mist bg-parchment">
              <div className="px-5 py-4 border-b border-mist flex items-center justify-between">
                <div>
                  <p className="eyebrow !text-brass flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Vesper queue
                  </p>
                  <p className="text-xs text-stone mt-1">{vesperQueue.length} awaiting</p>
                </div>
                <Link href="/vesper" className="text-[10px] uppercase tracking-[0.18em] text-stone hover:text-indigo">
                  Open →
                </Link>
              </div>
              <ul className="divide-y divide-mist">
                {vesperQueue.slice(0, 5).map((v) => (
                  <li key={v.id} className="px-5 py-3">
                    <p className="text-xs text-ink capitalize">{v.asset_type.replace(/_/g, " ")}</p>
                    {v.channel && <p className="text-[10px] text-stone uppercase mt-0.5">{v.channel}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Sphere right-calls */}
          {sphereSignals.length > 0 && (
            <section className="border border-mist bg-parchment">
              <div className="px-5 py-4 border-b border-mist flex items-center justify-between">
                <div>
                  <p className="eyebrow !text-brass flex items-center gap-1.5">
                    <Heart className="w-3 h-3" /> Sphere
                  </p>
                  <p className="text-xs text-stone mt-1">Right calls today</p>
                </div>
                <Link href="/sphere" className="text-[10px] uppercase tracking-[0.18em] text-stone hover:text-indigo">
                  Open →
                </Link>
              </div>
              <ul className="divide-y divide-mist">
                {sphereSignals.map((s) => (
                  <li key={s.id} className="px-5 py-3">
                    <p className="text-xs text-ink font-medium capitalize">
                      {s.signal_type.replace(/_/g, " ")}
                    </p>
                    {s.signal_data?.property_address && (
                      <p className="text-[10px] text-stone mt-0.5 truncate">{s.signal_data.property_address}</p>
                    )}
                    {s.signal_data?.years && (
                      <p className="text-[10px] text-stone mt-0.5">{s.signal_data.years}-year anniversary</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Prioritized leads */}
          {prioritizedLeads.length > 0 && (
            <section className="border border-mist bg-parchment">
              <div className="px-5 py-4 border-b border-mist flex items-center justify-between">
                <div>
                  <p className="eyebrow !text-brass">Prioritized</p>
                  <p className="text-xs text-stone mt-1">Top {prioritizedLeads.length} leads</p>
                </div>
                <Link href="/inbox" className="text-[10px] uppercase tracking-[0.18em] text-stone hover:text-indigo">
                  Inbox →
                </Link>
              </div>
              <ul className="divide-y divide-mist">
                {prioritizedLeads.map((l) => (
                  <li key={l.id} className="px-5 py-3 flex items-center gap-3">
                    <div className={`serif-display text-lg font-light w-7 text-center ${
                      l._score >= 70 ? "text-hot" : l._score >= 40 ? "text-warm" : "text-stone"
                    }`}>
                      {l._score}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-ink font-medium truncate">{l.full_name ?? "Unnamed"}</p>
                      <p className="text-[10px] text-stone truncate">
                        {l.last_touch_at ? `Touched ${relativeTime(l.last_touch_at)}` : "Never contacted"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {/* Quick actions footer */}
      <section className="border border-mist p-6 bg-bone flex flex-wrap gap-3">
        <p className="eyebrow !text-brass w-full mb-1">Quick actions</p>
        <Link href="/listings/new" className="btn-base bg-indigo text-parchment hover:bg-indigo-deep">
          <Sparkles className="w-4 h-4 mr-2" /> New listing → Vesper
        </Link>
        <Link href="/underwriter" className="btn-base bg-brass text-ink hover:bg-brass-deep hover:text-parchment">
          Run underwriter
        </Link>
        <Link href="/grid/scan" className="btn-base bg-bone text-ink border border-mist hover:bg-mist">
          <Grid3x3 className="w-4 h-4 mr-2" /> Scan farm zones
        </Link>
        <Link href="/sofia" className="btn-base bg-bone text-ink border border-mist hover:bg-mist">
          <Phone className="w-4 h-4 mr-2" /> Sofia config
        </Link>
        <Link href="/vesper" className="btn-base bg-bone text-ink border border-mist hover:bg-mist">
          <Sparkles className="w-4 h-4 mr-2" /> Vesper studio
        </Link>
      </section>
    </div>
  );
}
