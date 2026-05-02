import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const form = req.headers.get("content-type")?.includes("application/json")
    ? await req.json()
    : Object.fromEntries(await req.formData());

  const svc = getSupabaseService();
  await svc.from("demo_requests").insert({
    email: String(form.email),
    full_name: form.full_name ? String(form.full_name) : null,
    brokerage: form.brokerage ? String(form.brokerage) : null,
    agent_count: form.agent_count ? Number(form.agent_count) : null,
    preferred_time: form.preferred_time ? String(form.preferred_time) : null,
    notes: form.notes ? String(form.notes) : null,
  });
  return NextResponse.redirect(new URL("/demo?status=received", req.url));
}
