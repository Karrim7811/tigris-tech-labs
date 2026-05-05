import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { fuseAddressSignals, fusedToGridInputs } from "@/lib/scrapers/florida";
import { runClaudeJSON } from "@/lib/anthropic";
import { GRID_REASON_SYSTEM, gridReasonPrompt } from "@/lib/prompts/grid";
import { scoreGridSignal } from "@/lib/grid-engine";

export const maxDuration = 60;

/**
 * POST /api/grid/scan — scan a list of addresses, fuse public records, score them, persist as grid_signals.
 * Body: { addresses: string[], zip?: string, county?: string, include_str_market?: boolean, include_mls_market?: boolean }
 *   OR: { zone_id: uuid }   — uses the workspace's grid_farm_zones row (TBD: address generation per zone)
 */
export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getSupabaseService();
  const { data: ws } = await svc.from("workspaces").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const body = await req.json();
  const addresses: string[] = body.addresses || [];
  if (!addresses.length) return NextResponse.json({ error: "addresses required" }, { status: 400 });

  const results: Array<{ address: string; ok: boolean; signal_id?: string; motivation?: number; error?: string }> = [];

  // Fan-out with bounded concurrency
  const BATCH = 5;
  for (let i = 0; i < addresses.length; i += BATCH) {
    const slice = addresses.slice(i, i + BATCH);
    await Promise.all(
      slice.map(async (addr) => {
        try {
          const fused = await fuseAddressSignals({
            address: addr,
            zip: body.zip,
            county: body.county,
            include_str_market: body.include_str_market,
          });
          if (!fused) {
            results.push({ address: addr, ok: false, error: "no public record found" });
            return;
          }
          const inputs = fusedToGridInputs(fused);
          const score = scoreGridSignal({
            years_owned: inputs.years_owned,
            estimated_value: inputs.estimated_value,
            estimated_mortgage_balance: inputs.estimated_mortgage_balance,
            estimated_equity: inputs.estimated_equity,
            is_pre_foreclosure: inputs.is_pre_foreclosure,
            is_tax_delinquent: inputs.is_tax_delinquent,
            has_code_violations: inputs.has_code_violations,
            has_hoa_delinquency: inputs.has_hoa_delinquency,
            is_vacant: inputs.is_vacant,
            is_absentee_owner: inputs.is_absentee_owner,
            is_probate: inputs.is_probate,
            is_divorce: inputs.is_divorce,
            is_senior_owner: inputs.is_senior_owner,
          });

          let reasons = { reasons_summary: `Composite motivation ${score.motivation_score}/100.`, reasons: [] as string[] };
          try {
            reasons = await runClaudeJSON({
              tier: "fast",
              system: GRID_REASON_SYSTEM,
              user: gridReasonPrompt({
                property_address: inputs.property_address,
                estimated_value: inputs.estimated_value,
                estimated_equity: inputs.estimated_equity,
                years_owned: inputs.years_owned,
                motivation_score: score.motivation_score,
                components: {
                  tenure_score: score.tenure_score,
                  equity_score: score.equity_score,
                  distress_score: score.distress_score,
                  life_event_score: score.life_event_score,
                  market_score: score.market_score,
                },
                flags: {
                  is_pre_foreclosure: inputs.is_pre_foreclosure,
                  is_tax_delinquent: inputs.is_tax_delinquent,
                  has_code_violations: inputs.has_code_violations,
                  has_hoa_delinquency: inputs.has_hoa_delinquency,
                  is_vacant: inputs.is_vacant,
                  is_absentee_owner: inputs.is_absentee_owner,
                  is_probate: inputs.is_probate,
                  is_divorce: inputs.is_divorce,
                  is_senior_owner: inputs.is_senior_owner,
                  long_tenure_flag: (inputs.years_owned ?? 0) >= 13,
                },
                market: {},
              }),
              maxTokens: 600,
            });
          } catch {}

          // Upsert by (workspace_id, property_address)
          const { data: existing } = await svc
            .from("grid_signals")
            .select("id")
            .eq("workspace_id", ws.id)
            .eq("property_address", inputs.property_address)
            .maybeSingle();

          const payload = {
            workspace_id: ws.id,
            ...inputs,
            ...score,
            reasons: reasons.reasons,
            reasons_summary: reasons.reasons_summary,
            refreshed_at: new Date().toISOString(),
          };

          let signalId: string | undefined;
          if (existing) {
            await svc.from("grid_signals").update(payload).eq("id", existing.id);
            signalId = existing.id;
          } else {
            const { data: created } = await svc.from("grid_signals").insert(payload).select("id").single();
            signalId = created?.id;
          }
          results.push({ address: addr, ok: true, signal_id: signalId, motivation: score.motivation_score });
        } catch (e) {
          results.push({ address: addr, ok: false, error: (e as Error).message });
        }
      })
    );
  }

  return NextResponse.json({ scanned: addresses.length, results });
}
