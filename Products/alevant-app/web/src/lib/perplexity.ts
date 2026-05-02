// Perplexity AI wrapper — real-time web search w/ source citations.
// Used by the news scanner + market intel feeds.
// Docs: https://docs.perplexity.ai/

const PPLX_BASE = "https://api.perplexity.ai";

export interface PerplexityCitation {
  title?: string;
  url: string;
}

export interface PerplexityResponse {
  text: string;
  citations: PerplexityCitation[];
}

export async function pplxQuery(prompt: string, opts: { recency?: "hour" | "day" | "week" | "month"; max_tokens?: number } = {}): Promise<PerplexityResponse> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) throw new Error("PERPLEXITY_API_KEY missing");

  const r = await fetch(`${PPLX_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: "You are an editorial real-estate market analyst. Return concise, fact-anchored summaries with source citations." },
        { role: "user", content: prompt },
      ],
      max_tokens: opts.max_tokens ?? 600,
      search_recency_filter: opts.recency || "week",
      return_citations: true,
    }),
  });
  if (!r.ok) throw new Error(`Perplexity ${r.status} ${await r.text()}`);
  const json = await r.json();
  const text = json?.choices?.[0]?.message?.content || "";
  const citations: PerplexityCitation[] = (json?.citations || []).map((url: string) => ({ url }));
  return { text, citations };
}
