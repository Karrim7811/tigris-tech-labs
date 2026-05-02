import Link from "next/link";
import { Wordmark } from "@/components/alevant/wordmark";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PLANS = [
  {
    id: "agent",
    name: "Agent",
    price: 399,
    badge: null,
    description: "For the producing solo agent.",
    features: [
      "Sofia voice ISA · 24/7",
      "Vesper marketing director · 1 voice preset",
      "The Grid · 5 farm zones",
      "Underwriter · CMA + investor MF",
      "Listings + microsites · unlimited",
      "Transaction Brain · DocuSign integrated",
      "Sphere Brain · daily right-calls",
      "2,000 Sofia voice minutes / mo",
      "Email + chat support",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: 999,
    badge: "Most Popular",
    description: "For producing teams up to 5 agents.",
    features: [
      "Everything in Agent",
      "Up to 5 agent seats",
      "Team admin dashboard",
      "Cross-agent reporting",
      "Shared brand kit + voice presets",
      "10,000 Sofia voice minutes / mo",
      "Priority support",
    ],
  },
  {
    id: "brokerage",
    name: "Brokerage",
    price: 4999,
    badge: "Enterprise",
    description: "For brokerages 10-500 agents.",
    features: [
      "Everything in Team",
      "Up to 50 seats included · expandable",
      "White-label tenant branding",
      "Brokerage admin · cross-team reporting",
      "SSO · SAML · SCIM",
      "Azure Foundry deployment available",
      "50,000 Sofia voice minutes / mo",
      "Dedicated CSM + onboarding",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-parchment">
      <header className="fixed top-0 inset-x-0 z-50 h-16 px-10 flex items-center justify-between bg-parchment/90 backdrop-blur-md border-b border-mist">
        <Link href="/"><Wordmark size="sm" /></Link>
        <nav className="flex gap-6 text-[11px] uppercase tracking-[0.18em] text-stone">
          <Link href="/" className="hover:text-indigo">How it works</Link>
          <Link href="/pricing" className="text-indigo">Pricing</Link>
          <Link href="/demo" className="hover:text-indigo">Demo</Link>
          <Link href="/login" className="hover:text-indigo">Login</Link>
        </nav>
      </header>

      <section className="px-10 pt-32 pb-12 text-center bg-bone border-b border-mist">
        <p className="eyebrow !text-indigo mb-6">Pricing</p>
        <h1 className="serif-display text-ink text-6xl mb-4">Choose your tier.</h1>
        <p className="serif-italic text-stone text-xl max-w-2xl mx-auto">
          Pilot tenants run free for 90 days. After: Agent, Team, or Brokerage. All plans include Sofia, Vesper, the Grid, and the Underwriter.
        </p>
      </section>

      <section className="px-10 py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((p) => (
            <div key={p.id} className={`border ${p.badge === "Most Popular" ? "border-indigo bg-indigo/5" : "border-mist bg-parchment"} p-10 flex flex-col`}>
              {p.badge && <span className="text-[10px] uppercase tracking-[0.32em] text-brass mb-4">{p.badge}</span>}
              <p className="serif-display text-ink text-3xl mb-2">{p.name}</p>
              <p className="text-sm text-stone mb-6">{p.description}</p>
              <p className="serif-display text-ink text-5xl mb-1">${p.price.toLocaleString()}</p>
              <p className="text-xs uppercase tracking-[0.22em] text-stone mb-8">per month · billed monthly</p>
              <ul className="space-y-3 mb-10 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-smoke">
                    <Check className="w-4 h-4 text-indigo flex-shrink-0 mt-0.5" /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={p.id === "brokerage" ? "/demo" : `/signup?plan=${p.id}`} className="w-full">
                <Button className="w-full" variant={p.badge === "Most Popular" ? "primary" : "ghost"}>
                  {p.id === "brokerage" ? "Talk to Sales" : "Start Trial"}
                </Button>
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-stone mt-12 leading-relaxed max-w-3xl mx-auto">
          Pilot tenants get 90 days free, full feature access. Pricing on Sofia voice minutes, Vesper credits, and Grid signal volume scales transparently — see the <Link href="/docs/usage" className="text-indigo">usage limits doc</Link>. SOC 2 Type II in progress; Azure Foundry available for enterprise.
        </p>
      </section>
    </main>
  );
}
