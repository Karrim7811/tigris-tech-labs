"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  MessageSquare,
  Phone,
  StickyNote,
  Calendar,
  Linkedin,
  Loader2,
  Plus,
  Send,
  Cog,
} from "lucide-react";

type Kind =
  | "email_sent"
  | "email_received"
  | "sms_sent"
  | "sms_received"
  | "call_outbound"
  | "call_inbound"
  | "call_missed"
  | "meeting"
  | "linkedin_dm"
  | "note"
  | "task_completed"
  | "system_event";

interface Activity {
  id: string;
  kind: Kind;
  channel?: string | null;
  direction?: "inbound" | "outbound" | "internal" | null;
  subject?: string | null;
  body?: string | null;
  duration_seconds?: number | null;
  outcome?: string | null;
  occurred_at: string;
  logged_by_system?: string | null;
}

const KIND_META: Record<
  Kind,
  { icon: typeof Mail; label: string; tone: string }
> = {
  email_sent: { icon: Mail, label: "Email sent", tone: "text-indigo" },
  email_received: { icon: Mail, label: "Email received", tone: "text-brass" },
  sms_sent: { icon: MessageSquare, label: "Text sent", tone: "text-indigo" },
  sms_received: { icon: MessageSquare, label: "Text received", tone: "text-brass" },
  call_outbound: { icon: Phone, label: "Call out", tone: "text-indigo" },
  call_inbound: { icon: Phone, label: "Call in", tone: "text-brass" },
  call_missed: { icon: Phone, label: "Missed call", tone: "text-hot" },
  meeting: { icon: Calendar, label: "Meeting", tone: "text-ink" },
  linkedin_dm: { icon: Linkedin, label: "LinkedIn DM", tone: "text-indigo" },
  note: { icon: StickyNote, label: "Note", tone: "text-stone" },
  task_completed: { icon: Plus, label: "Task done", tone: "text-stone" },
  system_event: { icon: Cog, label: "System", tone: "text-stone" },
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtDuration(sec: number | null | undefined): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ActivityTimeline({ contactId }: { contactId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickLog, setShowQuickLog] = useState<Kind | null>(null);
  const [form, setForm] = useState({ subject: "", body: "", duration: "", outcome: "" });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/contacts/${contactId}/activities`);
    const j = await res.json();
    setActivities(j.activities ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [contactId]);

  async function submitQuickLog() {
    if (!showQuickLog) return;
    setSubmitting(true);
    try {
      await fetch(`/api/contacts/${contactId}/activities`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: showQuickLog,
          subject: form.subject || null,
          body: form.body || null,
          duration_seconds: form.duration ? parseInt(form.duration, 10) * 60 : null,
          outcome: form.outcome || null,
        }),
      });
      setShowQuickLog(null);
      setForm({ subject: "", body: "", duration: "", outcome: "" });
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="serif-display text-ink text-3xl flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-indigo" /> Communications
        </h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { k: "call_outbound" as Kind, icon: Phone, label: "Log call" },
              { k: "email_sent" as Kind, icon: Mail, label: "Log email" },
              { k: "sms_sent" as Kind, icon: MessageSquare, label: "Log text" },
              { k: "meeting" as Kind, icon: Calendar, label: "Log meeting" },
              { k: "note" as Kind, icon: StickyNote, label: "Add note" },
            ] as const
          ).map(({ k, icon: Icon, label }) => (
            <button
              key={k}
              onClick={() => setShowQuickLog(k)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs uppercase tracking-wider border border-mist text-stone hover:text-indigo hover:border-indigo"
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick-log form */}
      {showQuickLog && (
        <div className="border border-indigo bg-indigo/5 p-5 mb-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-indigo mb-3">
            {KIND_META[showQuickLog].label}
          </p>
          <div className="space-y-2">
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder={
                showQuickLog === "call_outbound" || showQuickLog === "call_inbound"
                  ? "Topic / purpose"
                  : showQuickLog === "email_sent"
                  ? "Subject line"
                  : "Title"
              }
              className="w-full px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo"
            />
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="What happened, what's next…"
              rows={4}
              className="w-full px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo"
            />
            {(showQuickLog === "call_outbound" ||
              showQuickLog === "call_inbound" ||
              showQuickLog === "call_missed") && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="Duration (minutes)"
                  className="px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo"
                />
                <select
                  value={form.outcome}
                  onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                  className="px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo"
                >
                  <option value="">Outcome…</option>
                  <option value="connected">Connected</option>
                  <option value="voicemail">Left voicemail</option>
                  <option value="no_answer">No answer</option>
                  <option value="follow_up">Needs follow-up</option>
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={submitQuickLog}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.28em] bg-indigo text-parchment hover:bg-indigo-deep disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Save
              </button>
              <button
                onClick={() => {
                  setShowQuickLog(null);
                  setForm({ subject: "", body: "", duration: "", outcome: "" });
                }}
                className="text-xs uppercase tracking-[0.28em] text-stone hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="text-stone text-sm">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading timeline…
        </div>
      ) : activities.length === 0 ? (
        <div className="border border-mist bg-parchment p-6 text-stone serif-italic">
          No activity yet. Log a call, email, or note above to start the timeline.
        </div>
      ) : (
        <div className="border-l-2 border-mist pl-6 space-y-4">
          {activities.map((a) => {
            const meta = KIND_META[a.kind];
            const Icon = meta.icon;
            return (
              <div key={a.id} className="relative">
                <span
                  className={`absolute -left-[33px] top-1 w-4 h-4 grid place-items-center rounded-full bg-parchment border-2 border-mist ${meta.tone}`}
                >
                  <Icon className="w-2.5 h-2.5" />
                </span>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-xs uppercase tracking-[0.28em] ${meta.tone}`}>
                    {meta.label}
                    {a.channel && a.channel !== "manual" && (
                      <span className="text-stone normal-case tracking-normal text-[10px] ml-2">
                        via {a.channel}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-stone">{fmtDate(a.occurred_at)}</span>
                  {a.duration_seconds != null && (
                    <span className="text-xs text-stone">· {fmtDuration(a.duration_seconds)}</span>
                  )}
                  {a.outcome && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-mist/40 text-stone">
                      {a.outcome}
                    </span>
                  )}
                  {a.logged_by_system && a.logged_by_system !== "manual" && (
                    <span className="text-[10px] uppercase tracking-wider text-stone">
                      auto-logged
                    </span>
                  )}
                </div>
                {a.subject && <p className="text-sm text-ink font-medium">{a.subject}</p>}
                {a.body && (
                  <p className="text-sm text-smoke leading-relaxed whitespace-pre-wrap mt-1">
                    {a.body}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
