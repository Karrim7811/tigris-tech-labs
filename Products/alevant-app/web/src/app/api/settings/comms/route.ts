import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/**
 * GET   /api/settings/comms — read auto-log mode for the user's workspace
 * PATCH /api/settings/comms — update mode + per-channel toggles
 *
 * auto_log_mode:
 *   full_auto    — Gmail + Twilio + Sofia + Vesper all auto-log (default)
 *   sofia_only   — only Sofia + Vesper auto-log; Gmail/Twilio require manual
 *   manual_only  — no auto-logging; every activity is logged manually
 */
const VALID_MODES = ["full_auto", "sofia_only", "manual_only"] as const;
type Mode = (typeof VALID_MODES)[number];

export async function GET(_req: Request) {
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

  const { data } = await svc
    .from("workspace_comms_settings")
    .select("*")
    .eq("workspace_id", ws.id)
    .maybeSingle();
  // Return defaults if no row yet
  return NextResponse.json({
    settings: data ?? {
      workspace_id: ws.id,
      auto_log_mode: "full_auto",
      gmail_enabled: true,
      twilio_enabled: true,
      sofia_enabled: true,
      vesper_enabled: true,
      linkedin_enabled: false,
    },
  });
}

export async function PATCH(req: Request) {
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
  if (body.auto_log_mode && !VALID_MODES.includes(body.auto_log_mode as Mode)) {
    return NextResponse.json(
      { error: `auto_log_mode must be one of ${VALID_MODES.join(", ")}` },
      { status: 400 }
    );
  }

  const payload = {
    workspace_id: ws.id,
    auto_log_mode: body.auto_log_mode ?? "full_auto",
    gmail_enabled: body.gmail_enabled ?? true,
    twilio_enabled: body.twilio_enabled ?? true,
    sofia_enabled: body.sofia_enabled ?? true,
    vesper_enabled: body.vesper_enabled ?? true,
    linkedin_enabled: body.linkedin_enabled ?? false,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  const { data, error } = await svc
    .from("workspace_comms_settings")
    .upsert(payload, { onConflict: "workspace_id" })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}
