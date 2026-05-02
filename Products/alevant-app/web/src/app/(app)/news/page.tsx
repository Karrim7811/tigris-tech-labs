import Link from "next/link";
import { ExternalLink, Newspaper } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  market: "Market",
  listing: "Listing",
  farm_zone: "Farm Zone",
  sphere: "Sphere",
  competitor: "Competitor",
  regulatory: "Regulatory",
  mortgage_rates: "Mortgage Rates",
  pre_construction: "Pre-Construction",
};

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ category?: string; severity?: string }> }) {
  const params = await searchParams;
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: ws } = await sb.from("workspaces").select("id").eq("owner_user_id", user?.id || "").maybeSingle();

  let q = sb
    .from("news_alerts")
    .select("*, listings:listings(address)")
    .eq("workspace_id", ws?.id || "")
    .is("dismissed_at", null)
    .order("surfaced_at", { ascending: false })
    .limit(80);
  if (params.category) q = q.eq("category", params.category);
  if (params.severity) q = q.eq("severity", params.severity);

  const { data: items } = await q;

  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="flex items-end justify-between mb-10">
        <div>
          <p className="eyebrow !text-indigo mb-2">News & Intel</p>
          <h1 className="serif-display text-ink text-5xl">The feed.</h1>
          <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
            Real-time market signal across 8 categories. Sourced via Perplexity, triaged by Claude. Severity tells you whether to act, watch, or just know.
          </p>
        </div>
        <form action="/api/news/scan" method="POST">
          <button type="submit" className="btn-base bg-indigo text-parchment hover:bg-indigo-deep">
            <Newspaper className="w-4 h-4 mr-2" /> Refresh
          </button>
        </form>
      </header>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-10">
        <Link href="/news" className={`btn-base ${!params.category ? "bg-ink text-parchment" : "bg-bone text-ink border border-mist hover:bg-mist"} !px-3 !py-2 !text-[10px]`}>All</Link>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/news?category=${key}`}
            className={`btn-base ${params.category === key ? "bg-ink text-parchment" : "bg-bone text-ink border border-mist hover:bg-mist"} !px-3 !py-2 !text-[10px]`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {(items || []).length === 0 ? (
        <div className="border border-mist bg-bone p-16 text-center">
          <p className="serif-display text-ink text-3xl mb-2">Nothing yet.</p>
          <p className="serif-italic text-stone text-base">Hit Refresh to run the first scan, or wait for the next cron at 7am / 5pm ET.</p>
        </div>
      ) : (
        <section className="space-y-3">
          {(items || []).map((a: any) => (
            <article key={a.id} className="border border-mist bg-parchment p-6 grid grid-cols-1 md:grid-cols-[100px_1fr_140px] gap-4 items-start">
              <div>
                <Badge tone={a.severity === "act" ? "hot" : a.severity === "watch" ? "warm" : "neutral"}>{a.severity}</Badge>
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone mt-3">{CATEGORY_LABELS[a.category] || a.category}</p>
              </div>
              <div>
                <p className="serif-display text-ink text-xl mb-2 leading-snug">{a.title}</p>
                {a.summary && <p className="text-sm text-smoke leading-relaxed mb-3">{a.summary}</p>}
                <div className="flex items-center gap-3 flex-wrap">
                  {a.source_url && (
                    <a href={a.source_url} target="_blank" rel="noreferrer" className="text-xs text-indigo hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> {a.source_name || "Source"}
                    </a>
                  )}
                  {a.listings?.address && (
                    <Link href={`/listings/${a.related_listing_id}`} className="text-xs text-stone hover:text-indigo">
                      Listing · {a.listings.address}
                    </Link>
                  )}
                  {a.related_zip && <span className="text-xs text-stone">ZIP · {a.related_zip}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-stone mb-3">{relativeTime(a.surfaced_at)}</p>
                <form action={`/api/news/dismiss/${a.id}`} method="POST">
                  <button type="submit" className="text-[10px] uppercase tracking-[0.18em] text-stone hover:text-ink">Dismiss</button>
                </form>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
