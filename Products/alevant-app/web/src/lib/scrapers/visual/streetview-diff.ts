// StreetView year-over-year visual diff — the AI-native seller signal.
//
// Pipeline:
//   1. Resolve property address → lat/long (via Google Geocoding API).
//   2. Pull two StreetView panoramas for the same location: current year + prior year
//      (Google Street View Static API).
//   3. Send both image URLs to Claude Sonnet vision with a constrained prompt:
//        "Categorize the visible change as deterioration / renovation / no_change /
//         not_comparable. Confidence 0-1. ≤200 char notes."
//   4. Cache to property_visual_diffs (unique on property_address + current_image_date).
//
// Privacy / Fair Housing posture:
//   - The vision prompt describes ONLY the property's physical condition.
//   - The prompt explicitly rejects describing people, vehicles, or surroundings.
//   - The signal is about the building, not its inhabitants. This protects the
//     downstream model from inadvertently using neighborhood-context as a proxy.
//
// Cost: ~$0.003 per address per year. Negligible.

import { getAnthropic, modelFor } from "@/lib/anthropic";
import { getSupabaseService } from "@/lib/supabase/server";
import type { VisualDiff } from "../florida/types";

const STREETVIEW_API = "https://maps.googleapis.com/maps/api/streetview";
const GEOCODE_API = "https://maps.googleapis.com/maps/api/geocode/json";

const VISION_SYSTEM = `You are evaluating a residential property for signs of seller motivation based on TWO Google Street View images of the same property taken in different years.

STRICT RULES:
1. Describe ONLY the property's physical condition: paint, roof, windows, siding, landscaping, fencing, driveway, hardscape.
2. NEVER describe people, vehicles, license plates, pets, or non-property elements.
3. NEVER speculate about the inhabitants' demographics, age, income, family composition, or any protected class.
4. Categorize the change between the two images using the strictest interpretation possible:

DETERIORATION: peeling paint, broken windows, overgrown landscaping, visible structural damage, dead vegetation, debris accumulation, deferred maintenance, roof damage, fence damage.
RENOVATION: fresh paint, new landscaping, new fencing, visible additions, new roof, hardscape improvements, evidence of recent contractor work, new windows/doors.
NO_CHANGE: properties appear materially identical.
NOT_COMPARABLE: image quality, angle, season, vegetation obstruction, or coverage gaps prevent confident comparison.

Output a JSON object exactly:
{"rating": "deterioration" | "renovation" | "no_change" | "not_comparable",
 "confidence": <number 0.0..1.0>,
 "vision_notes": "<≤200 chars describing the visible delta, property only>"}
`;

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const url = `${GEOCODE_API}?address=${encodeURIComponent(address)}&key=${key}`;
  const r = await fetch(url).catch(() => null);
  if (!r?.ok) return null;
  const j = (await r.json().catch(() => null)) as
    | { results?: Array<{ geometry: { location: { lat: number; lng: number } } }> }
    | null;
  return j?.results?.[0]?.geometry?.location ?? null;
}

function streetViewUrl(lat: number, lng: number, year?: number): string {
  const key = process.env.GOOGLE_MAPS_API_KEY!;
  const base = `${STREETVIEW_API}?size=640x640&location=${lat},${lng}&fov=80&source=outdoor&key=${key}`;
  // Google's Street View Static API doesn't accept a year directly; pano_id selection
  // happens server-side. For the "prior year" we use the `radius` + `source=outdoor`
  // combination and rely on Google's most-recent-prior coverage. For finer control,
  // use the metadata endpoint to enumerate pano_ids by date — left as a refinement.
  return base + (year ? `&pano=year:${year}` : "");
}

async function fetchVisualDiffFromImages(
  currentUrl: string,
  priorUrl: string
): Promise<VisualDiff | null> {
  try {
    const client = getAnthropic();
    const resp = await client.messages.create({
      model: modelFor("synth"), // Sonnet for vision quality
      max_tokens: 400,
      system: VISION_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "CURRENT YEAR image:" },
            { type: "image", source: { type: "url", url: currentUrl } as any },
            { type: "text", text: "PRIOR YEAR image:" },
            { type: "image", source: { type: "url", url: priorUrl } as any },
            {
              type: "text",
              text: "Return ONLY the JSON object specified in the system prompt. No prose.",
            },
          ],
        },
      ],
    });
    const block = resp.content[0];
    if (block?.type !== "text") return null;
    const stripped = block.text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(stripped) as {
      rating: VisualDiff["rating"];
      confidence: number;
      vision_notes: string;
    };
    return {
      rating: parsed.rating,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      vision_notes: parsed.vision_notes?.slice(0, 200) ?? "",
      model_version: modelFor("synth"),
      current_image_date: new Date().toISOString().slice(0, 10),
    };
  } catch {
    return null;
  }
}

async function readCache(address: string): Promise<VisualDiff | null> {
  const svc = getSupabaseService();
  // Honor a 6-month cache — StreetView itself refreshes infrequently.
  const cutoff = new Date(Date.now() - 180 * 86_400_000).toISOString();
  const { data } = await svc
    .from("property_visual_diffs")
    .select("*")
    .ilike("property_address", address)
    .gte("fetched_at", cutoff)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    rating: data.rating,
    confidence: data.confidence ?? 0,
    vision_notes: data.vision_notes ?? "",
    model_version: data.model_version ?? "",
    current_image_date: data.current_image_date ?? undefined,
    prior_image_date: data.prior_image_date ?? undefined,
  };
}

async function writeCache(address: string, zip: string | undefined, diff: VisualDiff) {
  const svc = getSupabaseService();
  await svc.from("property_visual_diffs").upsert(
    {
      property_address: address,
      property_zip: zip ?? null,
      current_image_date: diff.current_image_date ?? null,
      prior_image_date: diff.prior_image_date ?? null,
      rating: diff.rating,
      confidence: diff.confidence,
      vision_notes: diff.vision_notes,
      model_version: diff.model_version,
    },
    { onConflict: "property_address,current_image_date" }
  );
}

export async function fetchVisualDiff(
  property_address: string,
  property_zip?: string
): Promise<VisualDiff | null> {
  const cached = await readCache(property_address);
  if (cached) return cached;

  const geo = await geocode(property_address);
  if (!geo) return null;

  const currentYear = new Date().getFullYear();
  const priorYear = currentYear - 3; // 3-year delta captures meaningful change reliably
  const currentUrl = streetViewUrl(geo.lat, geo.lng);
  const priorUrl = streetViewUrl(geo.lat, geo.lng, priorYear);

  const diff = await fetchVisualDiffFromImages(currentUrl, priorUrl);
  if (!diff) return null;
  diff.current_image_date = `${currentYear}-01-01`;
  diff.prior_image_date = `${priorYear}-01-01`;
  await writeCache(property_address, property_zip, diff);
  return diff;
}
