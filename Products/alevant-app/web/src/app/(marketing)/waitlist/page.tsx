"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function WaitlistPage() {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/marketing/waitlist", {
      method: "POST",
      body: fd,
    });
    setBusy(false);
    if (r.ok) setDone(true);
    else setErr("Something went wrong. Try again or email hello@alevant.ai.");
  }

  return (
    <main className="px-10 py-24 max-w-xl mx-auto">
      <p className="eyebrow !text-indigo mb-6">Waitlist</p>
      <h1 className="serif-display text-ink text-5xl mb-3">Be early.</h1>
      <p className="serif-italic text-stone text-lg mb-12">
        We're onboarding pilot agents in waves. Tell us about you and we'll be in touch.
      </p>

      {done ? (
        <div className="border border-mist bg-bone p-10 text-center">
          <p className="serif-display text-ink text-3xl mb-2">You're in.</p>
          <p className="serif-italic text-stone">Watch your inbox. We respond within 48 hours.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <div><Label>Email</Label><Input type="email" name="email" required /></div>
          <div><Label>Full name</Label><Input name="full_name" /></div>
          <div><Label>Brokerage</Label><Input name="brokerage" /></div>
          <div><Label>Market</Label><Input name="market" placeholder="Miami · Coral Gables · South Beach" /></div>
          <div>
            <Label>What do you most want from ALEVANT?</Label>
            <select name="intent" className="w-full bg-parchment border border-mist px-4 py-3 text-sm text-ink">
              <option value="sofia">Sofia · voice ISA</option>
              <option value="vesper">Vesper · marketing</option>
              <option value="grid">The Grid · seller leads</option>
              <option value="all">All of it</option>
            </select>
          </div>
          {err && <p className="text-xs text-error">{err}</p>}
          <Button type="submit" size="lg" disabled={busy}>{busy ? "Sending…" : "Join the waitlist"}</Button>
        </form>
      )}
    </main>
  );
}
