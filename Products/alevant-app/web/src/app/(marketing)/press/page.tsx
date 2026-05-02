import { Wordmark } from "@/components/alevant/wordmark";
import Link from "next/link";
import { Download } from "lucide-react";

export default function PressPage() {
  return (
    <main className="min-h-screen bg-parchment">
      <header className="px-10 py-6 border-b border-mist">
        <Link href="/"><Wordmark size="sm" /></Link>
      </header>

      <section className="px-10 py-20 max-w-4xl mx-auto">
        <p className="eyebrow !text-indigo mb-6">Press</p>
        <h1 className="serif-display text-ink text-6xl mb-6">For reporters.</h1>
        <p className="serif-italic text-stone text-lg mb-12 max-w-2xl">
          ALEVANT is the AI Operating System for real estate. Sofia, the voice ISA, picks up the phone in under 10 seconds, in three languages, 24/7. Vesper produces magazine-tier marketing campaigns at the level of Sotheby's and Aman. The Grid scores every home in an agent's farm zip codes for likelihood-to-list within twelve months.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="border border-mist p-8">
            <p className="eyebrow !text-brass mb-3">The pitch</p>
            <p className="text-base text-smoke leading-relaxed">
              ALEVANT replaces the four most expensive non-agent roles in a producing real-estate practice — inside sales, marketing, transaction coordination, sphere management — with a single Claude-powered platform. A solo agent recovers $160k–$270k of annual operating cost.
            </p>
          </div>
          <div className="border border-mist p-8">
            <p className="eyebrow !text-brass mb-3">Pilot</p>
            <p className="text-base text-smoke leading-relaxed">
              Thomas Bichi, top-producing Keller Williams agent in Coral Gables FL, is the inaugural tenant. Investor + residential, Miami Beach SoFi specialty, multilingual market. Public launch tracking 2026 H2.
            </p>
          </div>
        </div>

        <div className="border border-mist p-8 mb-12">
          <p className="eyebrow !text-brass mb-3">Press kit</p>
          <ul className="space-y-3">
            <li><a href="/press/alevant-press-kit.zip" className="inline-flex items-center gap-2 text-sm text-indigo hover:underline"><Download className="w-3 h-3" /> Press kit (logos, screenshots, fact sheet) — ZIP</a></li>
            <li><a href="/press/founder-photos.zip" className="inline-flex items-center gap-2 text-sm text-indigo hover:underline"><Download className="w-3 h-3" /> Founder photography — ZIP</a></li>
            <li><a href="/press/alevant-fact-sheet.pdf" className="inline-flex items-center gap-2 text-sm text-indigo hover:underline"><Download className="w-3 h-3" /> One-page fact sheet — PDF</a></li>
          </ul>
        </div>

        <div className="border-t border-mist pt-8">
          <p className="eyebrow !text-brass mb-3">Press contact</p>
          <p className="text-sm text-ink">press@alevant.ai</p>
          <p className="text-xs text-stone mt-1">Response within 4 business hours.</p>
        </div>
      </section>
    </main>
  );
}
