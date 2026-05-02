import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { runClaude } from "@/lib/anthropic";

/**
 * GET /api/cockpit/standup — generate the agent's 90-second AI standup.
 * Queries pipeline state, signals, and Vesper queue, then synthesizes a TTS-ready briefing.
 */
export async function GET() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getSupabaseService();
  const { data: ws } = await svc.from("workspaces").select("id, name").eq("owner_user_id", user.id).maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const [
    { data: hot },
    { data: vesperQueue },
    { data: gridBlazing },
    { data: txRisks },
    { data: rightCalls },
  ] = await Promise.all([
    svc.from("sofia_conversations").select("caller_name, qualification_score, classification").eq("workspace_id", ws.id).gte("qualification_score", 70).order("started_at", { ascending: false }).limit(5),
    svc.from("vesper_assets").select("asset_type, listing_id").eq("workspace_id", ws.id).eq("status", "awaiting_approval").limit(5),
    svc.from("grid_signals").select("property_address, motivation_score, reasons_summary").eq("workspace_id", ws.id).gte("motivation_score", 80).order("motivation_score", { ascending: false }).limit(3),
    svc.from("transactions").select("property_address, expected_close, risk_flags").eq("workspace_id", ws.id).eq("status", "active").not("risk_flags", "is", null).limit(3),
    svc.from("sphere_signals").select("contact_id, signal_type, signal_data").eq("workspace_id", ws.id).eq("resolved", false).order("confidence", { ascending: false }).limit(3),
  ]);

  const briefing = await runClaude({
    tier: "fast",
    system: `You are the morning briefing AI for a real estate agent. Output a tight, conversational 90-second briefing (~250 words). Open warm, prioritize actionable items, keep it editorial. No emoji, no exclamation points. Hit: hot inbounds, Vesper queue, Grid signals, deals at risk, today's right calls. Close with a single concrete suggestion for the day.`,
    user: `Generate the briefing.

Hot inbounds (Sofia overnight): ${JSON.stringify(hot)}
Vesper approval queue: ${JSON.stringify(vesperQueue)}
Grid blazing signals: ${JSON.stringify(gridBlazing)}
Transactions at risk: ${JSON.stringify(txRisks)}
Sphere right-calls: ${JSON.stringify(rightCalls)}`,
    maxTokens: 600,
  });

  return NextResponse.json({ briefing });
}
