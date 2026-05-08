"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export interface StageFormProps {
  stage: number;
  total?: number;
  title: string;
  intro: string;
  prevHref?: string;
  nextHref: string;
  nextLabel?: string;
  children: ReactNode;
  /**
   * If true, this stage is the final activate step. On submit the form POSTs
   * to /api/onboard/activate and on success navigates to /dashboard.
   */
  isActivate?: boolean;
}

/**
 * Wraps every onboarding stage's fields in a real <form>. On Continue:
 * 1) collects all inputs as JSON (multi-value names become arrays)
 * 2) POSTs to /api/onboard/save (or /api/onboard/activate if `isActivate`)
 * 3) navigates to nextHref (or /dashboard on activate)
 *
 * Replaces the old StageShell which was a navigation-only Link wrapper.
 */
export function StageForm({
  stage,
  total = 9,
  title,
  intro,
  prevHref,
  nextHref,
  nextLabel,
  children,
  isActivate = false,
}: StageFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    const data: Record<string, any> = {};
    for (const [key, value] of fd.entries()) {
      if (key in data) {
        const cur = data[key];
        data[key] = Array.isArray(cur) ? [...cur, value] : [cur, value];
      } else {
        data[key] = value;
      }
    }
    // Normalize unchecked checkboxes (FormData omits them) — emit explicit false
    // for any input[type=checkbox] in the form not already in `data`.
    formEl.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((cb) => {
      if (!(cb.name in data)) data[cb.name] = false;
      else if (data[cb.name] === "on") data[cb.name] = true;
    });

    try {
      if (isActivate) {
        // Activate finalizes the workspace and logs compliance acks
        const res = await fetch("/api/onboard/activate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ stage, data }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `activate failed (${res.status})`);
        }
        router.push("/dashboard");
        router.refresh();
      } else {
        const res = await fetch("/api/onboard/save", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ stage, data }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `save failed (${res.status})`);
        }
        router.push(nextHref);
      }
    } catch (e: any) {
      setError(e.message || "Save failed");
      setSaving(false);
    }
  }

  const continueLabel = isActivate
    ? saving ? "Activating…" : "Activate ALEVANT →"
    : saving ? "Saving…" : `${nextLabel ?? "Continue"} →`;

  return (
    <form onSubmit={onSubmit} className="max-w-3xl">
      <p className="eyebrow !text-indigo mb-3">
        Stage {String(stage).padStart(2, "0")} of {String(total).padStart(2, "0")}
      </p>
      <h1 className="serif-display text-ink text-5xl mb-4 leading-tight">{title}</h1>
      <p className="text-base text-smoke leading-relaxed mb-12 max-w-2xl">{intro}</p>
      <div className="space-y-8">{children}</div>
      {error && (
        <p className="mt-6 text-xs text-error" role="alert">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between mt-16 pt-8 border-t border-mist">
        {prevHref ? (
          <Link href={prevHref}>
            <Button variant="ghost" size="md" type="button">← Back</Button>
          </Link>
        ) : (
          <span />
        )}
        <Button size={isActivate ? "lg" : "md"} variant={isActivate ? "brass" : undefined} type="submit" disabled={saving}>
          {continueLabel}
        </Button>
      </div>
    </form>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-normal uppercase tracking-[0.22em] text-stone mb-2">{label}</label>
      {children}
      {hint && <p className="mt-2 text-xs text-stone leading-relaxed">{hint}</p>}
    </div>
  );
}
