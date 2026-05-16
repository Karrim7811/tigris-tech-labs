"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Mail, MessageSquare, Phone, Sparkles, Linkedin } from "lucide-react";

interface Settings {
  auto_log_mode: "full_auto" | "sofia_only" | "manual_only";
  gmail_enabled: boolean;
  twilio_enabled: boolean;
  sofia_enabled: boolean;
  vesper_enabled: boolean;
  linkedin_enabled: boolean;
}

const MODES: { value: Settings["auto_log_mode"]; title: string; desc: string }[] = [
  {
    value: "full_auto",
    title: "Full auto — option C",
    desc: "Gmail (outgoing email), Twilio (SMS + calls), Sofia (voice), and Vesper (campaigns) auto-write to contact timelines.",
  },
  {
    value: "sofia_only",
    title: "Sofia only — option B",
    desc: "Only Sofia and Vesper auto-log. Gmail and Twilio require manual capture (use the quick-log buttons on each contact).",
  },
  {
    value: "manual_only",
    title: "Manual only",
    desc: "Nothing auto-logs. Every activity is logged manually. Use this if you want full control over the timeline.",
  },
];

const CHANNELS: { key: keyof Omit<Settings, "auto_log_mode">; label: string; icon: typeof Mail }[] = [
  { key: "gmail_enabled", label: "Gmail", icon: Mail },
  { key: "twilio_enabled", label: "Twilio (SMS + calls)", icon: MessageSquare },
  { key: "sofia_enabled", label: "Sofia voice", icon: Phone },
  { key: "vesper_enabled", label: "Vesper campaigns", icon: Sparkles },
  { key: "linkedin_enabled", label: "LinkedIn (when wired)", icon: Linkedin },
];

export function CommsSettingsClient() {
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/comms")
      .then((r) => r.json())
      .then((j) => {
        setS(j.settings);
        setLoading(false);
      });
  }, []);

  async function update(patch: Partial<Settings>) {
    if (!s) return;
    const next = { ...s, ...patch };
    setS(next);
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings/comms", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading || !s) {
    return (
      <div className="text-stone text-sm">
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-[10px] uppercase tracking-[0.28em] text-stone mb-4">Logging mode</h2>
        <div className="space-y-3">
          {MODES.map((m) => (
            <label
              key={m.value}
              className={`block border p-5 cursor-pointer transition-colors ${
                s.auto_log_mode === m.value
                  ? "border-indigo bg-indigo/5"
                  : "border-mist bg-parchment hover:border-indigo/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="mode"
                  value={m.value}
                  checked={s.auto_log_mode === m.value}
                  onChange={() => update({ auto_log_mode: m.value })}
                  className="mt-1.5"
                />
                <div className="flex-1">
                  <p className="serif-display text-ink text-xl">{m.title}</p>
                  <p className="text-sm text-smoke mt-1">{m.desc}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[10px] uppercase tracking-[0.28em] text-stone mb-4">
          Per-channel toggles
        </h2>
        <p className="text-xs text-stone mb-4">
          Even when a mode is enabled, you can turn off individual channels.
        </p>
        <div className="space-y-1 border border-mist bg-parchment">
          {CHANNELS.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center justify-between px-5 py-3 border-b border-mist/40 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-stone" />
                <span className="text-sm text-ink">{label}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!s[key]}
                  onChange={(e) => update({ [key]: e.target.checked } as Partial<Settings>)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-mist peer-checked:bg-indigo rounded-full transition-colors relative">
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-parchment rounded-full transition-transform ${
                      s[key] ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </label>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3 text-xs text-stone">
        {saving && (
          <>
            <Loader2 className="w-3 h-3 animate-spin" /> Saving…
          </>
        )}
        {saved && (
          <>
            <Check className="w-3 h-3 text-indigo" /> <span className="text-indigo">Saved</span>
          </>
        )}
      </div>
    </div>
  );
}
