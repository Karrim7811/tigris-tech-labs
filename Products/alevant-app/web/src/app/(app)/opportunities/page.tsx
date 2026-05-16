import Link from "next/link";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Users, DollarSign } from "lucide-react";
import { STAGE_LABEL, type OppStage, type OppSide } from "@/lib/opp-stages";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface OppRow {
  id: string;
  opp_number: string;
  name: string;
  side: OppSide;
  stage: OppStage;
  est_value_usd: number | null;
  est_commission_usd: number | null;
  probability: number | null;
  expected_close: string | null;
  property_address: string | null;
  stage_changed_at: string;
  contact_id: string | null;
  contact?: { full_name: string | null; temperature: string | null; priority: string | null } | null;
}

const BUYER_LANES: OppStage[] = ["qualified", "showing", "offer_submitted"];
const SELLER_LANES: OppStage[] = ["qualified", "listing_appointment", "listed", "offer_received"];
const CLOSED_LANES: OppStage[] = ["won", "lost"];

const STAGE_BORDER: Record<OppStage, string> = {
  qualified: "border-indigo",
  showing: "border-brass",
  offer_submitted: "border-hot",
  listing_appointment: "border-indigo",
  listed: "border-brass",
  offer_received: "border-hot",
  won: "border-indigo",
  lost: "border-stone",
};

async function loadOpps(view: "board" | "list", side: "all" | "buyer" | "seller"): Promise<OppRow[]> {
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
    .from("opportunities")
    .select("*, contact:contacts(full_name, temperature, priority)")
    .eq("workspace_id", ws.id)
    .order("stage_changed_at", { ascending: false })
    .limit(500);
  if (side !== "all") q = q.eq("side", side);
  const { data } = await q;
  return (data ?? []) as OppRow[];
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

export default async function OpportunitiesPage(props: {
  searchParams: Promise<{ side?: string; view?: string }>;
}) {
  const sp = await props.searchParams;
  const side = (sp.side ?? "all") as "all" | "buyer" | "seller";
  const view = (sp.view ?? "board") as "board" | "list";
  const opps = await loadOpps(view, side);

  const open = opps.filter((o) => o.stage !== "won" && o.stage !== "lost");
  const pipelineValue = open.reduce((s, o) => s + (o.est_value_usd ?? 0), 0);
  const wonValue = opps
    .filter((o) => o.stage === "won")
    .reduce((s, o) => s + (o.est_value_usd ?? 0), 0);

  const byStage = (stage: OppStage) => opps.filter((o) => o.stage === stage);

  // Decide which lanes to show
  const lanes: OppStage[] =
    side === "buyer"
      ? [...BUYER_LANES, ...CLOSED_LANES]
      : side === "seller"
      ? [...SELLER_LANES, ...CLOSED_LANES]
      : ["qualified", "showing", "offer_submitted", "listing_appointment", "listed", "offer_received", "won", "lost"];

  return (
    <div className="px-10 py-12 max-w-[1600px]">
      <header className="mb-8 flex items-start justify-between gap-8">
        <div>
          <p className="eyebrow !text-indigo mb-2">Opportunities</p>
          <h1 className="serif-display text-ink text-5xl">Working deals.</h1>
          <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
            Pre-contract deals you're actively pursuing. Once an offer is accepted, an opportunity
            graduates to a Transaction. Pipeline value:{" "}
            <strong className="text-ink">{formatCurrency(pipelineValue)}</strong>
            {" · "}Won YTD: <strong className="text-ink">{formatCurrency(wonValue)}</strong>
          </p>
        </div>
      </header>

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="border border-mist bg-parchment p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone flex items-center gap-1.5">
            <Target className="w-3 h-3" /> Open
          </p>
          <p className="serif-display text-ink text-4xl mt-2">{open.length}</p>
        </div>
        <div className="border border-mist bg-parchment p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone flex items-center gap-1.5">
            <DollarSign className="w-3 h-3" /> Pipeline value
          </p>
          <p className="serif-display text-ink text-3xl mt-2">{formatCurrency(pipelineValue)}</p>
        </div>
        <div className="border border-mist bg-parchment p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Won YTD
          </p>
          <p className="serif-display text-ink text-3xl mt-2">{formatCurrency(wonValue)}</p>
        </div>
        <div className="border border-mist bg-parchment p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Contacts active
          </p>
          <p className="serif-display text-ink text-4xl mt-2">
            {new Set(open.map((o) => o.contact_id).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {(["all", "buyer", "seller"] as const).map((s) => (
          <Link
            key={s}
            href={`/opportunities?side=${s}&view=${view}`}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider border ${
              side === s
                ? "border-indigo bg-indigo text-parchment"
                : "border-mist text-stone hover:text-ink"
            }`}
          >
            {s}
          </Link>
        ))}
        <div className="w-px h-5 bg-mist mx-2" />
        {(["board", "list"] as const).map((v) => (
          <Link
            key={v}
            href={`/opportunities?side=${side}&view=${v}`}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider border ${
              view === v
                ? "border-indigo bg-indigo text-parchment"
                : "border-mist text-stone hover:text-ink"
            }`}
          >
            {v}
          </Link>
        ))}
      </div>

      {/* Board view */}
      {view === "board" && (
        <div className="grid gap-3 overflow-x-auto" style={{ gridTemplateColumns: `repeat(${lanes.length}, minmax(240px, 1fr))` }}>
          {lanes.map((stage) => {
            const rows = byStage(stage);
            const laneValue = rows.reduce((s, o) => s + (o.est_value_usd ?? 0), 0);
            return (
              <div key={stage} className="bg-mist/20 border border-mist min-h-[200px]">
                <div
                  className={`px-3 py-2.5 border-b-2 ${STAGE_BORDER[stage]} bg-parchment`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-ink">
                      {STAGE_LABEL[stage]}
                    </p>
                    <span className="text-[10px] text-stone">{rows.length}</span>
                  </div>
                  {laneValue > 0 && (
                    <p className="text-[10px] text-stone mt-0.5">{formatCurrency(laneValue)}</p>
                  )}
                </div>
                <div className="p-2 space-y-2">
                  {rows.length === 0 && (
                    <p className="text-[10px] text-stone italic text-center py-4">empty</p>
                  )}
                  {rows.map((o) => (
                    <Link
                      key={o.id}
                      href={`/opportunities/${o.id}`}
                      className="block bg-parchment border border-mist p-3 hover:border-indigo transition-colors"
                    >
                      <p className="text-[10px] text-stone uppercase tracking-wider">{o.opp_number}</p>
                      <p className="serif-display text-ink text-base leading-tight mt-1">
                        {o.name}
                      </p>
                      {o.contact?.full_name && (
                        <p className="text-xs text-smoke mt-1">{o.contact.full_name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {o.est_value_usd && (
                          <span className="text-xs text-indigo">
                            {formatCurrency(o.est_value_usd)}
                          </span>
                        )}
                        <Badge tone="neutral">{o.side}</Badge>
                      </div>
                      <p className="text-[10px] text-stone mt-2">
                        moved {fmtDate(o.stage_changed_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="border border-mist bg-parchment">
          <div className="grid grid-cols-[100px_1.6fr_120px_120px_140px_140px_120px] gap-3 px-5 py-3 border-b border-mist text-[10px] tracking-[0.28em] uppercase text-stone">
            <div>OPP #</div>
            <div>Name</div>
            <div>Side</div>
            <div>Stage</div>
            <div className="text-right">Est. value</div>
            <div className="text-right">Probability</div>
            <div className="text-right">Last moved</div>
          </div>
          {opps.length === 0 ? (
            <div className="px-6 py-12 text-center text-stone serif-italic">
              No opportunities yet. Promote a contact to create the first one.
            </div>
          ) : (
            opps.map((o) => (
              <Link
                key={o.id}
                href={`/opportunities/${o.id}`}
                className="grid grid-cols-[100px_1.6fr_120px_120px_140px_140px_120px] gap-3 px-5 py-3 border-b border-mist/40 last:border-0 hover:bg-mist/20 transition-colors items-center text-sm"
              >
                <span className="text-xs text-stone uppercase tracking-wider">{o.opp_number}</span>
                <div>
                  <p className="serif-display text-ink leading-tight">{o.name}</p>
                  {o.contact?.full_name && (
                    <p className="text-xs text-smoke">{o.contact.full_name}</p>
                  )}
                </div>
                <Badge tone="neutral">{o.side}</Badge>
                <Badge tone={o.stage === "won" ? "hot" : o.stage === "lost" ? "cold" : "warm"}>
                  {STAGE_LABEL[o.stage]}
                </Badge>
                <span className="text-right text-indigo">
                  {o.est_value_usd ? formatCurrency(o.est_value_usd) : "—"}
                </span>
                <span className="text-right text-stone">{o.probability ?? "—"}%</span>
                <span className="text-right text-xs text-stone">{fmtDate(o.stage_changed_at)}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
