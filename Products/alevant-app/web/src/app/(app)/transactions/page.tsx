import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const TX = [
  { id: "t1", address: "448 Coconut Grove Dr", side: "Buyer", price: 925000, expected_close: "2026-05-22", risk: "high", status: "Loan commitment overdue" },
  { id: "t2", address: "2150 Ocean Drive #PH4", side: "Seller", price: 1395000, expected_close: "2026-06-04", risk: "low", status: "Inspection complete · clean" },
  { id: "t3", address: "780 NW 12th Ave (4-plex)", side: "Investor", price: 1190000, expected_close: "2026-05-30", risk: "medium", status: "Appraisal pending" },
];

export default function TransactionsPage() {
  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Transaction Brain</p>
        <h1 className="serif-display text-ink text-5xl">Contract to close.</h1>
        <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
          DocuSign-aware orchestration. Auto-nudge for inspection, appraisal, loan, title, HOA, walk-through, closing. Risk flags on lender silence, appraisal gaps, inspection blowups.
        </p>
      </header>

      <div className="border border-mist bg-parchment">
        <div className="grid grid-cols-[40px_2fr_120px_140px_140px_1fr] gap-4 px-5 py-3 border-b border-mist text-[10px] uppercase tracking-[0.22em] text-stone bg-bone">
          <div></div>
          <div>Property</div>
          <div>Side</div>
          <div className="text-right">Price</div>
          <div>Close</div>
          <div>Status</div>
        </div>
        {TX.map((t) => {
          const Icon = t.risk === "high" ? AlertCircle : t.risk === "medium" ? Clock : CheckCircle2;
          const tone = t.risk === "high" ? "text-hot" : t.risk === "medium" ? "text-warm" : "text-success";
          return (
            <Link key={t.id} href={`/transactions/${t.id}`} className="grid grid-cols-[40px_2fr_120px_140px_140px_1fr] gap-4 px-5 py-5 items-center border-b border-mist last:border-b-0 hover:bg-bone transition-colors">
              <Icon className={`w-4 h-4 ${tone}`} />
              <p className="text-sm text-ink font-medium">{t.address}</p>
              <Badge tone="indigo">{t.side}</Badge>
              <p className="text-sm text-ink text-right font-medium">{formatCurrency(t.price)}</p>
              <p className="text-xs text-stone">{t.expected_close}</p>
              <p className="text-sm text-smoke">{t.status}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
