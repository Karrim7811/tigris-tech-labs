"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Power, Plus, Trash2, AlertTriangle, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Capability, CustomRule, Persona, PersonaSettings } from "@/lib/ai/capabilities";

interface Props {
  persona: Persona;
  settings: PersonaSettings;
}

const personaName: Record<Persona, string> = { sofia: "Sofia", vesper: "Vesper" };
const personaTagline: Record<Persona, string> = {
  sofia: "Voice ISA · 24/7 inbound",
  vesper: "Marketing Director · multi-channel",
};

export function PersonaSettingsClient({ persona, settings }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const master = settings.master;
  const masterOn = master?.enabled ?? false;

  async function toggleCapability(cap: Capability, next: boolean) {
    setError(null);
    setPendingId(cap.id);
    try {
      const r = await fetch("/api/settings/capabilities", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ capability_id: cap.id, enabled: next }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `failed (${r.status})`);
      }
      startTransition(() => router.refresh());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="px-10 py-12 max-w-5xl">
      {/* Header */}
      <header className="mb-10 flex items-start justify-between gap-6">
        <div>
          <p className="eyebrow !text-indigo mb-2">Settings · {personaName[persona]}</p>
          <h1 className="serif-display text-ink text-5xl mb-2">{personaName[persona]} configuration.</h1>
          <p className="serif-italic text-stone text-base">{personaTagline[persona]}</p>
        </div>
      </header>

      {/* Master kill switch */}
      {master && (
        <section
          className={`border p-6 mb-10 flex items-center justify-between gap-4 transition-colors ${
            masterOn ? "border-success/40 bg-success/5" : "border-hot/40 bg-hot/5"
          }`}
        >
          <div className="flex items-center gap-4">
            <Power className={`w-6 h-6 ${masterOn ? "text-success" : "text-hot"}`} strokeWidth={1.5} />
            <div>
              <p className="serif-display text-ink text-2xl mb-1">
                {personaName[persona]} is {masterOn ? "ON" : "OFF"}
              </p>
              <p className="text-sm text-smoke leading-relaxed max-w-xl">
                {masterOn
                  ? master.description
                  : `${personaName[persona]} is paused. Nothing fires across any channel until you flip this back on.`}
              </p>
            </div>
          </div>
          <Toggle on={masterOn} pending={pendingId === master.id} onChange={(v) => toggleCapability(master, v)} large />
        </section>
      )}

      {error && (
        <div className="border border-hot bg-hot/5 px-5 py-3 mb-6 text-xs text-hot">
          {error}
        </div>
      )}

      {/* Categories */}
      {settings.categories.map((cat) => (
        <CategorySection
          key={cat.category}
          persona={persona}
          category={cat.category}
          label={cat.label}
          capabilities={cat.capabilities}
          customRules={cat.customRules}
          pendingId={pendingId}
          onToggle={toggleCapability}
          masterOn={masterOn}
        />
      ))}
    </div>
  );
}

interface CategoryProps {
  persona: Persona;
  category: string;
  label: string;
  capabilities: Capability[];
  customRules: CustomRule[];
  pendingId: string | null;
  onToggle: (cap: Capability, next: boolean) => Promise<void>;
  masterOn: boolean;
}

function CategorySection({ persona, category, label, capabilities, customRules, pendingId, onToggle, masterOn }: CategoryProps) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="border border-mist bg-parchment mb-8">
      <div className="px-6 py-4 border-b border-mist flex items-center justify-between">
        <p className="eyebrow !text-brass">{label}</p>
        <button
          onClick={() => setAdding(true)}
          className="text-[10px] uppercase tracking-[0.18em] text-indigo hover:text-indigo-deep flex items-center gap-1"
          disabled={!masterOn}
          title={masterOn ? "Add custom rule" : `${persona === "sofia" ? "Sofia" : "Vesper"} is off — turn on to add`}
        >
          <Plus className="w-3 h-3" /> Add custom
        </button>
      </div>

      <ul className="divide-y divide-mist">
        {capabilities.map((cap) => (
          <CapabilityRow
            key={cap.id}
            cap={cap}
            pending={pendingId === cap.id}
            onToggle={onToggle}
            disabled={!masterOn}
          />
        ))}
        {customRules.map((rule) => (
          <CustomRuleRow key={rule.id} rule={rule} disabled={!masterOn} />
        ))}
      </ul>

      {adding && (
        <AddCustomRuleForm
          persona={persona}
          category={category}
          onClose={() => setAdding(false)}
        />
      )}
    </section>
  );
}

function CapabilityRow({ cap, pending, onToggle, disabled }: { cap: Capability; pending: boolean; onToggle: (cap: Capability, next: boolean) => Promise<void>; disabled: boolean }) {
  return (
    <li className="px-6 py-4 grid grid-cols-[1fr_auto] gap-4 items-center hover:bg-bone/30">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm text-ink font-medium">{cap.label}</p>
          {cap.is_v2 && <Badge tone="neutral">V2</Badge>}
        </div>
        {cap.description && (
          <p className="text-xs text-stone leading-relaxed">{cap.description}</p>
        )}
        {cap.warns_when_off && !cap.enabled && (
          <p className="text-[11px] text-hot mt-1 flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {cap.warns_when_off}
          </p>
        )}
      </div>
      <Toggle on={cap.enabled} pending={pending} disabled={disabled || cap.is_v2} onChange={(v) => onToggle(cap, v)} />
    </li>
  );
}

function CustomRuleRow({ rule, disabled }: { rule: CustomRule; disabled: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(rule.title);
  const [body, setBody] = useState(rule.body);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(payload: any) {
    setPending(true);
    setError(null);
    try {
      const r = await fetch("/api/settings/custom-rules", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: rule.id, ...payload }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "failed");
      router.refresh();
      setEditing(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete custom rule "${rule.title}"?`)) return;
    setPending(true);
    try {
      const r = await fetch(`/api/settings/custom-rules?id=${rule.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("delete failed");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="px-6 py-4 bg-bone/40 grid grid-cols-[1fr_auto] gap-4 items-start">
      <div className="min-w-0">
        {editing ? (
          <div className="space-y-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Rule title" />
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => patch({ title, body })} disabled={pending}>
                <Check className="w-3 h-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setTitle(rule.title); setBody(rule.body); }}>
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm text-ink font-medium">{rule.title}</p>
              <Badge tone="brass">Custom</Badge>
            </div>
            <p className="text-xs text-smoke leading-relaxed">{rule.body}</p>
          </>
        )}
        {error && <p className="text-[11px] text-hot mt-1">{error}</p>}
      </div>
      {!editing && (
        <div className="flex items-center gap-2">
          <Toggle
            on={rule.enabled}
            pending={pending}
            disabled={disabled}
            onChange={(v) => patch({ enabled: v })}
          />
          <button
            onClick={() => setEditing(true)}
            className="text-stone hover:text-indigo p-1.5"
            title="Edit"
            disabled={disabled}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={remove}
            className="text-stone hover:text-hot p-1.5"
            title="Delete"
            disabled={disabled}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </li>
  );
}

function AddCustomRuleForm({ persona, category, onClose }: { persona: Persona; category: string; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim() || !body.trim()) {
      setError("Title and instruction body are both required.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const r = await fetch("/api/settings/custom-rules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persona, category, title: title.trim(), body: body.trim() }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "failed");
      router.refresh();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="px-6 py-5 border-t border-mist bg-bone/40">
      <p className="eyebrow !text-indigo mb-3">New custom rule</p>
      <div className="space-y-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='e.g. "Always ask about parking and EV-charging needs"'
          autoFocus
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Full instruction — this gets injected into the AI's prompt verbatim."
        />
        {error && <p className="text-xs text-hot">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : "Save rule"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, pending, disabled, onChange, large }: { on: boolean; pending?: boolean; disabled?: boolean; onChange: (v: boolean) => void; large?: boolean }) {
  const w = large ? "w-14 h-8" : "w-10 h-6";
  const dot = large ? "w-6 h-6" : "w-4 h-4";
  const dotOn = large ? "translate-x-7" : "translate-x-5";
  const dotOff = "translate-x-1";
  return (
    <button
      type="button"
      onClick={() => !disabled && !pending && onChange(!on)}
      disabled={disabled || pending}
      className={`relative inline-flex items-center ${w} rounded-full transition-colors flex-shrink-0 ${
        disabled
          ? "bg-mist cursor-not-allowed"
          : on
          ? "bg-success"
          : "bg-stone/40"
      } ${pending ? "opacity-60" : ""}`}
      aria-pressed={on}
    >
      <span
        className={`inline-block ${dot} bg-parchment rounded-full shadow transition-transform ${
          on ? dotOn : dotOff
        }`}
      />
    </button>
  );
}
