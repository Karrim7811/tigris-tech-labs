"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Pencil } from "lucide-react";

type Temperature = "Hot" | "Warm" | "Cold" | "Disqualified";
type Priority = "High" | "Medium" | "Low";
type Lifecycle =
  | "prospect"
  | "lead"
  | "engaged"
  | "client_active"
  | "client_past"
  | "sphere"
  | "do_not_contact";

interface Contact {
  id: string;
  full_name?: string | null;
  temperature?: Temperature | null;
  priority?: Priority | null;
  lifecycle_stage?: Lifecycle | null;
  tags?: string[] | null;
  notes?: string | null;
  relationship_score?: number | null;
}

const TEMP_TONES: Record<Temperature, string> = {
  Hot: "bg-hot text-parchment border-hot",
  Warm: "bg-brass text-parchment border-brass",
  Cold: "bg-stone/40 text-ink border-stone",
  Disqualified: "bg-mist text-stone border-mist",
};
const PRIORITY_TONES: Record<Priority, string> = {
  High: "bg-indigo text-parchment border-indigo",
  Medium: "bg-mist text-ink border-mist",
  Low: "bg-parchment text-stone border-mist",
};

export function ContactEditPanel({ contact }: { contact: Contact }) {
  const router = useRouter();
  const [temperature, setTemperature] = useState<Temperature>(
    (contact.temperature as Temperature) ?? "Warm"
  );
  const [priority, setPriority] = useState<Priority>((contact.priority as Priority) ?? "Medium");
  const [stage, setStage] = useState<Lifecycle>(
    (contact.lifecycle_stage as Lifecycle) ?? "prospect"
  );
  const [tags, setTags] = useState<string[]>(contact.tags ?? []);
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function patch(updates: Partial<Contact>) {
    setSaving(true);
    try {
      await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updates),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function updateTemp(t: Temperature) {
    setTemperature(t);
    patch({ temperature: t });
  }
  function updatePriority(p: Priority) {
    setPriority(p);
    patch({ priority: p });
  }
  function updateStage(s: Lifecycle) {
    setStage(s);
    patch({ lifecycle_stage: s });
  }
  function addTag() {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setTagInput("");
    patch({ tags: next });
  }
  function removeTag(t: string) {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    patch({ tags: next });
  }
  async function saveNotes() {
    setEditingNotes(false);
    await patch({ notes });
  }

  return (
    <section className="mb-10 border border-mist bg-parchment p-6 space-y-5">
      <div className="grid grid-cols-3 gap-6">
        {/* Temperature */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">Temperature</p>
          <div className="flex gap-1.5 flex-wrap">
            {(["Hot", "Warm", "Cold", "Disqualified"] as Temperature[]).map((t) => (
              <button
                key={t}
                onClick={() => updateTemp(t)}
                disabled={saving}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                  temperature === t
                    ? TEMP_TONES[t]
                    : "bg-parchment text-stone border-mist hover:border-indigo"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">Priority</p>
          <div className="flex gap-1.5 flex-wrap">
            {(["High", "Medium", "Low"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => updatePriority(p)}
                disabled={saving}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                  priority === p
                    ? PRIORITY_TONES[p]
                    : "bg-parchment text-stone border-mist hover:border-indigo"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Lifecycle stage */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">
            Lifecycle stage
          </p>
          <select
            value={stage}
            onChange={(e) => updateStage(e.target.value as Lifecycle)}
            disabled={saving}
            className="w-full px-3 py-1.5 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo"
          >
            <option value="prospect">Prospect</option>
            <option value="lead">Lead</option>
            <option value="engaged">Engaged</option>
            <option value="client_active">Active client</option>
            <option value="client_past">Past client</option>
            <option value="sphere">Sphere</option>
            <option value="do_not_contact">Do not contact</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">Tags</p>
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 border border-mist text-stone"
            >
              {t}
              <button onClick={() => removeTag(t)} className="hover:text-hot">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="add tag…"
              className="px-2 py-1 text-xs bg-parchment border border-mist focus:outline-none focus:border-indigo w-32"
            />
            <button
              onClick={addTag}
              disabled={saving || !tagInput.trim()}
              className="text-xs text-indigo hover:underline disabled:opacity-40"
            >
              add
            </button>
          </div>
        </div>
      </div>

      {/* Notes (inline edit) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone">Notes</p>
          {!editingNotes && (
            <button
              onClick={() => setEditingNotes(true)}
              className="text-xs text-indigo hover:underline flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={saveNotes}
                disabled={saving}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs uppercase tracking-wider bg-indigo text-parchment hover:bg-indigo-deep"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save
              </button>
              <button
                onClick={() => {
                  setNotes(contact.notes ?? "");
                  setEditingNotes(false);
                }}
                className="text-xs text-stone hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-smoke whitespace-pre-wrap leading-relaxed min-h-[60px]">
            {notes || <span className="text-stone italic">No notes yet.</span>}
          </p>
        )}
      </div>
    </section>
  );
}
