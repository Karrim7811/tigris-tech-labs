import Link from "next/link";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // V1: server-fetch listing record by id from Supabase via service client.
  // Stubbed presentation while wiring up.
  return (
    <div className="px-10 py-12 max-w-7xl">
      <Link href="/listings" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-stone hover:text-indigo mb-6">
        <ArrowLeft className="w-3 h-3" /> Listings
      </Link>

      <header className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mb-10">
        <div>
          <p className="eyebrow !text-indigo mb-2">Listing · {id}</p>
          <h1 className="serif-display text-ink text-5xl mb-2">2150 Ocean Drive #PH4</h1>
          <p className="serif-italic text-stone text-lg">Miami Beach · 2 bed · 2 bath · 1,480 sqft</p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Badge tone="indigo">Active</Badge>
            <Badge tone="brass">{formatCurrency(1395000)}</Badge>
            <Badge tone="success">Vesper · Live</Badge>
          </div>
        </div>
        <div className="space-y-2">
          <a href="#" className="btn-base w-full bg-indigo text-parchment hover:bg-indigo-deep">
            <ExternalLink className="w-4 h-4 mr-2" /> View microsite
          </a>
          <a href="#" className="btn-base w-full bg-bone text-ink border border-mist hover:bg-mist">Edit listing</a>
          <a href="#" className="btn-base w-full bg-bone text-ink border border-mist hover:bg-mist">Run new CMA</a>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-mist bg-parchment p-8">
            <p className="eyebrow !text-brass mb-4">Description</p>
            <p className="text-base text-smoke leading-relaxed">
              Penthouse overlooking the Atlantic. Two bedrooms, two and a half baths, private rooftop terrace. Recently refinished oak floors and a renovated kitchen with Sub-Zero, Wolf, and Miele.
            </p>
          </div>

          <div className="border border-mist bg-parchment p-8">
            <p className="eyebrow !text-brass mb-4 flex items-center gap-2"><Sparkles className="w-3 h-3 text-brass" /> Vesper campaign</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                ["Listing film", "live"],
                ["Microsite", "live"],
                ["Brochure", "live"],
                ["IG · 14 posts", "live"],
                ["X · 14 posts", "live"],
                ["TikTok · 14 posts", "live"],
                ["LinkedIn · 14 posts", "live"],
                ["Sphere email", "sent"],
                ["Buyer matches · 47", "sent"],
                ["Open house event", "live"],
                ["Whisper preview · top 50", "sent"],
                ["Press pitch — Mansion Global", "drafted"],
              ].map(([label, status]) => (
                <div key={label} className="border border-mist p-3 bg-bone">
                  <p className="text-xs text-ink font-medium">{label}</p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-success mt-1">{status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="border border-mist bg-bone p-5">
            <p className="eyebrow !text-brass mb-3">Performance</p>
            <p className="text-xs text-stone">Days on market</p>
            <p className="serif-display text-ink text-3xl mb-3">12</p>
            <p className="text-xs text-stone">Showing requests</p>
            <p className="serif-display text-ink text-3xl mb-3">9</p>
            <p className="text-xs text-stone">Microsite views</p>
            <p className="serif-display text-ink text-3xl">847</p>
          </div>
          <div className="border border-mist bg-bone p-5">
            <p className="eyebrow !text-brass mb-3">Buyer matches</p>
            <p className="text-sm text-ink mb-2">47 in your buyer pipeline matched.</p>
            <a href="#" className="text-xs text-indigo hover:underline">Review matches →</a>
          </div>
        </aside>
      </section>
    </div>
  );
}
