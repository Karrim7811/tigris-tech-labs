import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { detectRisks } from "@/lib/transaction-brain";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: tx } = await sb.from("transactions").select("*").eq("id", id).maybeSingle();
  if (!tx) return NextResponse.json({ error: "not found" }, { status: 404 });

  const timeline = (tx.timeline_json as any) || [];
  const risks = detectRisks({
    timeline,
    contractPrice: tx.contract_price ?? undefined,
  });

  return NextResponse.json({ transaction: tx, risks });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await sb.from("transactions").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transaction: data });
}
