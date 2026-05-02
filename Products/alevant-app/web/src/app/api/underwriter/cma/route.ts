import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { runClaudeJSON } from "@/lib/anthropic";
import { CMA_SYSTEM, cmaUserPrompt } from "@/lib/prompts/underwriter";
import type { UnderwriterCMAResult } from "@/lib/types";

export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = req.headers.get("content-type")?.includes("application/json")
    ? await req.json()
    : Object.fromEntries(await req.formData());

  const subject = {
    address: String(form.address || ""),
    beds: Number(form.beds) || 0,
    baths: Number(form.baths) || 0,
    sqft: Number(form.sqft) || 0,
    year_built: Number(form.year_built) || 0,
    property_type: String(form.property_type || "condo"),
  };

  // V1: comp set is a stubbed / placeholder fixture; V2 swaps in ATTOM API.
  const comps = [
    { address: "2148 Ocean Drive", sold_price: 1380000, sold_date: "2026-03-22", beds: 2, baths: 2, sqft: 1450, year_built: 2008, distance_miles: 0.02 },
    { address: "2200 Collins Ave", sold_price: 1410000, sold_date: "2026-04-08", beds: 2, baths: 2, sqft: 1500, year_built: 2010, distance_miles: 0.18 },
    { address: "1900 Ocean Drive", sold_price: 1290000, sold_date: "2026-02-14", beds: 2, baths: 2, sqft: 1380, year_built: 2005, distance_miles: 0.42 },
    { address: "2350 Collins Ave", sold_price: 1450000, sold_date: "2026-03-30", beds: 2, baths: 2, sqft: 1525, year_built: 2012, distance_miles: 0.31 },
  ];
  const market_state = { median_dom: 38, absorption_months: 4.2 };

  const result = await runClaudeJSON<UnderwriterCMAResult>({
    tier: "synth",
    system: CMA_SYSTEM,
    user: cmaUserPrompt({ subject, comps, market_state }),
    maxTokens: 2048,
  });

  const { data: ws } = await sb.from("workspaces").select("id").eq("owner_user_id", user.id).maybeSingle();
  if (ws) {
    await sb.from("underwriter_runs").insert({
      workspace_id: ws.id,
      mode: "cma",
      subject_address: subject.address,
      inputs: { subject, comps, market_state },
      comp_set: result.comp_set,
      result,
    });
  }
  return NextResponse.json(result);
}
