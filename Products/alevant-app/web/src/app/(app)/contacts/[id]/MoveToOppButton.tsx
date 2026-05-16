"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Loader2, X } from "lucide-react";

export function MoveToOppButton({
  contactId,
  contactName,
}: {
  contactId: string;
  contactName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [side, setSide] = useState<"buyer" | "seller" | "both">("buyer");
  const [name, setName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [estValue, setEstValue] = useState("");

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/contacts/${contactId}/move-to-opportunity`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          side,
          name: name || undefined,
          property_address: propertyAddress || undefined,
          est_value_usd: estValue ? parseFloat(estValue) : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      router.push(`/opportunities/${j.opportunity.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.28em] bg-indigo text-parchment hover:bg-indigo-deep transition-colors"
      >
        <TrendingUp className="w-3.5 h-3.5" /> Move to Opportunity
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-ink/40 z-50 grid place-items-center px-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-parchment border border-mist w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="serif-display text-ink text-2xl">Move to Opportunity</h2>
              <button onClick={() => setOpen(false)} className="text-stone hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-smoke mb-5">
              {contactName} stays as a contact. A new opportunity will be created and linked.
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">Side</p>
                <div className="flex gap-1.5">
                  {(["buyer", "seller", "both"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSide(s)}
                      className={`flex-1 px-3 py-2 text-xs uppercase tracking-wider border transition-colors ${
                        side === s
                          ? "bg-indigo text-parchment border-indigo"
                          : "bg-parchment text-stone border-mist hover:border-indigo"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">
                  Opportunity name (optional)
                </p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`${contactName}${propertyAddress ? ` — ${propertyAddress}` : ""}`}
                  className="w-full px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo"
                />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">
                  Property address (optional)
                </p>
                <input
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  placeholder="1450 Brickell Bay Dr #2902"
                  className="w-full px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo"
                />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-2">
                  Est. value / budget (USD, optional)
                </p>
                <input
                  type="number"
                  value={estValue}
                  onChange={(e) => setEstValue(e.target.value)}
                  placeholder="1500000"
                  className="w-full px-3 py-2 text-sm bg-parchment border border-mist focus:outline-none focus:border-indigo"
                />
              </div>

              {error && (
                <div className="border border-hot bg-hot/5 px-3 py-2 text-sm text-hot">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-mist">
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-[0.28em] bg-indigo text-parchment hover:bg-indigo-deep disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5" />
                  )}
                  {submitting ? "Creating…" : "Create opportunity"}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="px-5 py-2.5 text-xs uppercase tracking-[0.28em] text-stone hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
