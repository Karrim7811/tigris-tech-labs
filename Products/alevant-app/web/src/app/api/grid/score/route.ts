import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { runClaudeJSON } from "@/lib/anthropic";
import { GRID_REASON_SYSTEM, gridReasonPrompt } from "@/lib/prompts/grid";
import { scoreGridSignal } from "@/lib/grid-engine";

/**
 * POST /api/grid/score — score a single property and persist as a grid_signal.
 * Body: GridSignalInputs + { property_address, property_city, property_zip, owner_name, owner_phone? }
 */
export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getSupabaseService();
  const { data: ws } = await svc.from("workspaces").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const body = await req.json();

  const score = scoreGridSignal({
    years_owned: body.years_owned,
    estimated_value: body.estimated_value,
    estimated_mortgage_balance: body.estimated_mortgage_balance,
    estimated_equity: body.estimated_equity,
    is_pre_foreclosure: body.is_pre_foreclosure,
    is_tax_delinquent: body.is_tax_delinquent,
    has_code_violations: body.has_code_violations,
    has_hoa_delinquency: body.has_hoa_delinquency,
    is_vacant: body.is_vacant,
    is_absentee_owner: body.is_absentee_owner,
    is_probate: body.is_probate,
    is_divorce: body.is_divorce,
    is_senior_owner: body.is_senior_owner,
    neighborhood_absorption_rate: body.neighborhood_absorption_rate,
  });

  let reasons: { reasons_summary: string; reasons: string[] } = {
    reasons_summary: "",
    reasons: [],
  };
  try {
    reasons = await runClaudeJSON({
      tier: "fast",
      system: GRID_REASON_SYSTEM,
      user: gridReasonPrompt({
        property_address: body.property_address,
        estimated_value: body.estimated_value,
        estimated_equity: body.estimated_equity,
        years_owned: body.years_owned,
        motivation_score: score.motivation_score,
        components: {
          tenure_score: score.tenure_score,
          equity_score: score.equity_score,
          distress_score: score.distress_score,
          life_event_score: score.life_event_score,
          market_score: score.market_score,
        },
        flags: {
          is_pre_foreclosure: body.is_pre_foreclosure,
          is_tax_delinquent: body.is_tax_delinquent,
          has_code_violations: body.has_code_violations,
          has_hoa_delinquency: body.has_hoa_delinquency,
          is_vacant: body.is_vacant,
          is_absentee_owner: body.is_absentee_owner,
          is_probate: body.is_probate,
          is_divorce: body.is_divorce,
          is_senior_owner: body.is_senior_owner,
          long_tenure_flag: (body.years_owned ?? 0) >= 13,
        },
        market: { neighborhood_absorption_rate: body.neighborhood_absorption_rate },
      }),
      maxTokens: 600,
    });
  } catch {
    reasons.reasons_summary = `Composite motivation ${score.motivation_score}/100.`;
    reasons.reasons = ["Computed from public-records signals."];
  }

  const { data: signal } = await svc
    .from("grid_signals")
    .insert({
      workspace_id: ws.id,
      property_address: body.property_address,
      property_city: body.property_city,
      property_state: body.property_state || "FL",
      property_zip: body.property_zip,
      owner_name: body.owner_name,
      owner_phone: body.owner_phone,
      estimated_value: body.estimated_value,
      estimated_equity: body.estimated_equity,
      estimated_mortgage_balance: body.estimated_mortgage_balance,
      years_owned: body.years_owned,
      ...score,
      is_pre_foreclosure: body.is_pre_foreclosure,
      is_tax_delinquent: body.is_tax_delinquent,
      has_code_violations: body.has_code_violations,
      has_hoa_delinquency: body.has_hoa_delinquency,
      is_vacant: body.is_vacant,
      is_absentee_owner: body.is_absentee_owner,
      is_probate: body.is_probate,
      is_divorce: body.is_divorce,
      is_senior_owner: body.is_senior_owner,
      long_tenure_flag: (body.years_owned ?? 0) >= 13,
      neighborhood_absorption_rate: body.neighborhood_absorption_rate,
      reasons: reasons.reasons,
      reasons_summary: reasons.reasons_summary,
      data_sources: body.data_sources || [],
    })
    .select()
    .single();

  return NextResponse.json({ signal });
}
