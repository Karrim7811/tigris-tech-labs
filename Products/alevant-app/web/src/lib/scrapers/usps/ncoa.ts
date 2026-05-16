// USPS NCOA (National Change of Address) signal — mail-forward detection.
//
// USPS NCOA Link is a licensed product (Melissa Data, Anchor Computer, BCC Software).
// Pricing: $3-5k/yr for ALEVANT's expected volume. The Link agreement requires:
//   - Licensee certification
//   - Mailing-purpose registration
//   - Data destruction after the licensed use window (typically 48mo)
//
// This adapter intentionally returns null when no licensed vendor is configured —
// the rest of the Grid degrades gracefully without it. When the contract is in
// place, set NCOA_VENDOR and NCOA_API_KEY env vars and the adapter activates.

import type { NCOARecord } from "../florida/types";
import { getSupabaseService } from "@/lib/supabase/server";

const NCOA_CACHE_HOURS = 24 * 30;

async function readCache(from_address: string): Promise<NCOARecord | null> {
  const svc = getSupabaseService();
  const cutoff = new Date(Date.now() - NCOA_CACHE_HOURS * 3600_000).toISOString();
  const { data } = await svc
    .from("usps_ncoa_records")
    .select("*")
    .ilike("from_address", from_address)
    .gte("fetched_at", cutoff)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    resident_name: data.resident_name ?? undefined,
    from_address: data.from_address,
    to_address: data.to_address ?? undefined,
    forward_type: (data.forward_type as NCOARecord["forward_type"]) ?? undefined,
    effective_date: data.effective_date ?? undefined,
    source: data.source ?? undefined,
  };
}

async function writeCache(rec: NCOARecord, workspaceId?: string) {
  const svc = getSupabaseService();
  await svc.from("usps_ncoa_records").insert({
    workspace_id: workspaceId ?? null,
    resident_name: rec.resident_name ?? null,
    from_address: rec.from_address,
    to_address: rec.to_address ?? null,
    forward_type: rec.forward_type ?? null,
    effective_date: rec.effective_date ?? null,
    source: rec.source ?? "vendor",
  });
}

/**
 * Fetch an NCOA record for the property's mailing address. Returns null when no
 * vendor is configured or no record exists.
 *
 * Vendor API contracts vary; this is the canonical shape we assume. Adapt to the
 * licensed vendor's specifics when the contract lands.
 */
export async function fetchNCOA(
  from_address: string,
  resident_name?: string,
  workspaceId?: string
): Promise<NCOARecord | null> {
  const cached = await readCache(from_address);
  if (cached) return cached;

  const vendor = process.env.NCOA_VENDOR;
  const apiKey = process.env.NCOA_API_KEY;
  if (!vendor || !apiKey) return null;

  try {
    const endpoint = process.env.NCOA_VENDOR_ENDPOINT || "https://api.ncoa.vendor.example/v1/lookup";
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from_address,
        resident_name: resident_name ?? null,
      }),
    });
    if (!r.ok) return null;
    const j = (await r.json().catch(() => null)) as {
      forwarded?: boolean;
      to_address?: string;
      forward_type?: NCOARecord["forward_type"];
      effective_date?: string;
    } | null;
    if (!j?.forwarded) return null;

    const rec: NCOARecord = {
      resident_name,
      from_address,
      to_address: j.to_address,
      forward_type: j.forward_type ?? "individual",
      effective_date: j.effective_date,
      source: vendor,
    };
    await writeCache(rec, workspaceId);
    return rec;
  } catch {
    return null;
  }
}

export function isRecentForward(rec: NCOARecord | null, windowDays = 270): boolean {
  if (!rec?.effective_date) return false;
  const ms = new Date(rec.effective_date).getTime();
  if (!isFinite(ms)) return false;
  return Date.now() - ms <= windowDays * 86_400_000;
}
