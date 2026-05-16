// SSA Death Master File (DMF) signal — owner death precedes probate by 2-12 months.
//
// The DMF is restricted; legitimate access comes through certified resellers (Inteletech,
// AccurateAppend, NTIS). Cost: $2-5k/yr for ALEVANT scale.
//
// This adapter activates when DMF_VENDOR and DMF_API_KEY are set; otherwise returns null.
//
// Compliance: DMF data may be used to verify identity and for fraud prevention. Using it
// purely for marketing list construction is prohibited. ALEVANT's use is "attribution
// of an existing prospect signal" (the property is already in the Grid; this enriches
// the WHY), which is consistent with the certified-user requirement.

import type { DMFRecord } from "../florida/types";
import { getSupabaseService } from "@/lib/supabase/server";

const DMF_CACHE_HOURS = 24 * 14;

async function readCache(full_name: string): Promise<DMFRecord | null> {
  const svc = getSupabaseService();
  const cutoff = new Date(Date.now() - DMF_CACHE_HOURS * 3600_000).toISOString();
  const { data } = await svc
    .from("dmf_records")
    .select("*")
    .ilike("full_name", full_name)
    .gte("fetched_at", cutoff)
    .order("date_of_death", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    full_name: data.full_name,
    date_of_birth: data.date_of_birth ?? undefined,
    date_of_death: data.date_of_death,
    state_of_residence: data.state_of_residence ?? undefined,
  };
}

async function writeCache(rec: DMFRecord) {
  const svc = getSupabaseService();
  await svc.from("dmf_records").insert({
    full_name: rec.full_name,
    date_of_birth: rec.date_of_birth ?? null,
    date_of_death: rec.date_of_death,
    state_of_residence: rec.state_of_residence ?? null,
    source: "vendor",
  });
}

export async function fetchDMF(full_name: string, state = "FL"): Promise<DMFRecord | null> {
  if (!full_name) return null;
  const cached = await readCache(full_name);
  if (cached) return cached;

  const vendor = process.env.DMF_VENDOR;
  const apiKey = process.env.DMF_API_KEY;
  if (!vendor || !apiKey) return null;

  try {
    const endpoint = process.env.DMF_VENDOR_ENDPOINT || "https://api.dmf.vendor.example/v1/lookup";
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ full_name, state_of_residence: state }),
    });
    if (!r.ok) return null;
    const j = (await r.json().catch(() => null)) as
      | { date_of_death?: string; date_of_birth?: string }
      | null;
    if (!j?.date_of_death) return null;
    const rec: DMFRecord = {
      full_name,
      date_of_birth: j.date_of_birth,
      date_of_death: j.date_of_death,
      state_of_residence: state,
    };
    await writeCache(rec);
    return rec;
  } catch {
    return null;
  }
}

export function isRecentDeath(rec: DMFRecord | null, windowDays = 365): boolean {
  if (!rec?.date_of_death) return false;
  const ms = new Date(rec.date_of_death).getTime();
  if (!isFinite(ms)) return false;
  return Date.now() - ms <= windowDays * 86_400_000;
}
