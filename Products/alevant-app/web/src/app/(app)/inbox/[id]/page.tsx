import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { getSupabaseService } from "@/lib/supabase/server";
import { resolveCurrentWorkspaceId } from "@/app/(app)/_lib/resolve-workspace";
import { bandFromScore, relativeTime } from "@/lib/utils";

interface TranscriptTurn {
  who?: string;
  speaker?: string;
  role?: string;
  txt?: string;
  text?: string;
  message?: string;
}

function normalizeTranscript(t: any): Array<{ who: string; txt: string }> {
  if (!t) return [];
  const arr: TranscriptTurn[] = Array.isArray(t) ? t : Array.isArray((t as any).turns) ? (t as any).turns : [];
  return arr
    .map((turn) => ({
      who: turn.who || turn.speaker || turn.role || "Unknown",
      txt: turn.txt || turn.text || turn.message || "",
    }))
    .filter((turn) => turn.txt);
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspaceId } = await resolveCurrentWorkspaceId();
  const svc = getSupabaseService();

  const [{ data: contact }, { data: convs }, { data: activity }] = await Promise.all([
    svc
      .from("contacts")
      .select("id, full_name, emails, phones, category, relationship_score, source, language, notes, last_touch_at, created_at, metadata")
      .eq("workspace_id", workspaceId)
      .eq("id", id)
      .maybeSingle(),
    svc
      .from("sofia_conversations")
      .select("id, channel, direction, status, transcript, qualification_score, classification, escalated_at, recording_url, duration_seconds, caller_phone, caller_name, started_at, ended_at")
      .eq("workspace_id", workspaceId)
      .eq("contact_id", id)
      .order("started_at", { ascending: false })
      .limit(5),
    svc
      .from("activity_log")
      .select("id, activity_type, summary, outcome, next_action, next_action_type, next_date, source, created_at")
      .eq("workspace_id", workspaceId)
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!contact) notFound();

  const _convs = convs ?? [];
  const _activity = activity ?? [];
  const lastConv = _convs[0];
  const transcript = normalizeTranscript(lastConv?.transcript);
  const score = lastConv?.qualification_score ?? contact.relationship_score ?? 0;
  const band = bandFromScore(score);
  const classification = (lastConv?.classification as Record<string, any>) || {};
  const summaryText: string =
    (classification.summary as string) ||
    _activity[0]?.summary ||
    contact.notes ||
    "";
  const nextAction = _activity.find((a) => a.next_action)?.next_action || classification.next_action || null;
  const intent =
    (classification.intent as string) ||
    (contact.category ? contact.category.replace(/_/g, " ") : "Lead");

  return (
    <div className="px-10 py-12 max-w-5xl">
      <Link href="/inbox" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-stone hover:text-indigo mb-8">
        <ArrowLeft className="w-3 h-3" /> Inbox
      </Link>

      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">
          Lead · {contact.id.slice(0, 8)}
          {lastConv?.started_at && <span className="text-stone"> · {relativeTime(lastConv.started_at)}</span>}
        </p>
        <h1 className="serif-display text-ink text-5xl mb-3">{contact.full_name || "Unnamed lead"}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={band === "hot" ? "hot" : band === "warm" ? "warm" : "cold"}>
            {band.charAt(0).toUpperCase() + band.slice(1)} · {score}
          </Badge>
          {lastConv && (
            <Badge tone="indigo">
              Sofia {lastConv.channel ?? "voice"} · {lastConv.started_at ? relativeTime(lastConv.started_at) : "recent"}
            </Badge>
          )}
          {intent && <Badge tone="brass">{intent}</Badge>}
          {contact.category && <Badge tone="neutral">{contact.category.replace(/_/g, " ")}</Badge>}
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          {summaryText && (
            <div className="border border-mist bg-parchment p-8">
              <p className="eyebrow !text-brass mb-4">{lastConv ? "Sofia call summary" : "Lead summary"}</p>
              <p className="text-base text-smoke leading-relaxed mb-4 whitespace-pre-wrap">{summaryText}</p>
              {nextAction && (
                <p className="text-xs text-stone leading-relaxed">
                  <strong className="text-ink">Next action drafted:</strong> {nextAction}
                </p>
              )}
            </div>
          )}

          {transcript.length > 0 && (
            <div className="border border-mist bg-parchment p-8">
              <p className="eyebrow !text-brass mb-4">Transcript {transcript.length < (Array.isArray(lastConv?.transcript) ? lastConv!.transcript.length : 0) ? "(excerpt)" : ""}</p>
              <div className="space-y-4 text-sm">
                {transcript.map((t, i) => {
                  const isSofia = /sofia/i.test(t.who);
                  return (
                    <div key={i} className={isSofia ? "" : "pl-8"}>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-brass mb-1">{t.who}</p>
                      <p className="text-smoke leading-relaxed">{t.txt}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {_activity.length > 0 && (
            <div className="border border-mist bg-parchment p-8">
              <p className="eyebrow !text-brass mb-4">Activity log</p>
              <ul className="divide-y divide-mist">
                {_activity.map((a) => (
                  <li key={a.id} className="py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-stone">
                        {a.activity_type?.replace(/_/g, " ")} · {a.source ?? "system"}
                      </p>
                      <p className="text-[10px] text-stone">{relativeTime(a.created_at)}</p>
                    </div>
                    {a.summary && <p className="text-sm text-smoke">{a.summary}</p>}
                    {a.next_action && (
                      <p className="text-xs text-indigo mt-1">→ {a.next_action}{a.next_date ? ` (by ${new Date(a.next_date).toLocaleDateString()})` : ""}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!summaryText && transcript.length === 0 && _activity.length === 0 && (
            <div className="border border-mist bg-bone p-12 text-center">
              <p className="serif-display text-ink text-2xl mb-2">No interaction history yet.</p>
              <p className="text-sm text-stone leading-relaxed">
                This contact exists but no Sofia call, activity, or transcript has been logged yet.
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="border border-mist bg-bone p-5">
            <p className="eyebrow !text-brass mb-3">Contact</p>
            <p className="text-sm text-ink mb-1">{contact.full_name}</p>
            {(contact.phones ?? []).map((p: string) => (
              <p key={p} className="text-xs text-smoke">{p}</p>
            ))}
            {(contact.emails ?? []).map((e: string) => (
              <p key={e} className="text-xs text-smoke truncate" title={e}>{e}</p>
            ))}
            {contact.language && <p className="text-xs text-stone mt-3">Language · {contact.language.toUpperCase()}</p>}
            {contact.source && <p className="text-xs text-stone mt-1">Source · {contact.source.replace(/_/g, " ")}</p>}
          </div>

          <div className="border border-mist bg-bone p-5">
            <p className="eyebrow !text-brass mb-3">Actions</p>
            {classification.suggested_next_action && (
              <button className="btn-base w-full bg-indigo text-parchment hover:bg-indigo-deep mb-2">
                {classification.suggested_next_action}
              </button>
            )}
            {nextAction && (
              <button className="btn-base w-full bg-indigo text-parchment hover:bg-indigo-deep mb-2">
                {nextAction.length > 32 ? nextAction.slice(0, 30) + "…" : nextAction}
              </button>
            )}
            <button className="btn-base w-full bg-bone text-ink border border-mist hover:bg-mist mb-2">Send underwrite</button>
            <button className="btn-base w-full bg-bone text-ink border border-mist hover:bg-mist mb-2">Add to pipeline</button>
            {lastConv?.recording_url && (
              <a
                href={lastConv.recording_url}
                target="_blank"
                rel="noreferrer"
                className="btn-base w-full bg-bone text-ink border border-mist hover:bg-mist text-center block"
              >
                Play recording
              </a>
            )}
          </div>

          {contact.notes && (
            <div className="border border-mist bg-bone p-5">
              <p className="eyebrow !text-brass mb-3">Notes</p>
              <p className="text-xs text-smoke whitespace-pre-wrap leading-relaxed">{contact.notes}</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
