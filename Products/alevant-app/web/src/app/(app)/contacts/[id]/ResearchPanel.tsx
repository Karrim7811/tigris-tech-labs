"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  ExternalLink,
  Linkedin,
  Sparkles,
  RefreshCw,
  Globe,
} from "lucide-react";

interface Enrichment {
  id?: string;
  linkedin_url?: string | null;
  current_title?: string | null;
  current_company?: string | null;
  location_text?: string | null;
  headline?: string | null;
  photo_url?: string | null;
  apollo_email?: string | null;
  apollo_phone?: string | null;
  apollo_seniority?: string | null;
  raw_apollo?: any;
  raw_proxycurl?: any;
  raw_perplexity?: { raw_text?: string; citations?: string[] };
  ai_brief?: string | null;
  ai_opening_line?: string | null;
  ai_signals?: string[] | null;
  vendors_used?: string[] | null;
  fetched_at?: string | null;
}

export function ResearchPanel({
  contactId,
  contactName,
  contactCity,
}: {
  contactId: string;
  contactName: string;
  contactCity?: string;
}) {
  const [enrichment, setEnrichment] = useState<Enrichment | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/contacts/${contactId}/research`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) {
          setEnrichment(j.enrichment ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  async function runResearch(force = false) {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/contacts/${contactId}/research`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ force }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      setEnrichment(j.enrichment);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const linkedInSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    [contactName, contactCity].filter(Boolean).join(" ")
  )}`;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="serif-display text-ink text-3xl flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo" /> Research
        </h2>
        <div className="flex items-center gap-2">
          {enrichment?.fetched_at && (
            <span className="text-xs text-stone uppercase tracking-wider">
              Last run: {new Date(enrichment.fetched_at).toLocaleString()}
            </span>
          )}
          <button
            onClick={() => runResearch(!!enrichment)}
            disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.28em] bg-indigo text-parchment hover:bg-indigo-deep transition-colors disabled:opacity-60"
          >
            {running ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : enrichment ? (
              <RefreshCw className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {running ? "Researching…" : enrichment ? "Re-run research" : "Run research"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-hot bg-hot/5 px-4 py-3 text-sm text-hot mb-4">{error}</div>
      )}

      {loading && (
        <div className="border border-mist bg-parchment p-6 text-stone text-sm">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading cached research…
        </div>
      )}

      {!loading && !enrichment && !running && (
        <div className="border border-mist bg-parchment p-6">
          <p className="serif-italic text-stone text-base">
            No research has been run yet. Click <strong>Run research</strong> above to fan
            out to Apollo, Proxycurl, and Perplexity, then synthesize a 60-second briefing
            with Claude. Vendors gracefully no-op when API keys aren't configured — at
            minimum you'll get a Claude brief built from what we already know.
          </p>
          <a
            href={linkedInSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-xs uppercase tracking-[0.28em] text-indigo hover:underline"
          >
            <Linkedin className="w-3.5 h-3.5" /> Quick LinkedIn search
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {enrichment && (
        <div className="space-y-5">
          {/* AI Brief — top of panel */}
          {enrichment.ai_brief && (
            <div className="border border-indigo bg-indigo/5 p-5">
              <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-[0.28em] text-indigo">
                <Sparkles className="w-3 h-3" /> Claude brief
                {enrichment.vendors_used && enrichment.vendors_used.length > 0 && (
                  <span className="text-stone">
                    · sources: {enrichment.vendors_used.join(", ")}
                  </span>
                )}
              </div>
              <p className="serif-display text-ink text-xl leading-snug mb-3">
                {enrichment.ai_brief}
              </p>
              {enrichment.ai_opening_line && (
                <p className="serif-italic text-stone text-base border-l-2 border-indigo pl-4 mb-3">
                  "{enrichment.ai_opening_line}"
                </p>
              )}
              {enrichment.ai_signals && enrichment.ai_signals.length > 0 && (
                <ul className="space-y-1.5 mt-3">
                  {enrichment.ai_signals.map((s, i) => (
                    <li key={i} className="text-sm text-smoke flex items-start gap-2">
                      <span className="text-indigo mt-1">·</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Identity card — Apollo + Proxycurl synthesis */}
          {(enrichment.linkedin_url ||
            enrichment.current_title ||
            enrichment.headline ||
            enrichment.photo_url) && (
            <div className="border border-mist bg-parchment p-5 flex items-start gap-5">
              {enrichment.photo_url && (
                <img
                  src={enrichment.photo_url}
                  alt={contactName}
                  className="w-20 h-20 object-cover border border-mist"
                />
              )}
              <div className="flex-1 min-w-0">
                {enrichment.headline && (
                  <p className="serif-display text-ink text-xl leading-tight">
                    {enrichment.headline}
                  </p>
                )}
                {(enrichment.current_title || enrichment.current_company) && (
                  <p className="text-sm text-smoke mt-1">
                    {enrichment.current_title}
                    {enrichment.current_title && enrichment.current_company && " · "}
                    {enrichment.current_company}
                  </p>
                )}
                {enrichment.location_text && (
                  <p className="text-xs text-stone uppercase tracking-wider mt-2 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> {enrichment.location_text}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  {enrichment.linkedin_url && (
                    <a
                      href={enrichment.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-indigo hover:underline"
                    >
                      <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {enrichment.apollo_email && (
                    <a
                      href={`mailto:${enrichment.apollo_email}`}
                      className="text-xs uppercase tracking-[0.28em] text-stone hover:text-ink"
                    >
                      {enrichment.apollo_email}
                    </a>
                  )}
                  {enrichment.apollo_phone && (
                    <span className="text-xs uppercase tracking-[0.28em] text-stone">
                      {enrichment.apollo_phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent experience from Proxycurl */}
          {enrichment.raw_proxycurl?.experiences?.length > 0 && (
            <div className="border border-mist bg-parchment p-5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-stone mb-3">
                Recent experience
              </p>
              <ol className="space-y-2.5">
                {enrichment.raw_proxycurl.experiences
                  .slice(0, 4)
                  .map((e: any, i: number) => (
                    <li
                      key={i}
                      className="grid grid-cols-[1fr_auto] gap-4 text-sm text-ink border-b border-mist/40 last:border-0 pb-2.5 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{e.title}</p>
                        <p className="text-stone text-xs mt-0.5">{e.company}</p>
                      </div>
                      <p className="text-xs text-stone whitespace-nowrap">
                        {e.starts_at?.year ?? "—"} – {e.ends_at?.year ?? "Present"}
                      </p>
                    </li>
                  ))}
              </ol>
            </div>
          )}

          {/* Perplexity web research */}
          {enrichment.raw_perplexity?.raw_text && (
            <div className="border border-mist bg-parchment p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone">
                  Web research (Perplexity)
                </p>
                {enrichment.raw_perplexity.citations &&
                  enrichment.raw_perplexity.citations.length > 0 && (
                    <p className="text-[10px] text-stone">
                      {enrichment.raw_perplexity.citations.length} sources cited
                    </p>
                  )}
              </div>
              <div className="text-sm text-smoke leading-relaxed whitespace-pre-wrap">
                {enrichment.raw_perplexity.raw_text}
              </div>
              {enrichment.raw_perplexity.citations &&
                enrichment.raw_perplexity.citations.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs uppercase tracking-[0.28em] text-stone cursor-pointer hover:text-ink">
                      Citations
                    </summary>
                    <ol className="mt-2 space-y-1 text-xs">
                      {enrichment.raw_perplexity.citations.map((c, i) => (
                        <li key={i}>
                          <a
                            href={c}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo hover:underline break-all"
                          >
                            [{i + 1}] {c}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
            </div>
          )}

          {/* Fallback search link — always visible */}
          <div className="flex items-center gap-3 text-xs">
            <a
              href={linkedInSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 uppercase tracking-[0.28em] text-stone hover:text-indigo"
            >
              <Linkedin className="w-3 h-3" /> LinkedIn search for "{contactName}"
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(
                `${contactName} ${contactCity ?? ""}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 uppercase tracking-[0.28em] text-stone hover:text-indigo"
            >
              <Globe className="w-3 h-3" /> Google search
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
