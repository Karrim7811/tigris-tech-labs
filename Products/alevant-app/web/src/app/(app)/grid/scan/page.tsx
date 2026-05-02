"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export default function GridScanPage() {
  const [zip, setZip] = useState("33131");
  const [addresses, setAddresses] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  async function onRun() {
    setRunning(true);
    setResults([]);
    const list = addresses.split("\n").map((a) => a.trim()).filter(Boolean);
    const r = await fetch("/api/grid/scan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ zip, addresses: list }),
    });
    const json = await r.json();
    setResults(json.results || []);
    setRunning(false);
  }

  return (
    <div className="px-10 py-12 max-w-5xl">
      <Link href="/grid" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-stone hover:text-indigo mb-6">
        <ArrowLeft className="w-3 h-3" /> The Grid
      </Link>

      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Scan</p>
        <h1 className="serif-display text-ink text-5xl">Manual address scan.</h1>
        <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
          Run public-records fusion on a list of addresses. Each address fans out to the Miami-Dade Property Appraiser API, clerk-of-court (foreclosure / probate / divorce), tax collector, and code-enforcement adapters. Claude generates the reasoning narrative. Results persist as Grid signals.
        </p>
      </header>

      <div className="space-y-6">
        <div>
          <Label>ZIP (county hint)</Label>
          <Input value={zip} onChange={(e) => setZip(e.target.value)} className="max-w-xs" />
        </div>
        <div>
          <Label>Addresses (one per line)</Label>
          <Textarea
            rows={10}
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
            placeholder={`1287 SW 12th Ave, Miami, FL 33135\n560 NW 33rd St, Miami, FL 33127\n330 Sunset Dr, Coral Gables, FL 33143`}
          />
        </div>
        <Button onClick={onRun} disabled={running || !addresses.trim()}>
          {running ? "Scanning…" : "Run scan"}
        </Button>
      </div>

      {results.length > 0 && (
        <section className="mt-12">
          <p className="eyebrow !text-brass mb-4">Results</p>
          <div className="border border-mist bg-parchment">
            {results.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_120px_140px] gap-4 px-5 py-4 items-center border-b border-mist last:border-b-0"
              >
                <p className="text-sm text-ink">{r.address}</p>
                <p className={`text-sm ${r.ok ? "text-success" : "text-error"} uppercase tracking-[0.22em] text-[10px]`}>
                  {r.ok ? "ok" : "skipped"}
                </p>
                <p className="text-sm text-ink text-right">
                  {r.motivation != null ? `Motivation ${r.motivation}` : r.error || "—"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
