import Link from "next/link";
import { Wordmark } from "@/components/alevant/wordmark";

const STAGES = [
  { num: 1, slug: "identity", label: "Identity" },
  { num: 2, slug: "brokerage", label: "Brokerage" },
  { num: 3, slug: "brand", label: "Brand Kit" },
  { num: 4, slug: "connections", label: "Connections" },
  { num: 5, slug: "sofia", label: "Sofia" },
  { num: 6, slug: "sphere", label: "Sphere" },
  { num: 7, slug: "pipeline", label: "Pipeline" },
  { num: 8, slug: "marketing", label: "Marketing" },
  { num: 9, slug: "compliance", label: "Compliance" },
];

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <header className="px-10 py-6 border-b border-mist bg-parchment sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/"><Wordmark size="sm" /></Link>
          <p className="text-[10px] uppercase tracking-[0.22em] text-stone">Onboarding · Phase 1</p>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-0 flex-1 max-w-6xl w-full mx-auto">
        <aside className="hidden md:block border-r border-mist bg-bone p-8">
          <p className="eyebrow mb-6">Stages</p>
          <ol className="space-y-3">
            {STAGES.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/onboard/${s.slug}`}
                  className="flex items-baseline gap-3 group"
                >
                  <span className="serif-italic text-brass text-sm w-6">{String(s.num).padStart(2, "0")}</span>
                  <span className="text-sm text-ink group-hover:text-indigo transition-colors">{s.label}</span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
        <main className="p-10 md:p-16">{children}</main>
      </div>
    </div>
  );
}
