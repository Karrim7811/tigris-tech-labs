// Apollo people enrichment.
// Adapted from PRAIX's pattern (mixed_people/api_search) but flipped from
// company-title search → person-match, because ALEVANT contacts are individuals,
// not companies-with-target-titles.
//
// Docs: https://docs.apollo.io/reference/match-person
// Endpoint: POST https://api.apollo.io/api/v1/people/match
//
// Activates when APOLLO_API_KEY is set; returns null otherwise (graceful degrade).

export interface ApolloPersonMatch {
  name: string;
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  email_status?: string;
  phone?: string;
  linkedin_url: string;
  photo_url?: string;
  city?: string;
  state?: string;
  country?: string;
  current_organization?: {
    name: string;
    website_url?: string;
    industry?: string;
  };
  employment_history?: Array<{
    organization_name?: string;
    title?: string;
    start_date?: string;
    end_date?: string;
    current?: boolean;
  }>;
  seniority?: string;
}

const APOLLO_BASE = "https://api.apollo.io/api/v1";

export interface ApolloMatchInput {
  email?: string;
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  domain?: string;
  linkedin_url?: string;
}

export async function apolloPersonMatch(
  input: ApolloMatchInput
): Promise<ApolloPersonMatch | null> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return null;

  // Need at least one identity field
  if (!input.email && !input.linkedin_url && !(input.first_name && input.last_name)) {
    return null;
  }

  try {
    const res = await fetch(`${APOLLO_BASE}/people/match`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        organization_name: input.organization_name,
        domain: input.domain,
        linkedin_url: input.linkedin_url,
        reveal_personal_emails: false,
        reveal_phone_number: false,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const p = data.person;
    if (!p) return null;
    return {
      name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
      first_name: p.first_name ?? "",
      last_name: p.last_name ?? "",
      title: p.title ?? "",
      email: p.email ?? "",
      email_status: p.email_status,
      phone: p.sanitized_phone ?? p.phone_numbers?.[0]?.sanitized_number ?? "",
      linkedin_url: p.linkedin_url ?? "",
      photo_url: p.photo_url,
      city: p.city,
      state: p.state,
      country: p.country,
      current_organization: p.organization
        ? {
            name: p.organization.name ?? "",
            website_url: p.organization.website_url,
            industry: p.organization.industry,
          }
        : undefined,
      employment_history: p.employment_history?.slice(0, 6).map((e: any) => ({
        organization_name: e.organization_name,
        title: e.title,
        start_date: e.start_date,
        end_date: e.end_date,
        current: e.current,
      })),
      seniority: p.seniority,
    };
  } catch {
    return null;
  }
}

/**
 * Variant: search people by company + location (for finding decision-makers within
 * an LLC that owns a property). Useful when a Grid signal is on an LLC-owned home.
 */
export async function apolloPeopleByCompany(
  organization: string,
  city?: string,
  limit = 5
): Promise<ApolloPersonMatch[]> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey || !organization) return [];

  try {
    const body: Record<string, unknown> = {
      q_organization_name: organization,
      page: 1,
      per_page: limit,
    };
    if (city) body.person_locations = [city];

    const res = await fetch(`${APOLLO_BASE}/mixed_people/api_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const people: any[] = data.people ?? [];
    return people.slice(0, limit).map((p) => ({
      name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
      first_name: p.first_name ?? "",
      last_name: p.last_name ?? "",
      title: p.title ?? "",
      email: p.email ?? "",
      phone: p.sanitized_phone ?? p.phone_numbers?.[0]?.sanitized_number ?? "",
      linkedin_url: p.linkedin_url ?? "",
      photo_url: p.photo_url,
      city: p.city,
      state: p.state,
      country: p.country,
      current_organization: p.organization
        ? {
            name: p.organization.name ?? "",
            website_url: p.organization.website_url,
            industry: p.organization.industry,
          }
        : undefined,
      seniority: p.seniority,
    }));
  } catch {
    return [];
  }
}
