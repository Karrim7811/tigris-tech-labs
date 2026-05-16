// Jina r.jina.ai — free web text extraction.
// Lifted directly from PRAIX. No API key required.
// Useful for pulling raw text from any URL into a Claude prompt.

export async function fetchWebsiteText(url: string, maxChars = 4000): Promise<string> {
  if (!url) return "";
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const jinaUrl = `https://r.jina.ai/${normalized}`;
    const res = await fetch(jinaUrl, {
      signal: AbortSignal.timeout(12000),
      headers: { Accept: "text/plain", "X-Return-Format": "text" },
    });
    if (!res.ok) return "";
    const text = await res.text();
    return text.slice(0, maxChars);
  } catch {
    return "";
  }
}
