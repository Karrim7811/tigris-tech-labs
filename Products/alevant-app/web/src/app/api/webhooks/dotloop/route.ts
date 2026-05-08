import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/dotloop";

/**
 * Dotloop webhook receiver — mirrors the DocuSign Connect webhook surface.
 * Dotloop fires for loop status changes, document uploads, signature
 * completions, and participant updates.
 *
 * Verifies HMAC-SHA256 signature in production, then updates any
 * transaction whose `dotloop_loop_id` matches.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-dotloop-signature");
  if (process.env.VERCEL_ENV === "production") {
    if (!verifyWebhookSignature(raw, sig)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const svc = getSupabaseService();

  // Dotloop event payloads vary by type — normalize the loop id and status.
  const loopId: string | undefined =
    payload?.loop?.id ||
    payload?.loopId ||
    payload?.data?.loop?.id ||
    payload?.event?.loopId;
  const eventType: string | undefined = payload?.eventType || payload?.event?.type;
  const newStatus: string | undefined = payload?.loop?.status || payload?.data?.loop?.status;

  if (!loopId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Map Dotloop loop status → transactions.status
  const tStatus =
    newStatus === "SOLD" || newStatus === "LEASED"
      ? "closed"
      : newStatus === "UNDER_CONTRACT"
      ? "active"
      : newStatus === "ARCHIVED"
      ? "cancelled"
      : null;

  if (tStatus) {
    const update: Record<string, any> = { status: tStatus };
    if (tStatus === "closed") update.actual_close = new Date().toISOString().split("T")[0];
    await svc.from("transactions").update(update).eq("dotloop_loop_id", loopId);
  }

  // Log the raw event for replay/audit (best-effort — table may not exist in dev)
  await svc
    .from("integration_events")
    .insert({
      service: "dotloop",
      event_type: eventType || "unknown",
      external_id: loopId,
      payload,
    })
    .then(() => {}, () => {});

  return NextResponse.json({ ok: true });
}
