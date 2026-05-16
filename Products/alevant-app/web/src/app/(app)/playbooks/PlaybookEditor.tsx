"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  StickyNote,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Save,
  Lock,
  Copy,
} from "lucide-react";

const LIFECYCLE_STAGES = [
  "prospect",
  "lead",
  "engaged",
  "client_active",
  "client_past",
  "sphere",
] as const;
const TEMPERATURES = ["Hot", "Warm", "Cold", "Disqualified"] as const;
const CHANNELS = ["call", "sms", "email", "meeting", "note"] as const;

const ICONS = { call: Phone, sms: MessageSquare, email: Mail, meeting: Calendar, note: StickyNote };

interface Step {
  day_offset: number;
  channel: (typeof CHANNELS)[number];
  action: string;
  draft_prompt?: string;
}

export interface Playbook {
  id?: string;
  name: string;
  description: string | null;
  trigger_lifecycle_stages: string[] | null;
  trigger_temperatures: string[] | null;
  steps_json: { steps: Step[] };
  is_system: boolean;
}

const EMPTY: Playbook = {
  name: "",
  description: "",
  trigger_lifecycle_stages: [],
  trigger_temperatures: ["Hot"],
  steps_json: { steps: [{ day_offset: 0, channel: "call", action: "" }] },
  is_system: false,
};

export function PlaybookEditor({ initial, mode }: { initial?: Playbook; mode: "new" | "edit" }) {
  const router = useRouter();
  const [pb, setPb] = useState<Playbook>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocked = pb.is_system;

  function toggleStage(s: string) {
    if (isLocked) return;
    const cur = new Set(pb.trigger_lifecycle_stages ?? []);
    cur.has(s) ? cur.delete(s) : cur.add(s);
    setPb({ ...pb, trigger_lifecycle_stages: Array.from(cur) });
  }
  function toggleTemp(t: string) {
    if (isLocked) return;
    const cur = new Set(pb.trigger_temperatures ?? []);
    cur.has(t) ? cur.delete(t) : cur.add(t);
    setPb({ ...pb, trigger_temperatures: Array.from(cur) });
  }
  function updateStep(i: number, patch: Partial<Step>) {
    if (isLocked) return;
    const steps = pb.steps_json.steps.map((s, j) => (j === i ? { ...s, ...patch } : s));
    setPb({ ...pb, steps_json: { steps } });
  }
  function addStep() {
    if (isLocked) return;
    const last = pb.steps_json.steps[pb.steps_json.steps.length - 1];
    const next: Step = {
      day_offset: (last?.day_offset ?? 0) + 7,
      channel: "email",
      action: "",
    };
    setPb({ ...pb, steps_json: { steps: [...pb.steps_json.steps, next] } });
  }
  function removeStep(i: number) {
    if (isLocked) return;
    setPb({ ...pb, steps_json: { steps: pb.steps_json.steps.filter((_, j) => j !== i) } });
  }
  function moveStep(i: number, dir: -1 | 1) {
    if (isLocked) return;
    const j = i + dir;
    if (j < 0 || j >= pb.steps_json.steps.length) return;
    const steps = pb.steps_json.steps.slice();
    [steps[i], steps[j]] = [steps[j], steps[i]];
    setPb({ ...pb, steps_json: { steps } });
  }

  async function save() {
    if (isLocked) return;
    setSaving(true);
    setError(null);
    try {
      const isCreate = mode === "new" || !pb.id;
      const url = isCreate ? "/api/playbooks" : `/api/playbooks/${pb.id}`;
      const method = isCreate ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: pb.name,
          description: pb.description,
          trigger_lifecycle_stages: pb.trigger_lifecycle_stages,
          trigger_temperatures: pb.trigger_temperatures,
          steps_json: pb.steps_json,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Unknown" }));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      router.push(`/playbooks/${j.playbook.id}/edit`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function clone() {
    if (!pb.id) return;
    const res = await fetch(`/api/playbooks/${pb.id}/clone`, { method: "POST" });
    const j = await res.json();
    if (j.playbook) router.push(`/playbooks/${j.playbook.id}/edit`);
  }

  async function destroy() {
    if (!pb.id || isLocked) return;
    if (!confirm("Delete this playbook? Active runs will continue but no new ones will start.")) return;
    await fetch(`/api/playbooks/${pb.id}`, { method: "DELETE" });
    router.push("/playbooks");
  }

  return (
    <div className="space-y-6">
      {isLocked && (
        <div className="border border-brass bg-brass/5 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-brass" />
            <p className="text-sm text-ink">
              This is a system playbook. Clone it to make a customizable copy.
            </p>
          </div>
          <button
            onClick={clone}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.28em] bg-brass text-parchment hover:opacity-90"
          >
            <Copy className="w-3 h-3" /> Clone to customize
          </button>
        </div>
      )}

      <section className="border border-mist bg-parchment p-5 space-y-4">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.28em] text-stone mb-2">
            Name
          </label>
          <input
            type="text"
            value={pb.name}
            onChange={(e) => setPb({ ...pb, name: e.target.value })}
            disabled={isLocked}
            placeholder="e.g. Miami Beach Hot Investor Cadence"
            className="w-full px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.28em] text-stone mb-2">
            Description
          </label>
          <textarea
            value={pb.description ?? ""}
            onChange={(e) => setPb({ ...pb, description: e.target.value })}
            disabled={isLocked}
            rows={2}
            placeholder="What's this cadence for? When should it fire?"
            className="w-full px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo disabled:opacity-60"
          />
        </div>
      </section>

      <section className="border border-mist bg-parchment p-5">
        <h2 className="text-[10px] uppercase tracking-[0.28em] text-stone mb-3">Triggers</h2>
        <p className="text-xs text-stone mb-4">
          A playbook auto-starts when a contact's lifecycle stage AND temperature both match
          its trigger sets. Both must be non-empty.
        </p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">
              Lifecycle stage
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LIFECYCLE_STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStage(s)}
                  disabled={isLocked}
                  className={`px-2.5 py-1 text-xs uppercase tracking-wider border ${
                    (pb.trigger_lifecycle_stages ?? []).includes(s)
                      ? "bg-indigo text-parchment border-indigo"
                      : "bg-parchment text-stone border-mist hover:border-indigo"
                  } disabled:opacity-60`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">Temperature</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPERATURES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTemp(t)}
                  disabled={isLocked}
                  className={`px-2.5 py-1 text-xs uppercase tracking-wider border ${
                    (pb.trigger_temperatures ?? []).includes(t)
                      ? "bg-indigo text-parchment border-indigo"
                      : "bg-parchment text-stone border-mist hover:border-indigo"
                  } disabled:opacity-60`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border border-mist bg-parchment p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] uppercase tracking-[0.28em] text-stone">Steps</h2>
          {!isLocked && (
            <button
              type="button"
              onClick={addStep}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs uppercase tracking-wider border border-indigo text-indigo hover:bg-indigo hover:text-parchment"
            >
              <Plus className="w-3 h-3" /> Add step
            </button>
          )}
        </div>

        <div className="space-y-3">
          {pb.steps_json.steps.map((step, i) => {
            const Icon = ICONS[step.channel] ?? StickyNote;
            return (
              <div key={i} className="grid grid-cols-[40px_100px_120px_1fr_auto] gap-3 items-start border border-mist/60 p-3">
                <div className="w-9 h-9 grid place-items-center bg-indigo/10 border border-indigo/30 text-indigo">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.28em] text-stone mb-1">
                    Day +
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={step.day_offset}
                    onChange={(e) => updateStep(i, { day_offset: parseInt(e.target.value, 10) || 0 })}
                    disabled={isLocked}
                    className="w-full px-2 py-1 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.28em] text-stone mb-1">
                    Channel
                  </label>
                  <select
                    value={step.channel}
                    onChange={(e) =>
                      updateStep(i, { channel: e.target.value as (typeof CHANNELS)[number] })
                    }
                    disabled={isLocked}
                    className="w-full px-2 py-1 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo disabled:opacity-60"
                  >
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.28em] text-stone mb-1">
                    Action
                  </label>
                  <textarea
                    value={step.action}
                    onChange={(e) => updateStep(i, { action: e.target.value })}
                    disabled={isLocked}
                    rows={2}
                    placeholder="What should the agent do at this step?"
                    className="w-full px-2 py-1 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo disabled:opacity-60"
                  />
                </div>
                {!isLocked && (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveStep(i, -1)}
                      className="p-1 text-stone hover:text-ink disabled:opacity-30"
                      disabled={i === 0}
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(i, 1)}
                      className="p-1 text-stone hover:text-ink disabled:opacity-30"
                      disabled={i === pb.steps_json.steps.length - 1}
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="p-1 text-stone hover:text-hot"
                      aria-label="Remove step"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {error && (
        <div className="border border-hot bg-hot/5 px-4 py-3 text-sm text-hot">{error}</div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-mist">
        {!isLocked && (
          <>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-[0.28em] bg-indigo text-parchment hover:bg-indigo-deep disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {mode === "new" ? "Create playbook" : "Save changes"}
            </button>
            {mode === "edit" && pb.id && (
              <button
                onClick={destroy}
                className="px-5 py-2.5 text-xs uppercase tracking-[0.28em] text-stone hover:text-hot"
              >
                Delete
              </button>
            )}
          </>
        )}
        <button
          onClick={() => router.push("/playbooks")}
          className="px-5 py-2.5 text-xs uppercase tracking-[0.28em] text-stone hover:text-ink"
        >
          Back to list
        </button>
      </div>
    </div>
  );
}
