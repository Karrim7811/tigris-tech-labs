import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, DollarSign, MapPin, User } from "lucide-react";
import { STAGE_LABEL, type OppStage } from "@/lib/opp-stages";
import { formatCurrency } from "@/lib/utils";
import { StagePicker } from "./StagePicker";

export const dynamic = "force-dynamic";

async function load(id: string) {
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

  const [{ data: opp }, { data: history }, { data: activities }] = await Promise.all([
    svc
      .from("opportunities")
      .select("*, contact:contacts(id, full_name, emails, phones, temperature, priority, lifecycle_stage)")
      .eq("id", id)
      .eq("workspace_id", ws.id)
      .maybeSingle(),
    svc
      .from("opportunity_stage_history")
      .select("*")
      .eq("opportunity_id", id)
      .order("changed_at", { ascending: false }),
    svc
      .from("contact_activities")
      .select("*")
      .eq("opportunity_id", id)
      .order("occurred_at", { ascending: false })
      .limit(50),
  ]);
  if (!opp) return null;
  return { opp, history: history ?? [], activities: activities ?? [] };
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function OpportunityDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const data = await load(id);
  if (!data) return notFound();
  const { opp, history, activities } = data;

  return (
    <div className="px-10 py-12 max-w-5xl">
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-stone hover:text-ink mb-8"
      >
        <ArrowLeft className="w-3 h-3" /> All opportunities
      </Link>

      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">{opp.opp_number}</p>
        <h1 className="serif-display text-ink text-5xl leading-tight">{opp.name}</h1>
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <Badge tone={opp.stage === "won" ? "hot" : opp.stage === "lost" ? "cold" : "warm"}>
            {STAGE_LABEL[opp.stage as OppStage]}
          </Badge>
          <Badge tone="neutral">{opp.side}</Badge>
          <span className="text-xs text-stone uppercase tracking-wider">
            Probability {opp.probability ?? "—"}%
          </span>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="border border-mist bg-parchment p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-1 flex items-center gap-1.5">
            <DollarSign className="w-3 h-3" /> Estimated value
          </p>
          <p className="serif-display text-ink text-3xl">
            {opp.est_value_usd ? formatCurrency(opp.est_value_usd) : "—"}
          </p>
          {opp.est_commission_usd && (
            <p className="text-xs text-stone mt-1">
              est. commission {formatCurrency(opp.est_commission_usd)}
            </p>
          )}
        </div>
        <div className="border border-mist bg-parchment p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-1 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Expected close
          </p>
          <p className="serif-display text-ink text-3xl">{fmtDate(opp.expected_close)}</p>
        </div>
        <div className="border border-mist bg-parchment p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-1 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Opened
          </p>
          <p className="serif-display text-ink text-3xl">{fmtDate(opp.opened_at)}</p>
        </div>
      </div>

      {/* Stage move + contact link */}
      <section className="border border-mist bg-parchment p-5 mb-10">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-3">Move stage</p>
            <StagePicker
              opportunityId={opp.id}
              side={opp.side}
              currentStage={opp.stage as OppStage}
            />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-3 flex items-center gap-1.5">
              <User className="w-3 h-3" /> Contact
            </p>
            {opp.contact ? (
              <Link
                href={`/contacts/${opp.contact.id}`}
                className="block hover:bg-mist/20 -m-2 p-2 transition-colors"
              >
                <p className="serif-display text-ink text-xl">{opp.contact.full_name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {opp.contact.temperature && (
                    <Badge
                      tone={
                        opp.contact.temperature === "Hot"
                          ? "hot"
                          : opp.contact.temperature === "Warm"
                          ? "warm"
                          : "cold"
                      }
                    >
                      {opp.contact.temperature}
                    </Badge>
                  )}
                  {opp.contact.lifecycle_stage && (
                    <span className="text-xs text-stone uppercase tracking-wider">
                      {opp.contact.lifecycle_stage}
                    </span>
                  )}
                </div>
                {opp.contact.emails?.[0] && (
                  <p className="text-xs text-smoke mt-1">{opp.contact.emails[0]}</p>
                )}
              </Link>
            ) : (
              <p className="text-sm text-stone serif-italic">No contact linked</p>
            )}
          </div>
        </div>

        {opp.property_address && (
          <div className="mt-5 pt-5 border-t border-mist">
            <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Property
            </p>
            <p className="serif-display text-ink text-xl">{opp.property_address}</p>
          </div>
        )}

        {opp.notes && (
          <div className="mt-5 pt-5 border-t border-mist">
            <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">Notes</p>
            <p className="text-sm text-smoke whitespace-pre-wrap leading-relaxed">{opp.notes}</p>
          </div>
        )}
      </section>

      {/* Stage history */}
      <section className="mb-10">
        <h2 className="serif-display text-ink text-3xl mb-4">Stage history</h2>
        <div className="border-l-2 border-mist pl-6 space-y-4">
          {history.map((h) => (
            <div key={h.id} className="relative">
              <span className="absolute -left-[31px] w-3 h-3 rounded-full bg-indigo border-2 border-parchment top-1" />
              <p className="text-xs uppercase tracking-[0.28em] text-stone">
                {fmtDate(h.changed_at)}
              </p>
              <p className="text-sm text-ink mt-1">
                {h.from_stage ? (
                  <>
                    <strong>{STAGE_LABEL[h.from_stage as OppStage]}</strong> →{" "}
                    <strong>{STAGE_LABEL[h.to_stage as OppStage]}</strong>
                  </>
                ) : (
                  <strong>Created at {STAGE_LABEL[h.to_stage as OppStage]}</strong>
                )}
              </p>
              {h.notes && <p className="text-xs text-smoke mt-1">{h.notes}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Recent activities */}
      {activities.length > 0 && (
        <section>
          <h2 className="serif-display text-ink text-3xl mb-4">Recent activity</h2>
          <div className="border border-mist bg-parchment">
            {activities.map((a) => (
              <div
                key={a.id}
                className="px-5 py-3 border-b border-mist/40 last:border-0 text-sm"
              >
                <div className="flex items-center gap-2 text-xs text-stone uppercase tracking-wider mb-1">
                  <span>{a.kind.replace(/_/g, " ")}</span>
                  <span>·</span>
                  <span>{fmtDate(a.occurred_at)}</span>
                </div>
                {a.subject && <p className="text-ink font-medium">{a.subject}</p>}
                {a.body && <p className="text-smoke">{a.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
