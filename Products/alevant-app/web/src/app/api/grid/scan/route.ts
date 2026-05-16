import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { fuseAddressSignals, fusedToGridInputs } from "@/lib/scrapers/florida";
import { runClaudeJSON } from "@/lib/anthropic";
import { GRID_REASON_SYSTEM, gridReasonPrompt } from "@/lib/prompts/grid";
import {
  scoreGridSignal,
  effectiveDatesFromInputs,
  GRID_ENGINE_VERSION,
  bandFromMotivationScore,
} from "@/lib/grid-engine";
import { computeExpiresAt } from "@/lib/grid-decay";

export const maxDuration = 60;

/**
 * POST /api/grid/scan — scan a list of addresses, fuse public records + multimodal
 * signals, score them, persist as grid_signals.
 *
 * Body:
 *   { addresses: string[],
 *     zip?: string,
 *     county?: string,
 *     include_str_market?: boolean,
 *     include_visual?: boolean,
 *     include_ncoa?: boolean,
 *     include_dmf?: boolean,
 *     include_mls_market?: boolean }
 */
export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const body = await req.json();
  const addresses: string[] = body.addresses || [];
  if (!addresses.length) return NextResponse.json({ error: "addresses required" }, { status: 400 });

  const results: Array<{
    address: string;
    ok: boolean;
    signal_id?: string;
    motivation?: number;
    band?: string;
    expires_at?: string;
    error?: string;
  }> = [];

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
            include_visual: body.include_visual,
            include_ncoa: body.include_ncoa,
            include_dmf: body.include_dmf,
          });
          if (!fused) {
            results.push({ address: addr, ok: false, error: "no public record found" });
            return;
          }

          const inputs = fusedToGridInputs(fused);
          const asof = new Date();
          const score = scoreGridSignal({
            ...inputs,
            permit_class: inputs.permit_class as "stay" | "flip" | "unknown" | undefined,
            visual_diff: inputs.visual_diff as
              | "deterioration"
              | "renovation"
              | "no_change"
              | "not_comparable"
              | undefined,
            rate_lock_strength: inputs.rate_lock_strength as
              | "tight"
              | "moderate"
              | "loose"
              | undefined,
            asof,
          });
          const band = bandFromMotivationScore(score.motivation_score);

          // Compute expiry from earliest decaying signal class.
          const effective = effectiveDatesFromInputs({
            ...inputs,
            permit_class: inputs.permit_class as "stay" | "flip" | "unknown" | undefined,
            visual_diff: inputs.visual_diff as
              | "deterioration"
              | "renovation"
              | "no_change"
              | "not_comparable"
              | undefined,
            rate_lock_strength: inputs.rate_lock_strength as
              | "tight"
              | "moderate"
              | "loose"
              | undefined,
          });
          const expires_at = computeExpiresAt(effective).toISOString();

          // Pick the most-recent effective date as effective_at.
          const effectiveTimes = Object.values(effective)
            .filter(Boolean)
            .map((d) => (typeof d === "string" ? new Date(d) : (d as Date)).getTime())
            .filter((t) => isFinite(t));
          const effective_at = effectiveTimes.length
            ? new Date(Math.max(...effectiveTimes)).toISOString()
            : asof.toISOString();

          // Claude reasoning (graceful failure)
          let reasons = {
            reasons_summary: `Composite motivation ${score.motivation_score}/100.`,
            reasons: [] as string[],
          };
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
                  permit_class: inputs.permit_class,
                  visual_diff: inputs.visual_diff,
                  ncoa_mail_forward: inputs.ncoa_mail_forward,
                  voter_dropped: inputs.voter_dropped,
                  llc_dissolved: inputs.llc_dissolved,
                  rate_lock_strength: inputs.rate_lock_strength,
                },
                market: {},
              }),
              maxTokens: 700,
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
            motivation_score: score.motivation_score,
            tenure_score: score.tenure_score,
            equity_score: score.equity_score,
            distress_score: score.distress_score,
            life_event_score: score.life_event_score,
            market_score: score.market_score,
            engine_version: GRID_ENGINE_VERSION,
            effective_at,
            expires_at,
            // Per-signal-class date snapshots for the schema's age-tracker columns
            pre_foreclosure_at: inputs.pre_foreclosure_at ?? null,
            probate_filing_at: inputs.probate_filing_at ?? null,
            divorce_filing_at: inputs.divorce_filing_at ?? null,
            tax_delinquent_at: inputs.tax_delinquent_at ?? null,
            code_violation_at: inputs.code_violation_at ?? null,
            reasons: reasons.reasons,
            reasons_summary: reasons.reasons_summary,
            long_tenure_flag: (inputs.years_owned ?? 0) >= 13,
            refreshed_at: asof.toISOString(),
          };

          let signalId: string | undefined;
          if (existing) {
            await svc.from("grid_signals").update(payload).eq("id", existing.id);
            signalId = existing.id;
          } else {
            const { data: created } = await svc
              .from("grid_signals")
              .insert(payload)
              .select("id")
              .single();
            signalId = created?.id;
          }

          // Audit log
          await svc.from("grid_audit_events").insert({
            workspace_id: ws.id,
            event_type: "score",
            signal_id: signalId,
            property_address: inputs.property_address,
            model_name: "grid.heuristic",
            model_version: GRID_ENGINE_VERSION,
            input_snapshot: { inputs, effective },
            output_snapshot: {
              motivation_score: score.motivation_score,
              band,
              applied_decay: score.applied_decay,
              rate_lock_penalty: score.rate_lock_penalty,
              expires_at,
            },
            served_by: "api.grid.scan",
          });

          results.push({
            address: addr,
            ok: true,
            signal_id: signalId,
            motivation: score.motivation_score,
            band,
            expires_at,
          });
        } catch (e) {
          results.push({ address: addr, ok: false, error: (e as Error).message });
        }
      })
    );
  }

  return NextResponse.json({
    scanned: addresses.length,
    engine_version: GRID_ENGINE_VERSION,
    results,
  });
}
