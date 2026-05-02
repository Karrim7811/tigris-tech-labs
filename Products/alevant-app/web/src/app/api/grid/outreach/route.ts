import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { runClaudeJSON } from "@/lib/anthropic";
import { GRID_OUTREACH_SYSTEM, gridOutreachPrompt } from "@/lib/prompts/grid";

export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { signal_id, channel } = await req.json();
  const svc = getSupabaseService();

  const { data: signal } = await svc.from("grid_signals").select("*, workspaces(*, brokerages(*))").eq("id", signal_id).maybeSingle();
  if (!signal) return NextResponse.json({ error: "signal not found" }, { status: 404 });

  const ws = (signal as any).workspaces;
  const brokerage = (signal as any).workspaces?.brokerages?.name || "Keller Williams";

  const draft = await runClaudeJSON({
    tier: "synth",
    system: GRID_OUTREACH_SYSTEM,
    user: gridOutreachPrompt({
      channel,
      signal_summary: signal.reasons_summary || "Predicted seller in your farm zone.",
      agent_name: ws?.name || "the agent",
      brokerage,
      city: signal.property_city || "Miami",
      // recent_comp would come from recent sold lookup in production
    }),
    maxTokens: 1200,
  });

  return NextResponse.json({ channel, draft });
}
