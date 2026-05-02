import { Phone, Settings, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";

const RECENT_CONVS = [
  { id: "c1", channel: "voice" as const, caller: "Carlos Mendes", duration: 247, qualification: 88, status: "escalated" as const, summary: "Brazilian investor · Brickell condo $1.4M cash · Saturday showing booked.", started: new Date(Date.now() - 1000 * 60 * 14).toISOString() },
  { id: "c2", channel: "ig_dm" as const, caller: "Andrea Castillo", duration: 0, qualification: 76, status: "completed" as const, summary: "Coral Gables 4BR · CMA requested · 60-day timeline.", started: new Date(Date.now() - 1000 * 60 * 47).toISOString() },
  { id: "c3", channel: "voice" as const, caller: "(unknown)", duration: 92, qualification: 32, status: "completed" as const, summary: "Tire-kicker · no budget · referred to web search.", started: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
];

export default function SofiaPage() {
  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="flex items-end justify-between mb-10">
        <div>
          <p className="eyebrow !text-indigo mb-2">Sofia</p>
          <h1 className="serif-display text-ink text-5xl">Voice ISA control room.</h1>
          <p className="serif-italic text-stone text-base mt-2">+1 (305) 555-0184 · 24/7 · Live handoff Mon-Sat 8:30am – 6pm</p>
        </div>
        <button className="btn-base bg-bone text-ink border border-mist hover:bg-mist">
          <Settings className="w-4 h-4 mr-2" /> Configure
        </button>
      </header>

      {/* Status strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-mist border border-mist mb-10">
        <div className="bg-parchment p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.22em] text-success">Online</p>
          </div>
          <p className="serif-display text-ink text-3xl">Live</p>
          <p className="text-xs text-stone mt-1">Twilio · Retell · ElevenLabs</p>
        </div>
        <div className="bg-parchment p-6">
          <p className="text-[10px] uppercase tracking-[0.22em] text-stone mb-2">Today's calls</p>
          <p className="serif-display text-ink text-3xl">12</p>
          <p className="text-xs text-success mt-1">3 escalated</p>
        </div>
        <div className="bg-parchment p-6">
          <p className="text-[10px] uppercase tracking-[0.22em] text-stone mb-2">Avg pickup</p>
          <p className="serif-display text-ink text-3xl">8s</p>
          <p className="text-xs text-stone mt-1">Target &lt;10s</p>
        </div>
        <div className="bg-parchment p-6">
          <p className="text-[10px] uppercase tracking-[0.22em] text-stone mb-2">Avg qualification</p>
          <p className="serif-display text-ink text-3xl">64</p>
          <p className="text-xs text-stone mt-1">Threshold: 70</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <p className="eyebrow !text-brass mb-4">Recent conversations</p>
          <div className="border border-mist bg-parchment">
            {RECENT_CONVS.map((c) => (
              <div key={c.id} className="grid grid-cols-[40px_1fr_80px] gap-4 px-5 py-5 items-start border-b border-mist last:border-b-0">
                {c.channel === "voice" ? <Phone className="w-4 h-4 text-stone mt-1" /> : <MessageCircle className="w-4 h-4 text-stone mt-1" />}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-ink font-medium">{c.caller}</p>
                    <Badge tone={c.qualification >= 70 ? "hot" : c.qualification >= 40 ? "warm" : "cold"}>{c.qualification}</Badge>
                    {c.status === "escalated" && <Badge tone="success">escalated</Badge>}
                  </div>
                  <p className="text-sm text-smoke leading-relaxed">{c.summary}</p>
                  {c.duration > 0 && (
                    <p className="text-xs text-stone mt-2">{Math.floor(c.duration / 60)}:{String(c.duration % 60).padStart(2, "0")} · {c.channel}</p>
                  )}
                </div>
                <p className="text-xs text-stone text-right">{relativeTime(c.started)}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="border border-mist bg-bone p-6">
            <p className="eyebrow !text-brass mb-3">Voice preview</p>
            <p className="serif-italic text-base text-smoke leading-relaxed mb-4">
              "Hi, I'm Sofia, an AI assistant for Thomas Bichi. How can I help you?"
            </p>
            <button className="btn-base w-full bg-indigo text-parchment hover:bg-indigo-deep">▶ Play sample</button>
          </div>
          <div className="border border-mist bg-bone p-6">
            <p className="eyebrow !text-brass mb-3">Tools available to Sofia</p>
            <ul className="text-xs space-y-2 text-smoke">
              <li>· searchListings · getListingDetails</li>
              <li>· bookShowing (Calendar OAuth)</li>
              <li>· createOrUpdateLead</li>
              <li>· qualifyLead</li>
              <li>· escalateToAgent (push + ring)</li>
              <li>· sendListingPDF</li>
              <li>· addToSphere</li>
              <li>· flagFairHousingConcern</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
