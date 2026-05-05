"use client";

import { useState } from "react";

interface MarketInsightsLeadButtonProps {
  signalId?: string;
  autoCreate?: boolean;
  label: string;
}

export function MarketInsightsLeadButton({ signalId, autoCreate, label }: MarketInsightsLeadButtonProps) {
  const [status, setStatus] = useState("ready");
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("saving");
    setMessage(null);

    try {
      const body = autoCreate ? { auto_create: true } : { signal_id: signalId };
      const res = await fetch("/api/market-insights/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data?.error || "Unable to create lead.");
        return;
      }

      setStatus("saved");
      setMessage(data?.created ? `Created ${data.created} lead${data.created === 1 ? "" : "s"}.` : "Lead created.");
    } catch (error) {
      setStatus("error");
      setMessage((error as Error).message || "Unexpected error.");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "saving" || (!autoCreate && !signalId)}
        className="btn-base w-full bg-indigo text-parchment hover:bg-indigo-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "saving" ? "Working..." : status === "saved" ? "Created" : label}
      </button>
      {message ? <p className="text-xs text-stone">{message}</p> : null}
    </div>
  );
}
