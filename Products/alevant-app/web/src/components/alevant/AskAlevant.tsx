"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X, Sparkles, Loader2 } from "lucide-react";

const SUGGESTIONS = [
  "Show my hot leads not contacted in 7 days",
  "What's in escrow this week?",
  "Top motivation signals in my farm zones",
  "Who should I call today?",
  "Pipeline summary",
];

export function AskAlevant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setAnswer("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const ask = useCallback(async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setAnswer("");
    try {
      const r = await fetch("/api/cockpit/standup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const j = await r.json();
      setAnswer(j.answer || j.briefing || j.error || "No response.");
    } catch (e: any) {
      setAnswer(e.message);
    } finally {
      setLoading(false);
    }
  }, [query, loading]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-md" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-[640px] mx-4 bg-parchment border border-mist shadow-[0_24px_80px_rgba(26,25,21,0.18)] overflow-hidden"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-mist">
          <Sparkles className="w-4 h-4 text-brass flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Ask alevant anything about your pipeline…"
            className="flex-1 bg-transparent border-0 outline-none text-[15px] font-light text-ink placeholder:text-stone"
          />
          {query.trim() && (
            <button
              onClick={ask}
              disabled={loading}
              className="bg-ink text-parchment border-0 px-4 py-2 text-xs flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ask"}
            </button>
          )}
          <button onClick={onClose} className="text-stone p-1 hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Suggestions */}
        {!answer && !loading && (
          <div className="px-5 py-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  setTimeout(ask, 60);
                }}
                className="text-xs font-light text-smoke bg-bone border border-mist rounded-full px-3.5 py-1.5 hover:border-indigo hover:text-indigo transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="px-5 py-8 text-center text-sm text-stone">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-brass" />
            Thinking…
          </div>
        )}

        {answer && !loading && (
          <div className="px-5 py-5 max-h-[400px] overflow-y-auto text-sm font-light text-ink leading-relaxed whitespace-pre-wrap">
            {answer}
          </div>
        )}
      </div>
    </div>
  );
}
