import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

const VALID_STAGES = ["prospect", "lead", "engaged", "client_active", "client_past", "sphere"];
const VALID_TEMPS = ["Hot", "Warm", "Cold", "Disqualified"];
const VALID_CHANNELS = ["call", "sms", "email", "meeting", "note"];

export async function GET() {
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
    .from("playbooks")
    .select("*")
    .eq("workspace_id", ws.id)
    .order("is_system", { ascending: false })
    .order("name");
  return NextResponse.json({ playbooks: data ?? [] });
}

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
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const stages: string[] = (body.trigger_lifecycle_stages ?? []).filter((s: string) =>
    VALID_STAGES.includes(s)
  );
  const temps: string[] = (body.trigger_temperatures ?? []).filter((t: string) =>
    VALID_TEMPS.includes(t)
  );
  const steps = Array.isArray(body.steps_json?.steps) ? body.steps_json.steps : [];
  for (const s of steps) {
    if (typeof s.day_offset !== "number" || s.day_offset < 0) {
      return NextResponse.json({ error: "each step needs day_offset >= 0" }, { status: 400 });
    }
    if (!VALID_CHANNELS.includes(s.channel)) {
      return NextResponse.json(
        { error: `each step channel must be one of ${VALID_CHANNELS.join(", ")}` },
        { status: 400 }
      );
    }
    if (!s.action || typeof s.action !== "string") {
      return NextResponse.json(
        { error: "each step needs an action description" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await svc
    .from("playbooks")
    .insert({
      workspace_id: ws.id,
      name: body.name,
      description: body.description ?? null,
      trigger_lifecycle_stages: stages.length ? stages : null,
      trigger_temperatures: temps.length ? temps : null,
      steps_json: { steps },
      is_system: false,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ playbook: data });
}
