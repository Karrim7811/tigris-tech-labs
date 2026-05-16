// Proxycurl (Nubela) LinkedIn enrichment.
// Same pattern as PRAIX's lib but for the PERSON endpoint instead of company.
//
// Docs: https://nubela.co/proxycurl/docs#people-api-person-profile-endpoint
// Endpoint: GET https://nubela.co/proxycurl/api/v2/linkedin
//
// Activates when PROXYCURL_API_KEY is set; returns null otherwise.

export interface ProxycurlPerson {
  full_name: string;
  first_name?: string;
  last_name?: string;
  headline?: string;
  summary?: string;
  occupation?: string;
  city?: string;
  state?: string;
  country?: string;
  experiences?: Array<{
    company?: string;
    title?: string;
    starts_at?: { year?: number; month?: number; day?: number };
    ends_at?: { year?: number; month?: number; day?: number } | null;
    description?: string;
  }>;
  education?: Array<{
    school?: string;
    degree_name?: string;
    field_of_study?: string;
  }>;
  profile_pic_url?: string;
  linkedin_url?: string;
  industry?: string;
  /** Recent post activity summarized — useful for "what's on their mind" */
  activities?: Array<{
    title?: string;
    link?: string;
    activity_status?: string;
  }>;
}

const BASE = "https://nubela.co/proxycurl/api";

export function normalizeLinkedInUrl(url: string): string {
  url = url.trim().replace(/\/$/, "");
  if (!url.startsWith("http")) url = "https://" + url;
  url = url.replace(/^https?:\/\/([\w-]+\.)?linkedin\.com/, "https://www.linkedin.com");
  // Sales Navigator profile URL: /sales/people/ → /in/
  const sn = url.match(/\/sales\/people\/([^,/?]+)/);
  if (sn) url = `https://www.linkedin.com/in/${sn[1]}`;
  return url.split("?")[0];
}

export async function proxycurlPerson(linkedinUrl: string): Promise<ProxycurlPerson | null> {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey || !linkedinUrl) return null;
  const normalized = normalizeLinkedInUrl(linkedinUrl);
  try {
    const url = new URL(`${BASE}/v2/linkedin`);
    url.searchParams.set("linkedin_profile_url", normalized);
    url.searchParams.set("use_cache", "if-recent");
    url.searchParams.set("fallback_to_cache", "on-error");
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const p = await res.json();
    return {
      full_name: p.full_name ?? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
      first_name: p.first_name,
      last_name: p.last_name,
      headline: p.headline,
      summary: p.summary,
      occupation: p.occupation,
      city: p.city,
      state: p.state,
      country: p.country_full_name ?? p.country,
      experiences: (p.experiences ?? []).slice(0, 6).map((e: any) => ({
        company: e.company,
        title: e.title,
        starts_at: e.starts_at,
        ends_at: e.ends_at,
        description: e.description,
      })),
      education: (p.education ?? []).slice(0, 4).map((e: any) => ({
        school: e.school,
        degree_name: e.degree_name,
        field_of_study: e.field_of_study,
      })),
      profile_pic_url: p.profile_pic_url,
      linkedin_url: normalized,
      industry: p.industry,
      activities: (p.activities ?? []).slice(0, 5),
    };
  } catch {
    return null;
  }
}

/** Resolve a person's LinkedIn URL when we only know name + company. */
export async function proxycurlResolvePerson(
  firstName: string,
  lastName: string,
  companyDomain?: string
): Promise<string | null> {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey || !firstName || !lastName) return null;
  try {
    const url = new URL(`${BASE}/linkedin/profile/resolve`);
    url.searchParams.set("first_name", firstName);
    url.searchParams.set("last_name", lastName);
    if (companyDomain) url.searchParams.set("company_domain", companyDomain);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.url ?? null;
  } catch {
    return null;
  }
}
