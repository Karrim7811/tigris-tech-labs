import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const SAMPLE = [
  { id: "1", address: "2150 Ocean Drive #PH4", city: "Miami Beach", price: 1395000, beds: 2, baths: 2, sqft: 1480, status: "active", vesper: "live" },
  { id: "2", address: "1287 Coral Way", city: "Coral Gables", price: 1850000, beds: 4, baths: 3, sqft: 2940, status: "active", vesper: "ready_for_review" },
  { id: "3", address: "448 Coconut Grove Dr", city: "Coconut Grove", price: 925000, beds: 3, baths: 2, sqft: 1820, status: "under_contract", vesper: "live" },
  { id: "4", address: "780 NW 12th Ave (4-plex)", city: "Miami", price: 1190000, beds: 8, baths: 4, sqft: 3760, status: "active", vesper: "generating" },
  { id: "5", address: "1500 Brickell Bay Dr #2902", city: "Miami", price: 1675000, beds: 2, baths: 2.5, sqft: 1690, status: "coming_soon", vesper: "pending" },
];

const STATUS_TONES: Record<string, "indigo" | "warm" | "cold" | "success" | "neutral"> = {
  active: "indigo",
  coming_soon: "warm",
  under_contract: "cold",
  pending: "warm",
  sold: "success",
};

const VESPER_TONES: Record<string, "indigo" | "warm" | "success" | "neutral"> = {
  pending: "neutral",
  generating: "warm",
  ready_for_review: "warm",
  live: "success",
};

export default function ListingsPage() {
  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="flex items-end justify-between mb-10">
        <div>
          <p className="eyebrow !text-indigo mb-2">Listings</p>
          <h1 className="serif-display text-ink text-5xl">Inventory.</h1>
          <p className="serif-italic text-stone text-base mt-2">{SAMPLE.length} listings · Vesper auto-triggers on Active.</p>
        </div>
        <Link href="/listings/new" className="btn-base bg-indigo text-parchment hover:bg-indigo-deep">
          <Plus className="w-4 h-4 mr-2" /> New listing
        </Link>
      </header>

      <div className="border border-mist bg-parchment">
        <div className="grid grid-cols-[2fr_1fr_120px_120px_120px] gap-4 px-5 py-3 border-b border-mist text-[10px] uppercase tracking-[0.22em] text-stone bg-bone">
          <div>Address</div>
          <div>City</div>
          <div className="text-right">Price</div>
          <div>Status</div>
          <div>Vesper</div>
        </div>
        {SAMPLE.map((l) => (
          <Link
            key={l.id}
            href={`/listings/${l.id}`}
            className="grid grid-cols-[2fr_1fr_120px_120px_120px] gap-4 px-5 py-5 items-center border-b border-mist hover:bg-bone transition-colors"
          >
            <div>
              <p className="text-sm text-ink font-medium">{l.address}</p>
              <p className="text-xs text-stone">{l.beds} bed · {l.baths} bath · {l.sqft.toLocaleString()} sqft</p>
            </div>
            <p className="text-sm text-smoke">{l.city}</p>
            <p className="text-sm text-ink text-right font-medium">{formatCurrency(l.price)}</p>
            <div><Badge tone={STATUS_TONES[l.status] || "neutral"}>{l.status.replace(/_/g, " ")}</Badge></div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-brass" />
              <Badge tone={VESPER_TONES[l.vesper] || "neutral"}>{l.vesper.replace(/_/g, " ")}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
