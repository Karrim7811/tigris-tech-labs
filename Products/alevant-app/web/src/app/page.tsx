import Link from "next/link";
import { Wordmark } from "@/components/alevant/wordmark";
import { Button } from "@/components/ui/button";

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-parchment text-smoke">
      {/* Topbar */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 px-10 flex items-center justify-between bg-parchment/90 backdrop-blur-md border-b border-mist">
        <Wordmark size="sm" />
        <nav className="hidden md:flex gap-8 text-[11px] uppercase tracking-[0.18em] text-stone">
          <a href="#stack" className="hover:text-indigo transition-colors">Replacement</a>
          <a href="#sofia" className="hover:text-indigo transition-colors">Sofia</a>
          <a href="#vesper" className="hover:text-indigo transition-colors">Vesper</a>
          <a href="#grid" className="hover:text-indigo transition-colors">The Grid</a>
        </nav>
        <Link href="/signup">
          <Button size="sm">Request Access</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-10 pt-32 pb-20 bg-bone border-b border-mist text-center overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 w-[1100px] h-[1100px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(circle, rgba(61,79,140,0.10) 0%, transparent 65%)",
          }}
        />
        <p className="relative z-10 eyebrow !text-indigo mb-8">A Tigris Tech Labs Product</p>
        <h1 className="relative z-10 serif-display text-ink leading-[0.95]"
            style={{ fontSize: "clamp(48px, 7vw, 96px)", maxWidth: 1100 }}>
          The AI <em className="serif-italic text-indigo">Operating System</em><br/>for Real Estate.
        </h1>
        <p className="relative z-10 serif-italic mt-8 text-smoke" style={{ fontSize: "clamp(18px, 2.4vw, 26px)", maxWidth: 760 }}>
          A single platform that replaces the inside sales agent, the marketing director, the transaction coordinator, and the sphere manager — purpose-built for the modern producing agent.
        </p>
        <div className="relative z-10 flex flex-wrap gap-12 mt-16 text-[10px] uppercase tracking-[0.22em] text-stone">
          <span>Voice ISA · 24/7</span>
          <span>$10M-tier marketing</span>
          <span>Predictive seller leads</span>
          <span>Multi-tenant SaaS</span>
        </div>
        <div className="relative z-10 mt-12 flex gap-4">
          <Link href="/signup"><Button size="lg">Start Onboarding</Button></Link>
          <Link href="#sofia"><Button variant="ghost" size="lg">See How It Works</Button></Link>
        </div>
      </section>

      {/* Replacement */}
      <section id="stack" className="px-10 py-32 max-w-7xl mx-auto">
        <p className="serif-italic text-brass text-5xl mb-2">01</p>
        <h2 className="serif-display text-ink text-5xl mb-6">What ALEVANT Replaces.</h2>
        <p className="text-base text-smoke max-w-2xl leading-relaxed mb-16">
          A producing agent today carries four expensive, hard-to-hire, hard-to-keep human roles. ALEVANT replaces all four with a single platform powered by Claude. The math, on Day One, is brutal in the agent's favor.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { old: "Inside Sales Agent", cost: "$40k–$70k base + commission", newName: "Sofia", newDesc: "Voice + text ISA. 24/7." },
            { old: "Marketing Director", cost: "$50k–$90k", newName: "Vesper", newDesc: "$10M-tier creative on demand." },
            { old: "Transaction Coordinator", cost: "$40k–$60k or $300–500/deal", newName: "Transaction Brain", newDesc: "Orchestrates contract → close." },
            { old: "Sphere Manager", cost: "$30k–$50k", newName: "Sphere Brain", newDesc: "Surfaces today's right call." },
          ].map((r) => (
            <div key={r.old} className="bg-parchment border border-mist p-8 hover:border-indigo transition-colors">
              <p className="eyebrow !text-brass mb-3">Replaced</p>
              <p className="serif-display text-ink text-2xl mb-2">{r.old}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-stone mb-8">{r.cost}</p>
              <p className="serif-italic text-brass text-3xl mb-6">↓</p>
              <p className="serif-italic text-indigo text-3xl mb-2">{r.newName}</p>
              <p className="text-xs text-smoke">{r.newDesc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sofia + Vesper */}
      <section id="sofia" className="px-10 py-32 bg-bone">
        <div className="max-w-7xl mx-auto">
          <p className="serif-italic text-brass text-5xl mb-2">02</p>
          <h2 className="serif-display text-ink text-5xl mb-6">Two AI Personas.</h2>
          <p className="text-base text-smoke max-w-2xl leading-relaxed mb-16">
            ALEVANT is anchored by two named AI personas the agent works with daily. Each has a calibrated voice, a clear scope, and a strict compliance perimeter.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 border border-mist">
            <div className="p-12 bg-ink text-parchment border-b md:border-b-0 md:border-r border-mist">
              <p className="text-[10px] uppercase tracking-[0.32em] text-brass mb-4">Persona 01 · Voice ISA</p>
              <p className="serif-italic font-light text-7xl mb-6">Sofia</p>
              <p className="serif-italic text-2xl mb-8 text-parchment/85 leading-relaxed">"Hi, I'm Sofia — the AI assistant for Thomas. What are you looking for?"</p>
              <ul className="text-xs space-y-2 text-parchment/70">
                <li>· Voice + SMS + IG/X/TikTok/LinkedIn DMs</li>
                <li>· Answers inbound in under 10 seconds</li>
                <li>· 24/7 — agent owns the live hours, Sofia covers overflow</li>
                <li>· Strict TCPA, AI-disclosure on by default</li>
                <li>· Hands hot leads to agent in &lt;60s</li>
              </ul>
            </div>
            <div id="vesper" className="p-12 bg-indigo text-parchment">
              <p className="text-[10px] uppercase tracking-[0.32em] text-brass mb-4">Persona 02 · Marketing Director</p>
              <p className="serif-italic font-light text-7xl mb-6">Vesper</p>
              <p className="serif-italic text-2xl mb-8 text-parchment/85 leading-relaxed">"Six bedrooms. The view at sunrise."</p>
              <ul className="text-xs space-y-2 text-parchment/70">
                <li>· $10M-tier brand creative — Sotheby's / Aman caliber</li>
                <li>· 12 deliverables per listing in &lt;24 hours</li>
                <li>· IG · X · TikTok · LinkedIn · YouTube · Email · Print</li>
                <li>· Fair Housing strict — not bypassable</li>
                <li>· Approval-gated, graduates to autonomous</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The Grid */}
      <section id="grid" className="px-10 py-32 max-w-7xl mx-auto">
        <p className="serif-italic text-brass text-5xl mb-2">03</p>
        <h2 className="serif-display text-ink text-5xl mb-6">The Grid.</h2>
        <p className="text-base text-smoke max-w-2xl leading-relaxed mb-16">
          A predictive seller-lead engine that scores every home in your farm zip codes for likelihood-to-list within 12 months. Tenure, equity, distress, life events, market velocity — fused into a composite Motivation Score and ranked daily. Vesper drafts the outreach. Sofia handles inbound. The agent works the top 20.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-mist border border-mist">
          {[
            { tier: "Blazing", range: "80–100", desc: "Pre-foreclosure, probate, divorce, or 13+ year tenure with high equity." },
            { tier: "Hot", range: "65–79", desc: "Two or more motivation factors. Worth a personalized direct mail + IG ad." },
            { tier: "Warm", range: "45–64", desc: "Single life-event signal or strong equity position. Drip campaign." },
          ].map((t) => (
            <div key={t.tier} className="bg-parchment p-8">
              <p className="serif-italic text-brass text-2xl mb-2">{t.tier}</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone mb-6">Score {t.range}</p>
              <p className="text-sm text-smoke leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-stone py-20 px-10 text-center">
        <Wordmark className="text-parchment text-5xl mb-4" />
        <p className="serif-italic text-parchment/60 text-lg mb-12">Where real estate intelligence begins.</p>
        <div className="flex justify-center gap-8 text-[10px] uppercase tracking-[0.22em] text-parchment/40 mb-8">
          <Link href="/signup">Request Access</Link>
          <Link href="/login">Login</Link>
          <a href="mailto:hello@alevant.ai">Contact</a>
        </div>
        <p className="text-[10px] uppercase tracking-[0.32em] text-parchment/40">A Tigris Tech Labs Product</p>
      </footer>
    </main>
  );
}
