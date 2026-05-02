import { Wordmark } from "@/components/alevant/wordmark";
import Link from "next/link";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-parchment">
      <header className="px-10 py-6 border-b border-mist">
        <Link href="/"><Wordmark size="sm" /></Link>
      </header>
      <section className="px-10 py-20 max-w-2xl mx-auto">
        <p className="eyebrow !text-indigo mb-6">Request a demo</p>
        <h1 className="serif-display text-ink text-5xl mb-3">See Sofia in action.</h1>
        <p className="serif-italic text-stone text-lg mb-12">
          For brokerages, teams, and agents who want a live walkthrough. We'll show Sofia handling a real lead, Vesper generating a campaign, and the Grid surfacing motivation signals — on your data if you want.
        </p>
        <form action="/api/marketing/demo" method="POST" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div><Label>Full name</Label><Input name="full_name" required /></div>
            <div><Label>Email</Label><Input type="email" name="email" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div><Label>Brokerage</Label><Input name="brokerage" /></div>
            <div><Label>Agent count</Label><Input type="number" name="agent_count" /></div>
          </div>
          <div><Label>Preferred time</Label><Input name="preferred_time" placeholder="Tue/Thu 2-4pm ET" /></div>
          <div><Label>Anything specific you want to see?</Label><Textarea name="notes" rows={4} /></div>
          <Button type="submit" size="lg">Request Demo</Button>
        </form>
      </section>
    </main>
  );
}
