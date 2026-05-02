import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const KINDS = {
  buyer: {
    title: "Buyers",
    intro: "Active buyer pipeline. Stages enforce buyer-broker agreement gating before any showing booking (NAR settlement compliance).",
    stages: ["Inquiry", "Pre-Qual", "Showing", "Offer", "Under Contract", "Closed", "Lost"],
    sample: [
      { name: "Carlos Mendes", stage: "Pre-Qual", value: 1400000, note: "Cash · BRZ · Brickell" },
      { name: "Sarah Kim", stage: "Showing", value: 850000, note: "Pre-app · Coconut Grove" },
      { name: "Marcus Webb", stage: "Offer", value: 1250000, note: "Counter sent · Gables" },
      { name: "Andrea P.", stage: "Under Contract", value: 925000, note: "Closing 5/22" },
    ],
  },
  seller: {
    title: "Sellers",
    intro: "Listing pipeline. Vesper auto-triggers when a listing transitions to Active.",
    stages: ["Inquiry", "Listing Pres Booked", "Listing Pres Done", "Signed", "Active", "Pending", "Closed", "Lost"],
    sample: [
      { name: "Daniela Pinto", stage: "Listing Pres Booked", value: 1850000, note: "Coral Gables 4BR" },
      { name: "Rene Suarez", stage: "Signed", value: 1395000, note: "2150 Ocean Drive" },
      { name: "Marina Voss", stage: "Active", value: 1675000, note: "1500 Brickell Bay" },
    ],
  },
  investor: {
    title: "Investors",
    intro: "Investor deal pipeline — acquisition, 1031, development, assignment. Underwriter auto-runs on every property.",
    stages: ["Sourcing", "Underwriting", "LOI", "Contract", "Due Diligence", "Close"],
    sample: [
      { name: "Renato Torres", stage: "Underwriting", value: 4200000, note: "1031 · 8-unit MF" },
      { name: "Capital Holdings LLC", stage: "LOI", value: 2900000, note: "Brickell triplex" },
      { name: "VV Family Office", stage: "Sourcing", value: 6500000, note: "Pre-con condo block" },
    ],
  },
  rental: {
    title: "Rentals",
    intro: "High-velocity. Speed-to-lead matters. Sofia handles inbound qualification end-to-end.",
    stages: ["Inquiry", "Application", "Approved", "Lease Signed", "Move-In"],
    sample: [
      { name: "John Reyes", stage: "Application", value: 4500, note: "1BR Brickell · 6mo" },
      { name: "Beatriz N.", stage: "Lease Signed", value: 6800, note: "2BR Coral Gables · 12mo" },
      { name: "Hugo Fischer", stage: "Inquiry", value: 8500, note: "3BR SoFi · 12mo" },
    ],
  },
} as const;

type Kind = keyof typeof KINDS;

export default async function PipelinePage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!(kind in KINDS)) return notFound();
  const cfg = KINDS[kind as Kind];

  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Pipeline · {cfg.title}</p>
        <h1 className="serif-display text-ink text-5xl">{cfg.title}.</h1>
        <p className="serif-italic text-stone text-base mt-2 max-w-3xl">{cfg.intro}</p>
      </header>

      <div className="overflow-x-auto pb-8">
        <div className="flex gap-3 min-w-max">
          {cfg.stages.map((stage) => {
            const items = cfg.sample.filter((s) => s.stage === stage);
            return (
              <div key={stage} className="w-72 flex-shrink-0 bg-bone border border-mist">
                <div className="p-4 border-b border-mist">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-brass">{stage}</p>
                  <p className="text-xs text-stone mt-1">{items.length} {items.length === 1 ? "deal" : "deals"}</p>
                </div>
                <div className="p-3 space-y-3">
                  {items.length === 0 ? (
                    <p className="text-xs text-stone py-6 text-center">—</p>
                  ) : items.map((item, i) => (
                    <div key={i} className="bg-parchment border border-mist p-4 hover:border-indigo cursor-pointer transition-colors">
                      <p className="text-sm text-ink font-medium mb-1">{item.name}</p>
                      <p className="text-xs text-stone mb-2">{item.note}</p>
                      <Badge tone="indigo">{kind === "rental" ? `${formatCurrency(item.value)}/mo` : formatCurrency(item.value, { compact: true })}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
