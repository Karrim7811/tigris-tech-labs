import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { recordOutcome, type OutcomeType, type OutcomeSource } from "@/lib/grid-outcomes";

/**
 * GET  /api/grid/outcomes?since=<iso>  — list outcomes for the user's workspace
 * POST /api/grid/outcomes              — record an agent-manual outcome
 *   body: { property_address, outcome_type, outcome_date, outcome_value_usd?, notes? }
 */

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const since = url.searchParams.get("since");

  let q = svc
    .from("grid_outcomes")
    .select("*")
    .eq("workspace_id", ws.id)
    .order("outcome_date", { ascending: false })
    .limit(500);
  if (since) q = q.gte("outcome_date", since);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ outcomes: data ?? [] });
}

const VALID_TYPES: OutcomeType[] = [
  "listed",
  "sold_off_market",
  "agent_contacted",
  "agent_won",
  "agent_lost",
  "dead_signal",
  "re_listed",
  "withdrawn",
];

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
  if (!body.property_address || !body.outcome_type || !body.outcome_date) {
    return NextResponse.json(
      { error: "property_address, outcome_type, outcome_date required" },
      { status: 400 }
    );
  }
  if (!VALID_TYPES.includes(body.outcome_type)) {
    return NextResponse.json(
      { error: `outcome_type must be one of ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const out = await recordOutcome(svc, {
      workspace_id: ws.id,
      property_address: body.property_address,
      outcome_type: body.outcome_type,
      outcome_source: (body.outcome_source as OutcomeSource) ?? "agent_manual",
      outcome_date: body.outcome_date,
      outcome_value_usd: body.outcome_value_usd,
      notes: body.notes,
    });
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
