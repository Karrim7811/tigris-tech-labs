import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Calendar, Flame, Home, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ResearchPanel } from "./ResearchPanel";
import { ContactEditPanel } from "./ContactEditPanel";
import { ActivityTimeline } from "./ActivityTimeline";
import { MoveToOppButton } from "./MoveToOppButton";
import { PlaybookPanel } from "./PlaybookPanel";

export const dynamic = "force-dynamic";

async function loadContact(id: string) {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return null;

  const [{ data: contact }, { data: gridSignals }, { data: sphereSignals }, { data: buyers }, { data: listings }] =
    await Promise.all([
      svc.from("contacts").select("*").eq("id", id).eq("workspace_id", ws.id).maybeSingle(),
      svc
        .from("grid_signals")
        .select("id, property_address, motivation_score, hazard_90d, band, reasons_summary, refreshed_at")
        .eq("contact_id", id),
      svc
        .from("sphere_signals")
        .select("*")
        .eq("contact_id", id)
        .order("detected_at", { ascending: false }),
      svc.from("buyers").select("*").eq("contact_id", id),
      svc.from("listings").select("*").eq("seller_contact_id", id),
    ]);

  if (!contact) return null;
  return {
    contact,
    gridSignals: gridSignals ?? [],
    sphereSignals: sphereSignals ?? [],
    buyers: buyers ?? [],
    listings: listings ?? [],
  };
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

export default async function ContactDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const data = await loadContact(id);
  if (!data) return notFound();
  const { contact, gridSignals, sphereSignals, buyers, listings } = data;

  return (
    <div className="px-10 py-12 max-w-6xl">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-stone hover:text-ink mb-8"
      >
        <ArrowLeft className="w-3 h-3" /> Back to contacts
      </Link>

      <header className="mb-10 flex items-start justify-between gap-8">
        <div>
          <p className="eyebrow !text-indigo mb-2">{contact.prospect_source ?? "Contact"}</p>
          <h1 className="serif-display text-ink text-6xl leading-none">
            {contact.full_name ?? "Unnamed"}
          </h1>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <Badge tone="warm">{contact.lifecycle_stage ?? "prospect"}</Badge>
            <Badge tone="neutral">{contact.category ?? "lead"}</Badge>
            {contact.temperature && (
              <Badge tone={contact.temperature === "Hot" ? "hot" : contact.temperature === "Warm" ? "warm" : "cold"}>
                {contact.temperature}
              </Badge>
            )}
            {contact.priority && (
              <Badge tone={contact.priority === "High" ? "hot" : contact.priority === "Medium" ? "warm" : "neutral"}>
                {contact.priority} priority
              </Badge>
            )}
          </div>
          <div className="mt-4">
            <MoveToOppButton contactId={contact.id} contactName={contact.full_name ?? "this contact"} />
          </div>
        </div>
        <div className="text-right">
          <p className="serif-display text-ink text-6xl leading-none">{contact.relationship_score ?? 0}</p>
          <p className="text-xs uppercase tracking-[0.28em] text-stone mt-2">Relationship score</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6 mb-12">
        <div className="border border-mist bg-parchment p-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">Email</p>
          <div className="space-y-1">
            {(contact.emails ?? []).length === 0 && <p className="text-sm text-stone">—</p>}
            {(contact.emails ?? []).map((e: string) => (
              <p key={e} className="text-sm text-ink flex items-center gap-2">
                <Mail className="w-3 h-3 text-stone" /> {e}
              </p>
            ))}
          </div>
        </div>
        <div className="border border-mist bg-parchment p-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">Phone</p>
          <div className="space-y-1">
            {(contact.phones ?? []).length === 0 && <p className="text-sm text-stone">—</p>}
            {(contact.phones ?? []).map((p: string) => (
              <p key={p} className="text-sm text-ink flex items-center gap-2">
                <Phone className="w-3 h-3 text-stone" /> {p}
              </p>
            ))}
          </div>
        </div>
        <div className="border border-mist bg-parchment p-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">Last touch</p>
          <p className="text-sm text-ink flex items-center gap-2">
            <Calendar className="w-3 h-3 text-stone" /> {fmtDate(contact.last_touch_at)}
          </p>
          <p className="text-xs text-stone mt-2">Created {fmtDate(contact.created_at)}</p>
        </div>
      </div>

      {contact.notes && (
        <section className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-3">Notes</p>
          <p className="serif-italic text-stone text-base leading-relaxed border-l-2 border-indigo pl-4 max-w-3xl">
            {contact.notes}
          </p>
        </section>
      )}

      <ContactEditPanel contact={contact} />

      <PlaybookPanel contactId={contact.id} />

      <ActivityTimeline contactId={contact.id} />

      <ResearchPanel
        contactId={contact.id}
        contactName={contact.full_name ?? "this contact"}
        contactCity={contact.metadata?.city ?? "Miami"}
      />

      <section className="mb-12">
        <h2 className="serif-display text-ink text-3xl mb-4 flex items-center gap-3">
          <Flame className="w-5 h-5 text-indigo" /> Grid signals
        </h2>
        {gridSignals.length === 0 ? (
          <p className="text-sm text-stone serif-italic">No Grid signals linked to this contact.</p>
        ) : (
          <div className="border border-mist bg-parchment">
            {gridSignals.map((g: any) => (
              <div
                key={g.id}
                className="grid grid-cols-[1fr_120px_120px] gap-4 px-6 py-4 border-b border-mist/40 last:border-0 items-center"
              >
                <div>
                  <p className="serif-display text-ink text-lg">{g.property_address}</p>
                  <p className="text-xs text-smoke mt-1">{g.reasons_summary}</p>
                </div>
                <div className="text-right">
                  <p className="serif-display text-ink text-2xl">{g.motivation_score}</p>
                  <p className="text-[10px] uppercase tracking-wider text-stone">motivation</p>
                </div>
                <div className="text-right text-xs text-stone">
                  <Badge tone={g.band === "blazing" || g.band === "hot" ? "hot" : "warm"}>
                    {g.band ?? "watch"}
                  </Badge>
                  <p className="mt-2">{fmtDate(g.refreshed_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="serif-display text-ink text-3xl mb-4 flex items-center gap-3">
          <Home className="w-5 h-5 text-indigo" /> Pipelines
        </h2>
        {buyers.length === 0 && listings.length === 0 ? (
          <p className="text-sm text-stone serif-italic">Not currently in any pipeline.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {buyers.map((b: any) => (
              <div key={b.id} className="border border-mist bg-parchment p-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">Buyer · {b.stage}</p>
                <p className="serif-display text-ink text-xl">
                  {b.budget_min ? formatCurrency(b.budget_min) : "—"} – {b.budget_max ? formatCurrency(b.budget_max) : "—"}
                </p>
                <p className="text-xs text-stone mt-2">{b.preapproval_status ?? "no preapproval"}</p>
              </div>
            ))}
            {listings.map((l: any) => (
              <div key={l.id} className="border border-mist bg-parchment p-5">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">Seller · {l.status}</p>
                <p className="serif-display text-ink text-xl">{l.address}</p>
                <p className="text-xs text-stone mt-2">{l.price ? formatCurrency(l.price) : "—"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="serif-display text-ink text-3xl mb-4 flex items-center gap-3">
          <FileText className="w-5 h-5 text-indigo" /> Sphere activity
        </h2>
        {sphereSignals.length === 0 ? (
          <p className="text-sm text-stone serif-italic">No sphere signals.</p>
        ) : (
          <div className="border-l-2 border-mist pl-6 space-y-5">
            {sphereSignals.map((s: any) => (
              <div key={s.id} className="relative">
                <span className="absolute -left-[31px] w-3 h-3 rounded-full bg-indigo border-2 border-parchment top-1" />
                <p className="text-xs uppercase tracking-[0.28em] text-stone">{fmtDate(s.detected_at)}</p>
                <p className="text-sm text-ink mt-1">
                  <strong>{s.signal_type}</strong> · confidence {s.confidence ?? "—"}
                </p>
                {s.signal_data && (
                  <pre className="text-xs text-smoke mt-1 whitespace-pre-wrap">
                    {JSON.stringify(s.signal_data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
