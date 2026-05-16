"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  StickyNote,
  Check,
  X,
  Clock,
  Pause,
  Play,
  XCircle,
  Loader2,
  Wand2,
} from "lucide-react";

type Channel = "call" | "sms" | "email" | "meeting" | "note";

interface Step {
  id: string;
  step_index: number;
  step_json: { day_offset: number; channel: Channel; action: string; draft_prompt?: string };
  due_at: string;
  state: "scheduled" | "surfaced" | "completed" | "skipped" | "snoozed" | "aborted";
  completed_at?: string | null;
}

interface Run {
  id: string;
  status: "active" | "paused" | "completed" | "aborted";
  current_step: number;
  started_at: string;
  playbook: { id: string; name: string; description?: string | null };
  steps: Step[];
}

const CHANNEL_ICON: Record<Channel, typeof Phone> = {
  call: Phone,
  sms: MessageSquare,
  email: Mail,
  meeting: Calendar,
  note: StickyNote,
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function dueLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Due today";
  const days = Math.round(ms / 86_400_000);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

export function PlaybookPanel({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyStep, setBusyStep] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [completeBody, setCompleteBody] = useState("");
  const [completeSubject, setCompleteSubject] = useState("");
  const [completeOutcome, setCompleteOutcome] = useState("");
  const [drafting, setDrafting] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/contacts/${contactId}/playbooks`);
    const j = await res.json();
    setRuns(j.runs ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [contactId]);

  async function stepAction(stepId: string, action: "complete" | "skip" | "snooze", extras: any = {}) {
    setBusyStep(stepId);
    try {
      await fetch(`/api/playbook-step-runs/${stepId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...extras }),
      });
      await load();
      router.refresh();
    } finally {
      setBusyStep(null);
      setCompleting(null);
      setCompleteBody("");
      setCompleteSubject("");
      setCompleteOutcome("");
    }
  }

  async function generateDraft(stepId: string) {
    setDrafting(stepId);
    setDraftError(null);
    try {
      const res = await fetch(`/api/playbook-step-runs/${stepId}/draft`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Unknown" }));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      // If they're not already editing, open the editor with the draft
      if (completing !== stepId) setCompleting(stepId);
      setCompleteBody(j.draft ?? "");
      if (j.subject) setCompleteSubject(j.subject);
    } catch (e) {
      setDraftError((e as Error).message);
    } finally {
      setDrafting(null);
    }
  }

  async function runAction(runId: string, action: "pause" | "resume" | "abort") {
    if (action === "abort" && !confirm("Stop this playbook? Pending steps will be aborted.")) return;
    await fetch(`/api/playbook-runs/${runId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  if (loading) {
    return (
      <section className="mb-12">
        <h2 className="serif-display text-ink text-3xl mb-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo" /> Playbook
        </h2>
        <p className="text-sm text-stone">
          <Loader2 className="w-3 h-3 animate-spin inline mr-2" /> Loading…
        </p>
      </section>
    );
  }

  if (runs.length === 0) {
    return (
      <section className="mb-12">
        <h2 className="serif-display text-ink text-3xl mb-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo" /> Playbook
        </h2>
        <p className="text-sm text-stone serif-italic border border-mist bg-parchment p-5">
          No active playbook for this contact. A playbook auto-starts when temperature or
          lifecycle stage changes — set them above to trigger one.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-12 space-y-5">
      <h2 className="serif-display text-ink text-3xl flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-indigo" /> Playbook
      </h2>

      {runs.map((run) => (
        <div key={run.id} className="border border-mist bg-parchment p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div>
              <p className="serif-display text-ink text-2xl">{run.playbook.name}</p>
              <p className="text-xs text-stone mt-1">
                Started {fmtDate(run.started_at)} · {run.steps.length} step
                {run.steps.length === 1 ? "" : "s"} · Status: {run.status}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {run.status === "active" && (
                <button
                  onClick={() => runAction(run.id, "pause")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs uppercase tracking-wider border border-mist text-stone hover:text-ink"
                >
                  <Pause className="w-3 h-3" /> Pause
                </button>
              )}
              {run.status === "paused" && (
                <button
                  onClick={() => runAction(run.id, "resume")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs uppercase tracking-wider border border-indigo text-indigo"
                >
                  <Play className="w-3 h-3" /> Resume
                </button>
              )}
              {run.status !== "completed" && run.status !== "aborted" && (
                <button
                  onClick={() => runAction(run.id, "abort")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs uppercase tracking-wider border border-mist text-stone hover:text-hot hover:border-hot"
                >
                  <XCircle className="w-3 h-3" /> Stop
                </button>
              )}
            </div>
          </div>

          <ol className="space-y-2 mt-3">
            {run.steps.map((step) => {
              const Icon = CHANNEL_ICON[step.step_json.channel] ?? StickyNote;
              const isCurrent = step.state === "surfaced" || step.state === "scheduled";
              const isDone = step.state === "completed";
              const isSkipped = step.state === "skipped" || step.state === "aborted";
              const isSnoozed = step.state === "snoozed";
              const isPastDue = new Date(step.due_at).getTime() < Date.now();

              return (
                <li
                  key={step.id}
                  className={`border ${
                    isCurrent && isPastDue
                      ? "border-indigo bg-indigo/5"
                      : "border-mist/60 bg-parchment"
                  } p-3`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 grid place-items-center shrink-0 border ${
                        isDone
                          ? "bg-indigo border-indigo text-parchment"
                          : isSkipped
                          ? "border-mist text-stone"
                          : isSnoozed
                          ? "border-brass text-brass"
                          : "border-mist text-stone"
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] uppercase tracking-[0.28em] text-stone">
                          Step {step.step_index + 1} · {step.step_json.channel}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-stone">
                          ·{" "}
                          {isDone
                            ? `done ${fmtDate(step.completed_at ?? step.due_at)}`
                            : isSkipped
                            ? "skipped"
                            : isSnoozed
                            ? `snoozed until ${fmtDate(step.due_at)}`
                            : dueLabel(step.due_at)}
                        </span>
                      </div>
                      <p className="text-sm text-ink leading-snug">{step.step_json.action}</p>

                      {isCurrent && completing === step.id && (
                        <div className="mt-3 space-y-2">
                          {step.step_json.channel === "email" && (
                            <input
                              type="text"
                              value={completeSubject}
                              onChange={(e) => setCompleteSubject(e.target.value)}
                              placeholder="Subject line"
                              className="w-full px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo"
                            />
                          )}
                          <textarea
                            value={completeBody}
                            onChange={(e) => setCompleteBody(e.target.value)}
                            placeholder="What happened? (optional)"
                            rows={5}
                            className="w-full px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo"
                          />
                          {step.step_json.channel === "call" && (
                            <select
                              value={completeOutcome}
                              onChange={(e) => setCompleteOutcome(e.target.value)}
                              className="px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo"
                            >
                              <option value="">Outcome…</option>
                              <option value="connected">Connected</option>
                              <option value="voicemail">Voicemail</option>
                              <option value="no_answer">No answer</option>
                            </select>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => generateDraft(step.id)}
                              disabled={drafting === step.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.28em] border border-indigo text-indigo hover:bg-indigo hover:text-parchment disabled:opacity-60"
                            >
                              {drafting === step.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Wand2 className="w-3 h-3" />
                              )}
                              {completeBody ? "Regenerate" : "Generate draft"}
                            </button>
                            <button
                              onClick={() =>
                                stepAction(step.id, "complete", {
                                  log_activity: true,
                                  subject: completeSubject || undefined,
                                  body: completeBody || undefined,
                                  outcome: completeOutcome || undefined,
                                })
                              }
                              disabled={busyStep === step.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.28em] bg-indigo text-parchment hover:bg-indigo-deep disabled:opacity-60"
                            >
                              {busyStep === step.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Save & complete
                            </button>
                            <button
                              onClick={() => {
                                setCompleting(null);
                                setCompleteBody("");
                                setCompleteSubject("");
                                setCompleteOutcome("");
                                setDraftError(null);
                              }}
                              className="text-xs uppercase tracking-[0.28em] text-stone hover:text-ink"
                            >
                              Cancel
                            </button>
                          </div>
                          {draftError && (
                            <p className="text-xs text-hot mt-1">Draft failed: {draftError}</p>
                          )}
                        </div>
                      )}

                      {isCurrent && completing !== step.id && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <button
                            onClick={() => setCompleting(step.id)}
                            disabled={busyStep === step.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs uppercase tracking-wider border border-indigo text-indigo hover:bg-indigo hover:text-parchment"
                          >
                            <Check className="w-3 h-3" /> Done
                          </button>
                          <button
                            onClick={() => generateDraft(step.id)}
                            disabled={drafting === step.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs uppercase tracking-wider border border-mist text-indigo hover:border-indigo"
                          >
                            {drafting === step.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Wand2 className="w-3 h-3" />
                            )}
                            Generate draft
                          </button>
                          <button
                            onClick={() => stepAction(step.id, "snooze", { snooze_days: 3 })}
                            disabled={busyStep === step.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs uppercase tracking-wider border border-mist text-stone hover:text-ink"
                          >
                            <Clock className="w-3 h-3" /> Snooze 3d
                          </button>
                          <button
                            onClick={() => stepAction(step.id, "skip")}
                            disabled={busyStep === step.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs uppercase tracking-wider border border-mist text-stone hover:text-hot hover:border-hot"
                          >
                            <X className="w-3 h-3" /> Skip
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}
