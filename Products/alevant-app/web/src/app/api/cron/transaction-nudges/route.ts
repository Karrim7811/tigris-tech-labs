import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import { dueNudges, detectRisks } from "@/lib/transaction-brain";

/**
 * Daily cron — for each active transaction, compute due nudges + risk flags,
 * persist risk_flags on transaction, increment nudges_sent on milestones.
 *
 * Sending the actual email/SMS happens via Sofia (which respects consent).
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.VERCEL_ENV === "production" && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = getSupabaseService();
  const { data: txs } = await svc
    .from("transactions")
    .select("id, workspace_id, timeline_json, contract_price, risk_flags")
    .eq("status", "active");

  let totalNudges = 0;
  let txWithRisk = 0;

  for (const tx of txs || []) {
    const timeline = (tx.timeline_json as any[]) || [];
    const nudges = dueNudges(timeline);
    totalNudges += nudges.length;

    const risks = detectRisks({
      timeline,
      contractPrice: tx.contract_price ?? undefined,
    });
    if (risks.length) txWithRisk++;

    await svc
      .from("transactions")
      .update({ risk_flags: risks })
      .eq("id", tx.id);

    for (const n of nudges) {
      await svc.from("transaction_milestones")
        .update({ nudges_sent: { increment: 1 } as any })
        .eq("transaction_id", tx.id)
        .eq("type", n.milestone);
    }
  }

  return NextResponse.json({
    transactions_scanned: txs?.length || 0,
    nudges_due: totalNudges,
    transactions_with_risk: txWithRisk,
  });
}
