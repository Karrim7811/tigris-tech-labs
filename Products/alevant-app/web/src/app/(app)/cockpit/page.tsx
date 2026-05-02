import { getSupabaseService, getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CockpitClient from "./CockpitClient";
import { fmtP, type CockpitAction } from "./types";

// ── helpers ────────────────────────────────────────────────────────────

function daysSince(dateStr?: string | null): number {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ── scoring ────────────────────────────────────────────────────────────
function dealMomentumScore(opts: {
  lastTouchDays: number;
  closeDate?: string | null;
  probability?: number;
}): number {
  let score = 60;
  if (opts.lastTouchDays > 21) score -= 40;
  else if (opts.lastTouchDays > 14) score -= 28;
  else if (opts.lastTouchDays > 7) score -= 15;
  else if (opts.lastTouchDays <= 3) score += 18;

  const dtc = daysUntil(opts.closeDate);
  if (dtc !== null) {
    if (dtc < 0) score -= 25;
    else if (dtc < 14) score += 12;
    else if (dtc > 90) score -= 8;
  }

  const prob = opts.probability ?? 50;
  if (prob >= 75) score += 15;
  else if (prob <= 25) score -= 12;

  return Math.max(0, Math.min(100, score));
}

function leadScore(p: any): number {
  let score = 0;
  const cat = (p.category || "").toLowerCase();
  if (cat === "lead") score += 30;
  else if (cat === "active_client") score += 50;
  if ((p.relationship_score ?? 0) >= 70) score += 30;
  else if ((p.relationship_score ?? 0) >= 40) score += 15;

  const days = daysSince(p.last_touch_at);
  if (days > 21) score -= 30;
  else if (days > 14) score -= 18;
  else if (days <= 3) score += 18;

  return score;
}

// ── action queue ───────────────────────────────────────────────────────

function generateActions(args: {
  contacts: any[];
  buyers: any[];
  listings: any[];
  transactions: any[];
  gridSignals: any[];
  vesperQueue: any[];
  sphereSignals: any[];
  overdueTasks: any[];
}): CockpitAction[] {
  const actions: CockpitAction[] = [];
  const seen = new Set<string>();
  const add = (a: CockpitAction) => {
    const key = a.type + "|" + a.title;
    if (!seen.has(key)) { seen.add(key); actions.push(a); }
  };

  // Overdue tasks on hot leads
  args.overdueTasks.forEach((t) => {
    add({
      type: "OVERDUE",
      priority: 100,
      title: t.summary || t.next_action || "Overdue task",
      detail: t.activity_type || "Task",
      href: t.contact_id ? `/inbox/${t.contact_id}` : "/inbox",
      badge: "OVERDUE",
      badgeTone: "hot",
    });
  });

  // Transactions closing in <14 days
  args.transactions.forEach((tx) => {
    const dtc = daysUntil(tx.expected_close);
    if (dtc !== null && dtc <= 14) {
      const flags = (tx.risk_flags as any[]) || [];
      const hasHigh = flags.some((f) => f.severity === "high");
      add({
        type: "CLOSE_NEAR",
        priority: 95 + (hasHigh ? 5 : 0),
        title: tx.property_address || "Active transaction",
        detail: `${tx.side} side · close ${dtc < 0 ? `${Math.abs(dtc)}d overdue` : `in ${dtc}d`}${hasHigh ? " · risk flagged" : ""}`,
        href: `/transactions/${tx.id}`,
        badge: hasHigh ? "RISK" : "CLOSING",
        badgeTone: hasHigh ? "hot" : "brass",
      });
    }
  });

  // Hot leads with no recent contact
  args.contacts
    .filter((c) => c.category === "lead" && (c.relationship_score ?? 0) >= 70)
    .forEach((c) => {
      const days = daysSince(c.last_touch_at);
      if (days >= 7) {
        add({
          type: "HOT_STALE",
          priority: 90 - Math.min(days, 25),
          title: c.full_name || "Unnamed lead",
          detail: `Hot lead · ${days >= 9999 ? "never contacted" : `no contact ${days}d`}`,
          href: "/inbox",
          badge: "HOT",
          badgeTone: "hot",
        });
      }
    });

  // Top blazing Grid signals
  args.gridSignals
    .filter((g) => (g.motivation_score ?? 0) >= 80 && g.status === "new" && !g.do_not_contact)
    .slice(0, 3)
    .forEach((g) => {
      add({
        type: "GRID_BLAZING",
        priority: 88,
        title: g.property_address || "Predicted seller",
        detail: g.reasons_summary || `Motivation ${g.motivation_score}`,
        href: "/grid",
        badge: "BLAZING",
        badgeTone: "hot",
      });
    });

  // Vesper assets awaiting approval
  if (args.vesperQueue.length > 0) {
    add({
      type: "VESPER_QUEUE",
      priority: 75,
      title: `${args.vesperQueue.length} Vesper asset${args.vesperQueue.length === 1 ? "" : "s"} awaiting approval`,
      detail: args.vesperQueue
        .slice(0, 2)
        .map((a) => a.asset_type?.replace(/_/g, " "))
        .join(" · "),
      href: "/vesper",
      badge: "REVIEW",
      badgeTone: "brass",
    });
  }

  // Sphere right-calls
  args.sphereSignals.slice(0, 3).forEach((s) => {
    add({
      type: "SPHERE_CALL",
      priority: 70,
      title: `${s.signal_type.replace(/_/g, " ")}`,
      detail: s.signal_data?.property_address || s.signal_data?.summary || "Right call today",
      href: "/sphere",
      badge: "SPHERE",
      badgeTone: "indigo",
    });
  });

  // Listings stale on market
  args.listings
    .filter((l) => l.status === "active" && daysSince(l.listing_date) > 30)
    .slice(0, 2)
    .forEach((l) => {
      add({
        type: "LISTING_STALE",
        priority: 60,
        title: l.address || "Listing",
        detail: `${daysSince(l.listing_date)} days on market — consider price strategy review`,
        href: `/listings/${l.id}`,
        badge: "REVIEW",
        badgeTone: "warm",
      });
    });

  return actions.sort((a, b) => b.priority - a.priority).slice(0, 8);
}

// ── page ───────────────────────────────────────────────────────────────
export default async function CockpitPage() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  // Resolve workspace via the service client (RLS-safe lookup of memberships)
  const svc = getSupabaseService();
  const { data: ownedWs } = await svc
    .from("workspaces")
    .select("id, name, slug, brand_kits(wordmark_text), agents(full_name, preferred_name)")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  const { data: membership } = ownedWs
    ? { data: { workspace_id: ownedWs.id } }
    : await svc
        .from("workspace_memberships")
        .select("workspace_id, workspaces!inner(id, name, slug, brand_kits(wordmark_text), agents(full_name, preferred_name))")
        .eq("user_id", user.id)
        .maybeSingle();

  const workspaceId = (ownedWs?.id ?? (membership as any)?.workspace_id) as string | undefined;
  const workspace = ownedWs ?? ((membership as any)?.workspaces as any);

  if (!workspaceId) {
    redirect("/onboard");
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const [
    { data: contacts },
    { data: listings },
    { data: buyers },
    { data: rentals },
    { data: investorDeals },
    { data: transactions },
    { data: gridSignals },
    { data: vesperQueue },
    { data: sphereSignals },
    { data: news },
    { data: overdueTasks },
    { data: todayTasks },
    { data: sofiaToday },
    { data: agentRow },
  ] = await Promise.all([
    svc.from("contacts").select("id, full_name, category, relationship_score, last_touch_at, source").eq("workspace_id", workspaceId!).limit(1000),
    svc.from("listings").select("id, address, city, status, price, beds, baths, sqft, listing_date, vesper_campaign_status, microsite_slug").eq("workspace_id", workspaceId!).limit(500),
    svc.from("buyers").select("id, contact_id, stage, budget_min, budget_max, timeline, preapproval_status, bba_signed_at, created_at").eq("workspace_id", workspaceId!).limit(500),
    svc.from("rentals").select("id, contact_id, stage, budget_per_month, lease_term_months, move_in_target").eq("workspace_id", workspaceId!).limit(500),
    svc.from("investor_deals").select("id, subject_property, deal_type, stage, equity_available, cap_rate_target").eq("workspace_id", workspaceId!).limit(500),
    svc.from("transactions").select("id, property_address, side, contract_date, expected_close, contract_price, status, risk_flags, listing_id").eq("workspace_id", workspaceId!).eq("status", "active").limit(100),
    svc.from("grid_signals").select("id, property_address, property_city, property_zip, motivation_score, reasons_summary, status, do_not_contact").eq("workspace_id", workspaceId!).order("motivation_score", { ascending: false }).limit(50),
    svc.from("vesper_assets").select("id, asset_type, channel, listing_id, scheduled_for").eq("workspace_id", workspaceId!).eq("status", "awaiting_approval").limit(50),
    svc.from("sphere_signals").select("id, contact_id, signal_type, signal_data, confidence, surfaced_at").eq("workspace_id", workspaceId!).eq("resolved", false).order("confidence", { ascending: false }).limit(20),
    svc.from("news_alerts").select("id, category, severity, title, summary, source_name, source_url, surfaced_at, related_listing_id").eq("workspace_id", workspaceId!).is("dismissed_at", null).order("surfaced_at", { ascending: false }).limit(8),
    svc.from("activity_log").select("id, contact_id, activity_type, summary, next_action, next_date").eq("workspace_id", workspaceId!).eq("completed", false).lt("next_date", todayStr).limit(50),
    svc.from("activity_log").select("id, contact_id, activity_type, summary, next_action, next_date").eq("workspace_id", workspaceId!).eq("completed", false).gte("next_date", todayStr).lte("next_date", todayStr + "T23:59:59").limit(50),
    svc.from("sofia_conversations").select("id, qualification_score, channel, status, started_at").eq("workspace_id", workspaceId!).gte("started_at", new Date(Date.now() - 86400000).toISOString()).limit(100),
    svc.from("agents").select("preferred_name, full_name").eq("workspace_id", workspaceId!).order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);

  const _contacts = contacts ?? [];
  const _listings = listings ?? [];
  const _buyers = buyers ?? [];
  const _rentals = rentals ?? [];
  const _investorDeals = investorDeals ?? [];
  const _transactions = transactions ?? [];
  const _gridSignals = gridSignals ?? [];
  const _vesperQueue = vesperQueue ?? [];
  const _sphereSignals = sphereSignals ?? [];
  const _news = news ?? [];
  const _overdueTasks = overdueTasks ?? [];
  const _todayTasks = todayTasks ?? [];
  const _sofiaToday = sofiaToday ?? [];

  // ── KPIs ──────────────────────────────────────────────────────────
  const activeListings = _listings.filter((l) => l.status === "active");
  const listingsValue = activeListings.reduce((s, l) => s + (Number(l.price) || 0), 0);
  const avgCommissionRate = 0.025; // 2.5% per side
  const expectedGCI = listingsValue * avgCommissionRate;

  const activeBuyers = _buyers.filter((b) => b.stage !== "closed" && b.stage !== "lost");
  const buyersAvgBudget = activeBuyers.length > 0
    ? activeBuyers.reduce((s, b) => s + (Number(b.budget_max) || 0), 0) / activeBuyers.length
    : 0;
  const expectedBuyerGCI = buyersAvgBudget * activeBuyers.length * avgCommissionRate * 0.4; // 40% conversion

  const transactionsAtRisk = _transactions.filter((tx) => {
    const flags = (tx.risk_flags as any[]) || [];
    return flags.some((f) => f.severity === "high");
  });
  const revenueAtRisk = transactionsAtRisk.reduce((s, tx) => s + (Number(tx.contract_price) || 0) * avgCommissionRate, 0);

  const hotUntouched = _contacts.filter(
    (c) => c.category === "lead" && (c.relationship_score ?? 0) >= 70 && daysSince(c.last_touch_at) >= 7
  ).length;

  const blazingGrid = _gridSignals.filter((g) => (g.motivation_score ?? 0) >= 80 && g.status === "new").length;

  const sofiaQualified = _sofiaToday.filter((c) => (c.qualification_score ?? 0) >= 70).length;
  const sofiaTotal = _sofiaToday.length;

  const newsActCount = _news.filter((n) => n.severity === "act").length;

  const kpis = [
    {
      label: "Revenue at Risk",
      value: revenueAtRisk > 0 ? fmtP(revenueAtRisk) : "—",
      sub: transactionsAtRisk.length > 0 ? `${transactionsAtRisk.length} transaction${transactionsAtRisk.length !== 1 ? "s" : ""} flagged` : "All transactions clear",
      alert: transactionsAtRisk.length > 0,
    },
    {
      label: "Expected GCI · listings",
      value: expectedGCI > 0 ? fmtP(expectedGCI) : "—",
      sub: `${activeListings.length} active listing${activeListings.length !== 1 ? "s" : ""}`,
      alert: false,
    },
    {
      label: "Need Outreach",
      value: hotUntouched.toString(),
      sub: hotUntouched > 0 ? "Hot leads untouched 7d+" : "All hot leads engaged",
      alert: hotUntouched > 0,
    },
    {
      label: "Grid · Blazing",
      value: blazingGrid.toString(),
      sub: blazingGrid > 0 ? "Predicted sellers, motivation 80+" : "No blazing signals",
      alert: blazingGrid >= 5,
    },
    {
      label: "Sofia · 24h",
      value: `${sofiaQualified}/${sofiaTotal}`,
      sub: sofiaTotal > 0 ? `${Math.round((sofiaQualified / sofiaTotal) * 100)}% qualified` : "No conversations yet",
      alert: false,
    },
    {
      label: "Vesper queue",
      value: _vesperQueue.length.toString(),
      sub: _vesperQueue.length > 0 ? "Awaiting your approval" : "Queue empty",
      alert: _vesperQueue.length >= 5,
    },
  ];

  // ── action queue ───────────────────────────────────────────────────
  const actions = generateActions({
    contacts: _contacts,
    buyers: _buyers,
    listings: _listings,
    transactions: _transactions,
    gridSignals: _gridSignals,
    vesperQueue: _vesperQueue,
    sphereSignals: _sphereSignals,
    overdueTasks: _overdueTasks,
  });

  // ── deal momentum (transactions + buyer pipeline) ─────────────────
  const dealMomentum = _transactions.map((tx) => {
    const lastTouch = daysSince(tx.contract_date); // proxy until activity_log linked
    const score = dealMomentumScore({
      lastTouchDays: lastTouch,
      closeDate: tx.expected_close,
      probability: 75, // under-contract default
    });
    return {
      id: tx.id,
      title: tx.property_address || "—",
      subtitle: `${tx.side} side · close ${tx.expected_close ?? "TBD"}`,
      value: Number(tx.contract_price) || 0,
      score,
      tier: score >= 70 ? "accelerating" : score >= 45 ? "coasting" : "stalling",
      href: `/transactions/${tx.id}`,
    };
  }).sort((a, b) => a.score - b.score);

  // ── prioritized leads ─────────────────────────────────────────────
  const prioritizedLeads = _contacts
    .filter((c) => c.category === "lead" || c.category === "active_client")
    .map((c) => ({ ...c, _score: leadScore(c) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 6);

  // ── greeting ──────────────────────────────────────────────────────
  const agentName = (agentRow as any)?.preferred_name || (agentRow as any)?.full_name || workspace?.name || "Producer";
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <CockpitClient
      agentName={agentName}
      dateLabel={dateLabel}
      kpis={kpis}
      actions={actions}
      dealMomentum={dealMomentum}
      gridTop={_gridSignals.filter((g) => g.status === "new" && !g.do_not_contact).slice(0, 5)}
      vesperQueue={_vesperQueue.map((v) => ({
        id: v.id,
        asset_type: v.asset_type,
        channel: v.channel,
        scheduled_for: v.scheduled_for,
      }))}
      sphereSignals={_sphereSignals.slice(0, 4)}
      news={_news}
      todayTasks={_todayTasks}
      overdueCount={_overdueTasks.length}
      prioritizedLeads={prioritizedLeads}
      counts={{
        listings: activeListings.length,
        buyers: activeBuyers.length,
        rentals: _rentals.length,
        investorDeals: _investorDeals.length,
        transactions: _transactions.length,
      }}
    />
  );
}
