import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="px-10 py-12 max-w-5xl">
      <Link href="/inbox" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-stone hover:text-indigo mb-8">
        <ArrowLeft className="w-3 h-3" /> Inbox
      </Link>

      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Lead · {id}</p>
        <h1 className="serif-display text-ink text-5xl mb-3">Carlos Mendes</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="hot">Hot · 88</Badge>
          <Badge tone="indigo">Sofia voice · 14m ago</Badge>
          <Badge tone="brass">Investor · Cash</Badge>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          <div className="border border-mist bg-parchment p-8">
            <p className="eyebrow !text-brass mb-4">Sofia call summary</p>
            <p className="text-base text-smoke leading-relaxed mb-4">
              Brazilian investor in Miami for the week. Looking for a Brickell condo around $1.4M, all-cash, primary use as part-time + STR. Wants to see 2150 Ocean Drive Saturday morning. Pre-approved? Cash. FIRPTA discussed; investor's CPA is on standby.
            </p>
            <p className="text-xs text-stone leading-relaxed">
              <strong>Next action drafted:</strong> Confirm Saturday 10am showing at 2150 Ocean Drive · CC Sofia for ride coordination · prepare investor underwrite for the building's other available units.
            </p>
          </div>

          <div className="border border-mist bg-parchment p-8">
            <p className="eyebrow !text-brass mb-4">Transcript (excerpt)</p>
            <div className="space-y-4 text-sm">
              {[
                { who: "Sofia", txt: "Hi, I'm Sofia, an AI assistant for Thomas Bichi. How can I help you?" },
                { who: "Carlos", txt: "I saw 2150 Ocean Drive on your IG — is it still available?" },
                { who: "Sofia", txt: "It is. Two bedrooms, ocean view, $1.395M. Are you considering it for primary use, an investment, or both?" },
                { who: "Carlos", txt: "Both. Mostly investment. Maybe Airbnb when I'm not in town." },
                { who: "Sofia", txt: "Got it. The building allows 30+ day rentals only — Airbnb-style is restricted. I'll send you three buildings nearby that allow short-term. Pre-approved or paying cash?" },
                { who: "Carlos", txt: "Cash. Coming from São Paulo." },
                { who: "Sofia", txt: "Wonderful. Thomas will reach out within the hour. Saturday 10am works for the showing — confirmed?" },
                { who: "Carlos", txt: "Yes." },
              ].map((t, i) => (
                <div key={i} className={t.who === "Sofia" ? "" : "pl-8"}>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-brass mb-1">{t.who}</p>
                  <p className="text-smoke leading-relaxed">{t.txt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="border border-mist bg-bone p-5">
            <p className="eyebrow !text-brass mb-3">Contact</p>
            <p className="text-sm text-ink mb-1">Carlos Mendes</p>
            <p className="text-xs text-smoke">+55 11 9 8765-4321</p>
            <p className="text-xs text-smoke">cmendes@…</p>
            <p className="text-xs text-stone mt-3">Language · Portuguese / English</p>
          </div>
          <div className="border border-mist bg-bone p-5">
            <p className="eyebrow !text-brass mb-3">Actions</p>
            <button className="btn-base w-full bg-indigo text-parchment hover:bg-indigo-deep mb-2">Send investor underwrite</button>
            <button className="btn-base w-full bg-bone text-ink border border-mist hover:bg-mist mb-2">Confirm Saturday showing</button>
            <button className="btn-base w-full bg-bone text-ink border border-mist hover:bg-mist">Add to investor pipeline</button>
          </div>
        </aside>
      </section>
    </div>
  );
}
