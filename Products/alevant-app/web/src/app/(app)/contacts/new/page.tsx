"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";

type Lifecycle =
  | "prospect"
  | "lead"
  | "engaged"
  | "client_active"
  | "client_past"
  | "sphere"
  | "do_not_contact";

interface FormState {
  full_name: string;
  emails: string[];
  phones: string[];
  category: string;
  lifecycle_stage: Lifecycle;
  language: string;
  tags: string[];
  source: string;
  notes: string;
}

const EMPTY: FormState = {
  full_name: "",
  emails: [""],
  phones: [""],
  category: "lead",
  lifecycle_stage: "prospect",
  language: "en",
  tags: [],
  source: "manual",
  notes: "",
};

export default function NewContactPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  function updateEmail(i: number, v: string) {
    setForm({ ...form, emails: form.emails.map((e, j) => (j === i ? v : e)) });
  }
  function updatePhone(i: number, v: string) {
    setForm({ ...form, phones: form.phones.map((p, j) => (j === i ? v : p)) });
  }
  function addEmail() {
    setForm({ ...form, emails: [...form.emails, ""] });
  }
  function removeEmail(i: number) {
    setForm({ ...form, emails: form.emails.filter((_, j) => j !== i) });
  }
  function addPhone() {
    setForm({ ...form, phones: [...form.phones, ""] });
  }
  function removePhone(i: number) {
    setForm({ ...form, phones: form.phones.filter((_, j) => j !== i) });
  }
  function addTag() {
    const t = tagInput.trim();
    if (!t || form.tags.includes(t)) return;
    setForm({ ...form, tags: [...form.tags, t] });
    setTagInput("");
  }
  function removeTag(t: string) {
    setForm({ ...form, tags: form.tags.filter((x) => x !== t) });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const emails = form.emails.map((s) => s.trim()).filter(Boolean);
    const phones = form.phones.map((s) => s.trim()).filter(Boolean);
    if (!form.full_name.trim() && emails.length === 0 && phones.length === 0) {
      setError("Provide at least a name, email, or phone.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name.trim() || null,
          emails,
          phones,
          category: form.category,
          lifecycle_stage: form.lifecycle_stage,
          language: form.language || null,
          tags: form.tags,
          source: form.source || null,
          prospect_source: "manual",
          notes: form.notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      router.push(`/contacts/${j.contact.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="px-10 py-12 max-w-3xl">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-stone hover:text-ink mb-8"
      >
        <ArrowLeft className="w-3 h-3" /> Back to contacts
      </Link>

      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">New Contact</p>
        <h1 className="serif-display text-ink text-5xl">Add someone to your world.</h1>
      </header>

      <form onSubmit={submit} className="space-y-7">
        {/* Name */}
        <Field label="Full name">
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Maria Delgado"
            className="input"
            autoFocus
          />
        </Field>

        {/* Emails */}
        <Field label="Email">
          {form.emails.map((email, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => updateEmail(i, e.target.value)}
                placeholder="maria@example.com"
                className="input flex-1"
              />
              {form.emails.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEmail(i)}
                  className="text-stone hover:text-hot p-2"
                  aria-label="Remove email"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addEmail}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-indigo hover:underline mt-1"
          >
            <Plus className="w-3 h-3" /> Add email
          </button>
        </Field>

        {/* Phones */}
        <Field label="Phone">
          {form.phones.map((phone, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => updatePhone(i, e.target.value)}
                placeholder="+1 305 555 0123"
                className="input flex-1"
              />
              {form.phones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePhone(i)}
                  className="text-stone hover:text-hot p-2"
                  aria-label="Remove phone"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPhone}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-indigo hover:underline mt-1"
          >
            <Plus className="w-3 h-3" /> Add phone
          </button>
        </Field>

        {/* Stage + Category */}
        <div className="grid grid-cols-2 gap-5">
          <Field label="Lifecycle stage">
            <select
              value={form.lifecycle_stage}
              onChange={(e) =>
                setForm({ ...form, lifecycle_stage: e.target.value as Lifecycle })
              }
              className="input"
            >
              <option value="prospect">Prospect</option>
              <option value="lead">Lead</option>
              <option value="engaged">Engaged</option>
              <option value="client_active">Active client</option>
              <option value="client_past">Past client</option>
              <option value="sphere">Sphere</option>
              <option value="do_not_contact">Do not contact</option>
            </select>
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input"
            >
              <option value="lead">Lead</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="investor">Investor</option>
              <option value="renter">Renter</option>
              <option value="past_client">Past client</option>
              <option value="active_client">Active client</option>
              <option value="sphere">Sphere</option>
              <option value="vendor">Vendor</option>
            </select>
          </Field>
        </div>

        {/* Language + Source */}
        <div className="grid grid-cols-2 gap-5">
          <Field label="Language">
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="input"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="pt">Portuguese</option>
              <option value="zh">Chinese</option>
              <option value="fr">French</option>
            </select>
          </Field>
          <Field label="Source">
            <input
              type="text"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="manual, referral, ig_dm, web_form…"
              className="input"
            />
          </Field>
        </div>

        {/* Tags */}
        <Field label="Tags">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="brickell, investor, spanish-speaking…"
              className="input flex-1"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 text-xs uppercase tracking-wider border border-mist text-stone hover:text-ink"
            >
              Add
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {form.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 border border-mist text-stone"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="hover:text-hot"
                    aria-label={`Remove ${t}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Field>

        {/* Notes */}
        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Anything you want to remember about this person…"
            rows={4}
            className="input resize-none"
          />
        </Field>

        {error && (
          <div className="border border-hot bg-hot/5 px-4 py-3 text-sm text-hot">{error}</div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-mist">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-[0.28em] bg-indigo text-parchment hover:bg-indigo-deep transition-colors disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {submitting ? "Saving…" : "Create contact"}
          </button>
          <Link
            href="/contacts"
            className="px-5 py-2.5 text-xs uppercase tracking-[0.28em] text-stone hover:text-ink"
          >
            Cancel
          </Link>
        </div>
      </form>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: var(--parchment, #fafaf8);
          border: 1px solid #d6d2c8;
          color: #1a1915;
          font-size: 0.875rem;
        }
        :global(.input:focus) {
          outline: none;
          border-color: #3d4f8c;
          box-shadow: 0 0 0 2px rgba(61, 79, 140, 0.12);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.28em] text-stone mb-2">
        {label}
      </label>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
