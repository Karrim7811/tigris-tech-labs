// Perplexity sonar — web-grounded research as a fallback / supplement.
// Adapted from PRAIX's pattern but reshaped for a real-estate agent researching
// a person (not a commercial-insurance producer researching a company).

const PERPLEXITY_BASE = "https://api.perplexity.ai/chat/completions";

export interface PerplexityPersonIntel {
  raw_text: string;
  citations?: string[];
}

async function perplexity(prompt: string, maxTokens = 1000): Promise<PerplexityPersonIntel | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(PERPLEXITY_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const citations: string[] | undefined = data.citations;
    return text ? { raw_text: text, citations } : null;
  } catch {
    return null;
  }
}

/**
 * Person-focused real-estate research. Refuses to ask about protected-class
 * attributes by prompt construction.
 */
export async function perplexityPersonIntel(
  name: string,
  city?: string,
  context?: string
): Promise<PerplexityPersonIntel | null> {
  if (!name) return null;
  const locationHint = city ? ` based in ${city}` : "";
  const ctxHint = context ? ` Additional context: ${context}` : "";
  const prompt = `Research the public-domain profile of "${name}"${locationHint} for a real-estate agent who is about to reach out to them.${ctxHint}

Focus on PUBLIC, PROFESSIONAL, AND REAL-ESTATE-RELEVANT facts only:
- Current job, company, professional background
- Public real-estate activity: properties owned, businesses involved with, LLC affiliations, developments, professional licenses
- Recent news mentions, press, interviews, podcast appearances
- Public social presence (LinkedIn, professional Twitter/X — not private Instagram)
- Charitable/board affiliations relevant to their professional standing
- Any public indication of a relocation, job change, life event newsworthy enough to be reported

DO NOT report:
- Race, color, national origin, religion, sex, sexual orientation, gender identity
- Familial status (marriage / children) unless self-disclosed publicly on a professional platform
- Disability status
- Any inference about protected class

Cite each fact with the source URL. Be concise. Use bullet points. Say "no public information found" for any category that has nothing public.`;
  return perplexity(prompt, 1200);
}

/**
 * Resolve a LinkedIn URL when other vendors have failed. Returns the URL string only.
 */
export async function perplexityFindLinkedIn(
  name: string,
  city?: string,
  company?: string
): Promise<string | null> {
  if (!name) return null;
  const parts = [name, city, company].filter(Boolean).join(", ");
  const prompt = `What is the LinkedIn profile URL for: ${parts}? Return ONLY the URL in the format https://www.linkedin.com/in/SLUG — nothing else, no commentary.`;
  const out = await perplexity(prompt, 100);
  if (!out?.raw_text) return null;
  const m = out.raw_text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  return m ? m[0] : null;
}

/**
 * Property-centric intel — given an address, what's been said publicly about it?
 * Useful for the prospect detail page when the contact is from a Grid signal.
 */
export async function perplexityPropertyIntel(
  address: string
): Promise<PerplexityPersonIntel | null> {
  if (!address) return null;
  const prompt = `Research the property at "${address}" for a real-estate agent. Focus on PUBLIC information only:
- Recent sale history (if reported in public records / news)
- Notable past owners or history
- Any news mentions, listings, articles
- HOA / building reputation if a condo
- Recent permits, renovations, or development plans

Cite sources. Use bullet points. Skip categories with no public info.`;
  return perplexity(prompt, 800);
}
