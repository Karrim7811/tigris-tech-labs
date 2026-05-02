import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertCircle, CheckCircle2, Circle, Clock } from "lucide-react";
import { getSupabaseService } from "@/lib/supabase/server";
import { detectRisks } from "@/lib/transaction-brain";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const STATUS_ICONS = {
  completed: CheckCircle2,
  in_progress: Clock,
  pending: Circle,
  at_risk: AlertCircle,
  blocked: AlertCircle,
};

export default async function TransactionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const svc = getSupabaseService();
  const { data: tx } = await svc.from("transactions").select("*, listings(*)").eq("id", id).maybeSingle();
  if (!tx) return notFound();

  const timeline = (tx.timeline_json as any[]) || [];
  const risks = detectRisks({ timeline, contractPrice: tx.contract_price ?? undefined });

  return (
    <div className="px-10 py-12 max-w-7xl">
      <Link href="/transactions" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-stone hover:text-indigo mb-6">
        <ArrowLeft className="w-3 h-3" /> Transactions
      </Link>

      <header className="mb-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <p className="eyebrow !text-indigo mb-2">Transaction · {id.slice(0, 8)}</p>
          <h1 className="serif-display text-ink text-5xl">{tx.property_address}</h1>
          <p className="serif-italic text-stone text-lg mt-2">
            {tx.side.toUpperCase()} side · contract {tx.contract_date} · expected close {tx.expected_close}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Badge tone="indigo">{tx.status}</Badge>
            {tx.contract_price && <Badge tone="brass">{formatCurrency(tx.contract_price)}</Badge>}
            {risks.length > 0 && <Badge tone="hot">{risks.length} risk{risks.length === 1 ? "" : "s"}</Badge>}
          </div>
        </div>
      </header>

      {risks.length > 0 && (
        <section className="mb-10">
          <p className="eyebrow !text-brass mb-4">Risk flags</p>
          <div className="space-y-3">
            {risks.map((r, i) => (
              <div key={i} className="border border-mist bg-parchment p-5 grid grid-cols-[40px_1fr_120px] gap-4 items-start">
                <AlertCircle className={`w-5 h-5 ${r.severity === "high" ? "text-hot" : r.severity === "medium" ? "text-warm" : "text-stone"}`} />
                <div>
                  <p className="text-sm text-ink font-medium mb-1">{r.reason}</p>
                  <p className="text-xs text-smoke leading-relaxed">{r.suggested_action}</p>
                </div>
                <Badge tone={r.severity === "high" ? "hot" : r.severity === "medium" ? "warm" : "neutral"}>{r.severity}</Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="eyebrow !text-brass mb-4">Timeline</p>
        <div className="border border-mist bg-parchment">
          {timeline.map((m: any, i: number) => {
            const Icon = STATUS_ICONS[m.status as keyof typeof STATUS_ICONS] || Circle;
            return (
              <div key={i} className="grid grid-cols-[40px_1fr_140px_140px] gap-4 px-5 py-5 items-center border-b border-mist last:border-b-0">
                <Icon className={`w-4 h-4 ${m.status === "completed" ? "text-success" : m.status === "at_risk" ? "text-hot" : "text-stone"}`} />
                <div>
                  <p className="text-sm text-ink font-medium">{m.label}</p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-stone mt-1">{m.responsible_party}</p>
                </div>
                <p className="text-xs text-stone">{m.due_date}</p>
                <Badge tone={m.status === "completed" ? "success" : m.status === "at_risk" ? "hot" : "neutral"}>{m.status}</Badge>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
