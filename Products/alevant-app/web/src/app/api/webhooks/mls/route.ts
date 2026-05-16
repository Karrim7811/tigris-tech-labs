import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/server";
import { reconcileMlsEvent } from "@/lib/grid-outcomes";
import crypto from "node:crypto";

/**
 * POST /api/webhooks/mls
 *
 * MLS-side webhook delivery: when a listing event happens (new listing, sold,
 * withdrawn), the MLS partner POSTs here. We reconcile the event against any
 * existing grid_signals at the same property_address.
 *
 * Auth: HMAC signature in `x-mls-signature` (sha256 hex of raw body keyed by
 * MLS_WEBHOOK_SECRET).
 *
 * Body shape (canonical — adapt to whatever the MLS partner agreement specifies):
 *   { event: 'listed' | 'sold' | 'withdrawn',
 *     property_address: string,
 *     list_date?: string, sold_date?: string, withdrawn_date?: string,
 *     sold_price_usd?: number, mls_number?: string }
 *
 * Multiple events can be batched: { events: [...] }
 */

function verifySignature(raw: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.MLS_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

interface MLSEvent {
  event?: "listed" | "sold" | "withdrawn";
  property_address: string;
  list_date?: string;
  sold_date?: string;
  withdrawn_date?: string;
  sold_price_usd?: number;
  mls_number?: string;
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-mls-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let parsed: { events?: MLSEvent[]; event?: MLSEvent } | MLSEvent;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const events: MLSEvent[] = Array.isArray((parsed as any).events)
    ? (parsed as { events: MLSEvent[] }).events
    : (parsed as MLSEvent).property_address
    ? [parsed as MLSEvent]
    : [];

  if (!events.length) return NextResponse.json({ error: "no events" }, { status: 400 });

  const svc = getSupabaseService();
  let totalMatched = 0;
  const results: Array<{ property_address: string; matched: number }> = [];

  for (const ev of events) {
    if (!ev.property_address) continue;
    try {
      const out = await reconcileMlsEvent(svc, {
        property_address: ev.property_address,
        list_date: ev.list_date,
        sold_date: ev.sold_date,
        withdrawn_date: ev.withdrawn_date,
        sold_price_usd: ev.sold_price_usd,
      });
      totalMatched += out.matched;
      results.push({ property_address: ev.property_address, matched: out.matched });

      // Update grid_signals MLS status for fast view filtering.
      const status = ev.sold_date
        ? "closed_recent"
        : ev.withdrawn_date
        ? "expired_recent"
        : ev.list_date
        ? "active"
        : null;
      if (status) {
        const update: Record<string, unknown> = { mls_status: status };
        if (ev.list_date) update.mls_last_listed_at = ev.list_date;
        if (ev.sold_date) update.mls_last_closed_at = ev.sold_date;
        await svc.from("grid_signals").update(update).eq("property_address", ev.property_address);
      }
    } catch (e) {
      results.push({ property_address: ev.property_address, matched: 0 });
    }
  }

  return NextResponse.json({ ok: true, matched_total: totalMatched, results });
}
