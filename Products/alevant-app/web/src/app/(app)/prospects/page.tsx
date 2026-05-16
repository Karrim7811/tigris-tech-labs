import Link from "next/link";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Target, Flame, Mail, CircleUser } from "lucide-react";

export const dynamic = "force-dynamic";

interface ProspectRow {
  source: "grid" | "inbox" | "sphere";
  source_id: string;
  workspace_id: string;
  contact_id: string | null;
  title: string;
  city: string | null;
  zip: string | null;
  person_name: string | null;
  score: number | null;
  temperature: string | null;
  priority: string | null;
  urgency_band: string | null;
  why: string | null;
  expires_at: string | null;
  detected_at: string | null;
  state: "new" | "engaged";
}

type Filter = "all" | "grid" | "inbox" | "sphere";

async function loadProspects(
  filter: Filter,
  band: string | null,
  temp: string | null,
  prio: string | null
): Promise<ProspectRow[]> {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return [];
  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return [];

  let q = svc
    .from("vw_prospects")
    .select("*")
    .eq("workspace_id", ws.id)
    .order("score", { ascending: false, nullsFirst: false })
    .limit(200);
  if (filter !== "all") q = q.eq("source", filter);
  if (band) q = q.eq("urgency_band", band);
  if (temp) q = q.eq("temperature", temp);
  if (prio) q = q.eq("priority", prio);
  const { data } = await q;
  return (data ?? []) as ProspectRow[];
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!isFinite(ms)) return null;
  return Math.round(ms / 86_400_000);
}

const SOURCE_ICON = {
  grid: Flame,
  inbox: Mail,
  sphere: CircleUser,
} as const;

const BAND_TONE: Record<string, "hot" | "warm" | "cold" | "neutral"> = {
  blazing: "hot",
  hot: "hot",
  warm: "warm",
  watch: "cold",
};

export default async function ProspectsPage(props: {
  searchParams: Promise<{ source?: string; band?: string; temp?: string; prio?: string }>;
}) {
  const sp = await props.searchParams;
  const filter = (sp.source ?? "all") as Filter;
  const band = sp.band ?? null;
  const temp = sp.temp ?? null;
  const prio = sp.prio ?? null;
  const rows = await loadProspects(filter, band, temp, prio);

  function buildHref(overrides: Partial<{ source: string; band: string | null; temp: string | null; prio: string | null }>) {
    const next = new URLSearchParams();
    next.set("source", overrides.source ?? filter);
    const b = overrides.band === undefined ? band : overrides.band;
    if (b) next.set("band", b);
    const t = overrides.temp === undefined ? temp : overrides.temp;
    if (t) next.set("temp", t);
    const p = overrides.prio === undefined ? prio : overrides.prio;
    if (p) next.set("prio", p);
    return `/prospects?${next.toString()}`;
  }

  const counts = {
    total: rows.length,
    blazing: rows.filter((r) => r.urgency_band === "blazing").length,
    hot: rows.filter((r) => r.urgency_band === "hot").length,
    grid: rows.filter((r) => r.source === "grid").length,
    inbox: rows.filter((r) => r.source === "inbox").length,
    sphere: rows.filter((r) => r.source === "sphere").length,
  };

  const sources: Array<{ value: Filter; label: string; count: number }> = [
    { value: "all", label: "All", count: counts.total },
    { value: "grid", label: "Grid", count: counts.grid },
    { value: "inbox", label: "Inbox", count: counts.inbox },
    { value: "sphere", label: "Sphere", count: counts.sphere },
  ];

  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="mb-8">
        <p className="eyebrow !text-indigo mb-2">Prospects</p>
        <h1 className="serif-display text-ink text-5xl">Today's right calls.</h1>
        <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
          Every prospect across the Grid (predicted sellers), the Inbox (uncontacted
          leads), and the Sphere (active life-event signals) — ranked by priority.
          Convert any row to a contact when you start working it.
        </p>
      </header>

      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="border border-mist bg-parchment p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone">Total in scope</p>
          <p className="serif-display text-ink text-4xl mt-2">{counts.total}</p>
        </div>
        <div className="border border-mist bg-parchment p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-hot">Blazing</p>
          <p className="serif-display text-hot text-4xl mt-2">{counts.blazing}</p>
        </div>
        <div className="border border-mist bg-parchment p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone">Hot</p>
          <p className="serif-display text-ink text-4xl mt-2">{counts.hot}</p>
        </div>
        <div className="border border-mist bg-parchment p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone">Engaged</p>
          <p className="serif-display text-ink text-4xl mt-2">
            {rows.filter((r) => r.state === "engaged").length}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {sources.map((s) => (
          <Link
            key={s.value}
            href={buildHref({ source: s.value })}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider border ${
              filter === s.value
                ? "border-indigo bg-indigo text-parchment"
                : "border-mist text-stone hover:text-ink"
            }`}
          >
            {s.label} · {s.count}
          </Link>
        ))}
        <div className="w-px h-5 bg-mist mx-2" />
        {(["blazing", "hot", "warm", "watch"] as const).map((b) => (
          <Link
            key={b}
            href={buildHref({ band: band === b ? null : b })}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider border ${
              band === b
                ? "border-indigo bg-indigo text-parchment"
                : "border-mist text-stone hover:text-ink"
            }`}
          >
            {b}
          </Link>
        ))}
      </div>

      {/* Temperature + Priority filter row */}
      <div className="flex items-center gap-4 mb-6 flex-wrap text-[10px] uppercase tracking-[0.28em] text-stone">
        <div className="flex items-center gap-1.5">
          <span>Temp:</span>
          {(["Hot", "Warm", "Cold", "Disqualified"] as const).map((t) => (
            <Link
              key={t}
              href={buildHref({ temp: temp === t ? null : t })}
              className={`px-2.5 py-1 border ${
                temp === t
                  ? "bg-indigo text-parchment border-indigo"
                  : "bg-parchment text-stone border-mist hover:text-ink"
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span>Priority:</span>
          {(["High", "Medium", "Low"] as const).map((p) => (
            <Link
              key={p}
              href={buildHref({ prio: prio === p ? null : p })}
              className={`px-2.5 py-1 border ${
                prio === p
                  ? "bg-indigo text-parchment border-indigo"
                  : "bg-parchment text-stone border-mist hover:text-ink"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
        {(temp || prio || band) && (
          <Link href={buildHref({ band: null, temp: null, prio: null })} className="text-indigo hover:underline">
            Clear filters
          </Link>
        )}
      </div>

      <div className="border border-mist bg-parchment">
        <div className="grid grid-cols-[64px_1.6fr_120px_120px_1.4fr_100px_100px] gap-4 px-6 py-3 border-b border-mist text-[10px] tracking-[0.28em] uppercase text-stone">
          <div></div>
          <div>Prospect</div>
          <div>Source</div>
          <div>Band</div>
          <div>Why</div>
          <div className="text-right">Score</div>
          <div className="text-right">Detected</div>
        </div>
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone">
            <Target className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="serif-italic">No prospects match that filter.</p>
          </div>
        ) : (
          rows.map((p) => {
            const Icon = SOURCE_ICON[p.source];
            const expiresDays = daysUntil(p.expires_at);
            const href =
              p.source === "grid"
                ? `/grid?signal_id=${p.source_id}`
                : p.contact_id
                ? `/contacts/${p.contact_id}`
                : "#";
            return (
              <Link
                key={`${p.source}-${p.source_id}`}
                href={href}
                className="grid grid-cols-[64px_1.6fr_120px_120px_1.4fr_100px_100px] gap-4 px-6 py-4 border-b border-mist/40 last:border-0 hover:bg-mist/20 transition-colors items-center"
              >
                <div>
                  <div className="w-10 h-10 grid place-items-center bg-mist/40 border border-mist">
                    <Icon className="w-4 h-4 text-indigo" />
                  </div>
                </div>
                <div>
                  <p className="serif-display text-ink text-lg leading-tight">{p.title}</p>
                  <p className="text-xs text-smoke mt-1">
                    {p.person_name ? `${p.person_name}` : ""}
                    {p.city && p.person_name ? " · " : ""}
                    {p.city ?? ""}
                    {p.zip ? ` ${p.zip}` : ""}
                  </p>
                </div>
                <div className="text-xs text-stone uppercase tracking-wider">{p.source}</div>
                <div>
                  <Badge tone={BAND_TONE[p.urgency_band ?? "watch"] ?? "neutral"}>
                    {p.urgency_band ?? "watch"}
                  </Badge>
                  {expiresDays !== null && expiresDays >= 0 && (
                    <p className="text-[10px] text-stone mt-1 uppercase tracking-wider">
                      decays in {expiresDays}d
                    </p>
                  )}
                </div>
                <div className="text-xs text-smoke leading-relaxed">
                  {p.why?.slice(0, 160) ?? "—"}
                </div>
                <div className="text-right">
                  <span className="serif-display text-ink text-2xl">
                    {Math.round(p.score ?? 0)}
                  </span>
                </div>
                <div className="text-right text-xs text-stone">
                  {fmtDate(p.detected_at)}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
