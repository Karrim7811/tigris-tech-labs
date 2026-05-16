import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { runClaudeJSON } from "@/lib/anthropic";
import { apolloPersonMatch, apolloPeopleByCompany, type ApolloPersonMatch } from "@/lib/research/apollo";
import {
  proxycurlPerson,
  proxycurlResolvePerson,
  normalizeLinkedInUrl,
  type ProxycurlPerson,
} from "@/lib/research/proxycurl";
import {
  perplexityPersonIntel,
  perplexityFindLinkedIn,
  type PerplexityPersonIntel,
} from "@/lib/research/perplexity";

/**
 * GET  /api/contacts/[id]/research        — read cached enrichment
 * POST /api/contacts/[id]/research        — run a fresh research pass and cache it
 *
 * Body for POST (all optional):
 *   { force?: boolean }                   — bypass cache TTL
 *
 * Vendor fan-out mirrors PRAIX's /api/research pattern:
 *   1. Apollo person-match (email-first, name+org fallback)
 *   2. Proxycurl person profile (LinkedIn URL resolved 4 ways)
 *   3. Perplexity person intel (web-grounded fallback + supplement)
 *   4. Claude synthesizes a 60-second briefing from all of the above
 *
 * Every vendor gracefully no-ops when its env var is unset. The route always
 * returns at minimum the AI brief (built from what we already know about the
 * contact).
 */

const CACHE_TTL_HOURS = 24 * 7;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
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
    .from("contact_enrichment")
    .select("*")
    .eq("workspace_id", ws.id)
    .eq("contact_id", id)
    .maybeSingle();
  return NextResponse.json({ enrichment: data ?? null });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
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

  const body = await req.json().catch(() => ({}));
  const force = !!body.force;

  // 1. Load contact
  const { data: contact } = await svc
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (!contact) return NextResponse.json({ error: "not found" }, { status: 404 });

  // 2. Honor cache unless force
  if (!force) {
    const { data: cached } = await svc
      .from("contact_enrichment")
      .select("*, fetched_at")
      .eq("workspace_id", ws.id)
      .eq("contact_id", id)
      .maybeSingle();
    if (cached?.fetched_at) {
      const ageHours = (Date.now() - new Date(cached.fetched_at).getTime()) / 3600_000;
      if (ageHours < CACHE_TTL_HOURS) {
        return NextResponse.json({ enrichment: cached, cached: true });
      }
    }
  }

  // 3. Identity inputs
  const fullName: string = contact.full_name ?? "";
  const [firstName, ...lastParts] = fullName.split(" ").filter(Boolean);
  const lastName = lastParts.join(" ");
  const email: string | undefined = contact.emails?.[0];
  const linkedinHint: string | undefined =
    contact.metadata?.linkedin_url ?? contact.metadata?.linkedin;
  // City hint from contact metadata or workspace default (Miami for now)
  const cityHint: string | undefined = contact.metadata?.city ?? "Miami";

  // 4. Vendor fan-out (all .catch → null/empty)
  const vendors_used: string[] = [];

  // 4a. Apollo person-match
  const apolloP = apolloPersonMatch({
    email,
    first_name: firstName,
    last_name: lastName,
    linkedin_url: linkedinHint,
  })
    .then((r) => {
      if (r) vendors_used.push("apollo");
      return r;
    })
    .catch(() => null);

  // 4b. Resolve LinkedIn URL (multi-stage), then Proxycurl person profile
  let linkedinUrl: string | null = linkedinHint ? normalizeLinkedInUrl(linkedinHint) : null;
  // The Apollo result may also give us a linkedin_url; we'll re-check after Apollo lands.
  const apolloResolved = await apolloP;
  if (!linkedinUrl && apolloResolved?.linkedin_url) {
    linkedinUrl = normalizeLinkedInUrl(apolloResolved.linkedin_url);
  }
  if (!linkedinUrl && firstName && lastName) {
    linkedinUrl = await proxycurlResolvePerson(firstName, lastName).catch(() => null);
  }
  if (!linkedinUrl) {
    linkedinUrl = await perplexityFindLinkedIn(
      fullName,
      cityHint,
      apolloResolved?.current_organization?.name
    ).catch(() => null);
  }

  const proxycurlP: Promise<ProxycurlPerson | null> = linkedinUrl
    ? proxycurlPerson(linkedinUrl)
        .then((r) => {
          if (r) vendors_used.push("proxycurl");
          return r;
        })
        .catch(() => null)
    : Promise.resolve(null);

  // 4c. Perplexity person intel
  const perplexityP: Promise<PerplexityPersonIntel | null> = perplexityPersonIntel(
    fullName,
    cityHint,
    apolloResolved?.current_organization?.name
  )
    .then((r) => {
      if (r) vendors_used.push("perplexity");
      return r;
    })
    .catch(() => null);

  const [proxycurlPerson_, perplexityIntel] = await Promise.all([proxycurlP, perplexityP]);

  // 4d. Sphere context + Grid signals tied to this contact — fed into Claude
  const [{ data: gridSignals }, { data: sphereSignals }] = await Promise.all([
    svc
      .from("grid_signals")
      .select("property_address, motivation_score, reasons_summary, band")
      .eq("contact_id", id)
      .limit(5),
    svc
      .from("sphere_signals")
      .select("signal_type, confidence, detected_at")
      .eq("contact_id", id)
      .eq("resolved", false)
      .limit(8),
  ]);

  // 5. Claude synthesis
  const brief = await synthesize({
    contact,
    apollo: apolloResolved,
    proxycurl: proxycurlPerson_,
    perplexity: perplexityIntel,
    grid_signals: gridSignals ?? [],
    sphere_signals: sphereSignals ?? [],
  }).catch(() => ({
    ai_brief: `${fullName || "This contact"} — no enrichment vendors configured. Open the LinkedIn search link below to research manually.`,
    ai_opening_line: "",
    ai_signals: [] as string[],
  }));

  // 6. Persist
  const payload = {
    workspace_id: ws.id,
    contact_id: id,
    linkedin_url: linkedinUrl,
    current_title: apolloResolved?.title ?? proxycurlPerson_?.occupation ?? null,
    current_company:
      apolloResolved?.current_organization?.name ??
      proxycurlPerson_?.experiences?.[0]?.company ??
      null,
    location_text:
      [proxycurlPerson_?.city, proxycurlPerson_?.state, proxycurlPerson_?.country]
        .filter(Boolean)
        .join(", ") ||
      [apolloResolved?.city, apolloResolved?.state, apolloResolved?.country]
        .filter(Boolean)
        .join(", ") ||
      null,
    headline: proxycurlPerson_?.headline ?? null,
    photo_url: apolloResolved?.photo_url ?? proxycurlPerson_?.profile_pic_url ?? null,
    apollo_email: apolloResolved?.email ?? null,
    apollo_phone: apolloResolved?.phone ?? null,
    apollo_seniority: apolloResolved?.seniority ?? null,
    raw_apollo: apolloResolved as unknown as object | null,
    raw_proxycurl: proxycurlPerson_ as unknown as object | null,
    raw_perplexity: perplexityIntel as unknown as object | null,
    ai_brief: brief.ai_brief,
    ai_opening_line: brief.ai_opening_line,
    ai_signals: brief.ai_signals,
    vendors_used,
    fetched_at: new Date().toISOString(),
  };

  const { data: saved, error } = await svc
    .from("contact_enrichment")
    .upsert(payload, { onConflict: "workspace_id,contact_id" })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ enrichment: saved, cached: false });
}

interface SynthesizeInput {
  contact: { full_name?: string; emails?: string[]; notes?: string; metadata?: any };
  apollo: ApolloPersonMatch | null;
  proxycurl: ProxycurlPerson | null;
  perplexity: PerplexityPersonIntel | null;
  grid_signals: Array<{
    property_address?: string;
    motivation_score?: number;
    reasons_summary?: string;
    band?: string;
  }>;
  sphere_signals: Array<{ signal_type?: string; confidence?: number; detected_at?: string }>;
}

const SYSTEM = `You are a senior real-estate research analyst preparing a 60-second briefing for a producing agent before they reach out to a contact. The briefing must be:

1. PROFESSIONAL and respectful — never speculate about race, religion, national origin, sex, sexual orientation, gender identity, familial status, or disability. Fair Housing applies.
2. SHORT — under 220 chars for the brief, under 180 chars for the opening line.
3. SPECIFIC — every claim must be tied to a data source provided. If no public data was found, say so explicitly rather than guess.
4. ACTIONABLE — the opening line should give the agent a concrete way to start the conversation that references something the contact would actually recognize about themselves (job change, recent news, public real-estate activity).

Return JSON ONLY:
{
  "ai_brief": "<2-3 sentences, plain English>",
  "ai_opening_line": "<one sentence the agent could text or say>",
  "ai_signals": ["<3-6 bullet-style action signals, each under 80 chars>"]
}`;

async function synthesize(input: SynthesizeInput): Promise<{
  ai_brief: string;
  ai_opening_line: string;
  ai_signals: string[];
}> {
  const data = {
    name: input.contact.full_name,
    notes: input.contact.notes,
    apollo: input.apollo
      ? {
          title: input.apollo.title,
          company: input.apollo.current_organization?.name,
          seniority: input.apollo.seniority,
          location: [input.apollo.city, input.apollo.state].filter(Boolean).join(", "),
          recent_employment: input.apollo.employment_history?.slice(0, 3),
        }
      : null,
    proxycurl: input.proxycurl
      ? {
          headline: input.proxycurl.headline,
          occupation: input.proxycurl.occupation,
          city: input.proxycurl.city,
          recent_experience: input.proxycurl.experiences?.slice(0, 3),
          recent_activity: input.proxycurl.activities?.slice(0, 3),
        }
      : null,
    perplexity_intel: input.perplexity?.raw_text,
    grid_signals: input.grid_signals,
    sphere_signals: input.sphere_signals,
  };

  return runClaudeJSON({
    tier: "fast",
    system: SYSTEM,
    user: `Build the briefing from the following research:\n${JSON.stringify(data, null, 2)}`,
    maxTokens: 600,
  });
}
