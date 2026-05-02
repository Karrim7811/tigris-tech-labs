import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { runClaudeJSON } from "@/lib/anthropic";
import { INVESTOR_SYSTEM, investorUserPrompt } from "@/lib/prompts/underwriter";
import type { UnderwriterInvestorResult } from "@/lib/types";

export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = req.headers.get("content-type")?.includes("application/json")
    ? await req.json()
    : Object.fromEntries(await req.formData());

  const input = {
    subject: {
      address: String(form.address || ""),
      price: Number(form.price) || 0,
      units: Number(form.units) || 1,
      sqft: Number(form.sqft) || 0,
      year_built: Number(form.year_built) || 0,
      property_type: String(form.property_type || "mf2_4"),
    },
    rent_assumptions: {
      gross_monthly_rent: Number(form.gross_monthly_rent) || 0,
      vacancy_pct: 5,
      expense_ratio_pct: 38,
    },
    financing: {
      down_payment_pct: Number(form.down_pct) || 25,
      rate_pct: Number(form.rate_pct) || 7,
      amortization_years: 30,
    },
    rehab: form.rehab_budget ? { budget: Number(form.rehab_budget), timeline_months: 4 } : undefined,
    str_market: form.str_adr ? { adr: Number(form.str_adr), occupancy_pct: Number(form.str_occ) || 65 } : undefined,
    is_foreign_seller: !!form.is_foreign_seller,
    is_1031_active: !!form.is_1031,
  };

  const result = await runClaudeJSON<UnderwriterInvestorResult>({
    tier: "synth",
    system: INVESTOR_SYSTEM,
    user: investorUserPrompt(input),
    maxTokens: 2048,
  });

  const { data: ws } = await sb.from("workspaces").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (ws) {
    await sb.from("underwriter_runs").insert({
      workspace_id: ws.id,
      mode: "investor_mf",
      subject_address: input.subject.address,
      inputs: input,
      result,
    });
  }
  return NextResponse.json(result);
}
