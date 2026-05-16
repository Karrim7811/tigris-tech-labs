import Link from "next/link";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Plus, Upload } from "lucide-react";

export const dynamic = "force-dynamic";

interface ContactRow {
  id: string;
  full_name: string | null;
  emails: string[] | null;
  phones: string[] | null;
  category: string | null;
  lifecycle_stage: string | null;
  temperature: string | null;
  priority: string | null;
  tags: string[] | null;
  relationship_score: number | null;
  prospect_source: string | null;
  last_touch_at: string | null;
  buyer_deals: number | null;
  seller_listings: number | null;
  linked_grid_signals: number | null;
  open_sphere_signals: number | null;
  open_opportunities: number | null;
}

type Filter = "all" | "prospect" | "lead" | "engaged" | "client_active" | "client_past" | "sphere";

async function loadContacts(
  filter: Filter,
  search: string,
  temp: string | null,
  prio: string | null
): Promise<ContactRow[]> {
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
    .from("vw_contacts_unified")
    .select("*")
    .eq("workspace_id", ws.id)
    .order("last_touch_at", { ascending: false, nullsFirst: false })
    .limit(300);
  if (filter !== "all") q = q.eq("lifecycle_stage", filter);
  if (search) q = q.ilike("full_name", `%${search}%`);
  if (temp) q = q.eq("temperature", temp);
  if (prio) q = q.eq("priority", prio);
  const { data } = await q;
  return (data ?? []) as ContactRow[];
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

const STAGE_TONE: Record<string, "hot" | "warm" | "cold" | "neutral"> = {
  prospect: "warm",
  lead: "warm",
  engaged: "hot",
  client_active: "hot",
  client_past: "neutral",
  sphere: "neutral",
  do_not_contact: "cold",
};

export default async function ContactsPage(props: {
  searchParams: Promise<{ stage?: string; q?: string; temp?: string; prio?: string }>;
}) {
  const sp = await props.searchParams;
  const filter = (sp.stage ?? "all") as Filter;
  const search = sp.q ?? "";
  const temp = sp.temp ?? null;
  const prio = sp.prio ?? null;
  const rows = await loadContacts(filter, search, temp, prio);

  function buildHref(overrides: Partial<{ stage: string; temp: string | null; prio: string | null }>) {
    const next = new URLSearchParams();
    next.set("stage", overrides.stage ?? filter);
    if (search) next.set("q", search);
    const t = overrides.temp === undefined ? temp : overrides.temp;
    if (t) next.set("temp", t);
    const p = overrides.prio === undefined ? prio : overrides.prio;
    if (p) next.set("prio", p);
    return `/contacts?${next.toString()}`;
  }

  const stages: Array<{ value: Filter; label: string }> = [
    { value: "all", label: "All" },
    { value: "prospect", label: "Prospects" },
    { value: "lead", label: "Leads" },
    { value: "engaged", label: "Engaged" },
    { value: "client_active", label: "Active clients" },
    { value: "client_past", label: "Past clients" },
    { value: "sphere", label: "Sphere" },
  ];

  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="mb-8 flex items-start justify-between gap-8">
        <div>
          <p className="eyebrow !text-indigo mb-2">Contacts</p>
          <h1 className="serif-display text-ink text-5xl">Everyone in your world.</h1>
          <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
            Every person across the Grid, the Inbox, the Sphere, and your pipelines — one filterable, searchable list. Buyers, sellers, sphere members, and predicted prospects all live here.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 shrink-0">
          <Link
            href="/contacts/import"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.28em] border border-mist text-ink hover:border-indigo hover:text-indigo transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </Link>
          <Link
            href="/contacts/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.28em] bg-indigo text-parchment hover:bg-indigo-deep transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Contact
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {stages.map((s) => (
            <Link
              key={s.value}
              href={buildHref({ stage: s.value })}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider border ${
                filter === s.value
                  ? "border-indigo bg-indigo text-parchment"
                  : "border-mist text-stone hover:text-ink"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
        <form action="/contacts" className="flex items-center gap-2">
          <input type="hidden" name="stage" value={filter} />
          {temp && <input type="hidden" name="temp" value={temp} />}
          {prio && <input type="hidden" name="prio" value={prio} />}
          <div className="flex items-center border border-mist bg-parchment px-2">
            <Search className="w-4 h-4 text-stone" />
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search by name…"
              className="bg-transparent px-2 py-1.5 text-sm focus:outline-none w-56"
            />
          </div>
        </form>
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
        {(temp || prio) && (
          <Link href={buildHref({ temp: null, prio: null })} className="text-indigo hover:underline">
            Clear filters
          </Link>
        )}
      </div>

      <div className="border border-mist bg-parchment">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_120px_120px] gap-4 px-6 py-3 border-b border-mist text-[10px] tracking-[0.28em] uppercase text-stone">
          <div>Name</div>
          <div>Stage</div>
          <div>Source</div>
          <div>Tags</div>
          <div className="text-right">Score</div>
          <div className="text-right">Last touch</div>
        </div>
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="serif-italic">No contacts match that filter.</p>
          </div>
        ) : (
          rows.map((c) => (
            <Link
              key={c.id}
              href={`/contacts/${c.id}`}
              className="grid grid-cols-[1.6fr_1fr_1fr_1fr_120px_120px] gap-4 px-6 py-4 border-b border-mist/40 last:border-0 hover:bg-mist/20 transition-colors items-center"
            >
              <div>
                <p className="serif-display text-ink text-lg leading-tight">
                  {c.full_name ?? c.emails?.[0] ?? c.phones?.[0] ?? "Unnamed"}
                </p>
                <p className="text-xs text-smoke mt-1">
                  {[c.emails?.[0], c.phones?.[0]].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <div>
                <Badge tone={STAGE_TONE[c.lifecycle_stage ?? "prospect"] ?? "neutral"}>
                  {c.lifecycle_stage ?? "prospect"}
                </Badge>
                <p className="text-[10px] text-stone mt-1 uppercase tracking-wider">
                  {[c.linked_grid_signals && `${c.linked_grid_signals} grid`, c.buyer_deals && `${c.buyer_deals} buyer`, c.seller_listings && `${c.seller_listings} listing`, c.open_sphere_signals && `${c.open_sphere_signals} sphere`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="text-sm text-smoke uppercase tracking-wider text-xs">
                {c.prospect_source ?? "—"}
              </div>
              <div className="flex flex-wrap gap-1">
                {(c.tags ?? []).slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 border border-mist text-stone"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="text-right">
                <span className="serif-display text-ink text-2xl">{c.relationship_score ?? 0}</span>
              </div>
              <div className="text-right text-xs text-stone">{fmtDate(c.last_touch_at)}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
