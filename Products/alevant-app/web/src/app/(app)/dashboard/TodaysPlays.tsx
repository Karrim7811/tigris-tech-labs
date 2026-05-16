"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  StickyNote,
  Check,
  Clock,
  X,
  Loader2,
} from "lucide-react";

interface Play {
  id: string;
  step_index: number;
  step_json: { day_offset: number; channel: string; action: string };
  due_at: string;
  state: string;
  contact: {
    id: string;
    full_name: string | null;
    temperature: string | null;
    priority: string | null;
  } | null;
  playbook_run: { id: string; status: string; playbook: { id: string; name: string } } | null;
}

const ICONS: Record<string, typeof Phone> = {
  call: Phone,
  sms: MessageSquare,
  email: Mail,
  meeting: Calendar,
  note: StickyNote,
};

export function TodaysPlays() {
  const [plays, setPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/playbooks/today");
    const j = await res.json();
    setPlays(j.plays ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(stepId: string, action: "complete" | "skip" | "snooze") {
    setBusy(stepId);
    try {
      await fetch(`/api/playbook-step-runs/${stepId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          action === "snooze"
            ? { action, snooze_days: 1 }
            : { action, log_activity: action === "complete" }
        ),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <section className="mb-10">
        <h2 className="serif-display text-ink text-3xl mb-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo" /> Today's plays
        </h2>
        <p className="text-sm text-stone">
          <Loader2 className="w-3 h-3 animate-spin inline mr-2" /> Loading…
        </p>
      </section>
    );
  }

  if (plays.length === 0) {
    return (
      <section className="mb-10">
        <h2 className="serif-display text-ink text-3xl mb-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo" /> Today's plays
        </h2>
        <p className="text-sm text-stone serif-italic border border-mist bg-parchment p-5">
          Nothing due. Playbooks auto-start when a contact's temperature or stage changes.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="serif-display text-ink text-3xl flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo" /> Today's plays
        </h2>
        <Link
          href="/playbooks"
          className="text-xs uppercase tracking-[0.28em] text-stone hover:text-indigo"
        >
          Manage playbooks
        </Link>
      </div>

      <div className="border border-mist bg-parchment">
        {plays.map((p) => {
          const Icon = ICONS[p.step_json.channel] ?? StickyNote;
          return (
            <div
              key={p.id}
              className="grid grid-cols-[40px_1.4fr_1fr_auto] gap-4 items-center px-5 py-3 border-b border-mist/40 last:border-0"
            >
              <div className="w-9 h-9 grid place-items-center bg-indigo/10 border border-indigo/40 text-indigo">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone">
                  {p.step_json.channel} · {p.playbook_run?.playbook.name}
                </p>
                <p className="serif-display text-ink text-lg leading-tight mt-0.5">
                  {p.step_json.action}
                </p>
              </div>
              <div>
                {p.contact && (
                  <Link
                    href={`/contacts/${p.contact.id}`}
                    className="text-sm text-ink hover:text-indigo"
                  >
                    {p.contact.full_name ?? "Unnamed"}
                  </Link>
                )}
                {p.contact?.temperature && (
                  <span className="block text-[10px] uppercase tracking-wider text-stone mt-0.5">
                    {p.contact.temperature} · {p.contact.priority ?? "Medium"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => act(p.id, "complete")}
                  disabled={busy === p.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs uppercase tracking-wider border border-indigo text-indigo hover:bg-indigo hover:text-parchment disabled:opacity-60"
                >
                  {busy === p.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}{" "}
                  Done
                </button>
                <button
                  onClick={() => act(p.id, "snooze")}
                  disabled={busy === p.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs uppercase tracking-wider border border-mist text-stone hover:text-ink"
                >
                  <Clock className="w-3 h-3" /> 1d
                </button>
                <button
                  onClick={() => act(p.id, "skip")}
                  disabled={busy === p.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs uppercase tracking-wider border border-mist text-stone hover:text-hot hover:border-hot"
                >
                  <X className="w-3 h-3" /> Skip
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
