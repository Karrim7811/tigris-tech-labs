import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const form = req.headers.get("content-type")?.includes("application/json")
    ? await req.json()
    : Object.fromEntries(await req.formData());
  if (!form.email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const svc = getSupabaseService();
  const { error } = await svc.from("marketing_waitlist").upsert(
    {
      email: String(form.email),
      full_name: form.full_name ? String(form.full_name) : null,
      brokerage: form.brokerage ? String(form.brokerage) : null,
      market: form.market ? String(form.market) : null,
      source: form.source ? String(form.source) : "marketing_site",
      intent: form.intent ? String(form.intent) : null,
    },
    { onConflict: "email" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
