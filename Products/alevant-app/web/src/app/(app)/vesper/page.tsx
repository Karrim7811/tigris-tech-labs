import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { QueueClient } from "./QueueClient";

export default async function VesperPage() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: ws } = await sb
    .from("workspaces")
    .select("id, vesper_configs(voice_preset, channel_priorities, approval_mode)")
    .eq("owner_user_id", user?.id || "")
    .maybeSingle();
  const cfg = (ws as any)?.vesper_configs;

  const { data: assets } = await sb
    .from("vesper_assets")
    .select("id, asset_type, channel, status, scheduled_for, listing_id, listings:listings(address)")
    .eq("workspace_id", ws?.id || "")
    .order("created_at", { ascending: false })
    .limit(40);

  const items = (assets || []).map((a: any) => ({
    id: a.id,
    asset_type: a.asset_type,
    channel: a.channel,
    status: a.status,
    scheduled_for: a.scheduled_for,
    listing_id: a.listing_id,
    listing_address: a.listings?.address,
  }));

  const counts = {
    awaiting: items.filter((i) => i.status === "awaiting_approval").length,
    approved: items.filter((i) => i.status === "approved").length,
    published: items.filter((i) => i.status === "published").length,
    generating: items.filter((i) => i.status === "generating").length,
  };

  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="flex items-end justify-between mb-10">
        <div>
          <p className="eyebrow !text-indigo mb-2">Vesper Studio</p>
          <h1 className="serif-display text-ink text-5xl">Marketing director.</h1>
          <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
            $10M-tier creative on every listing. Approval-gated by default — graduate to autonomous per channel as trust builds.
          </p>
        </div>
        <Link href="/listings/new" className="btn-base bg-brass text-ink hover:bg-brass-deep hover:text-parchment">
          <Sparkles className="w-4 h-4 mr-2" /> New listing → campaign
        </Link>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-px bg-mist border border-mist mb-10">
        {[
          { label: "Awaiting approval", value: counts.awaiting },
          { label: "Approved", value: counts.approved },
          { label: "Published", value: counts.published },
          { label: "Generating", value: counts.generating },
          { label: "Voice preset", value: (cfg?.voice_preset || "insider").toString() },
        ].map((k) => (
          <div key={k.label} className="bg-parchment p-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-stone mb-2">{k.label}</p>
            <p className="serif-display text-ink text-3xl capitalize">{k.value}</p>
          </div>
        ))}
      </section>

      <section>
        <p className="eyebrow !text-brass mb-4">Approval queue</p>
        <QueueClient items={items} />
      </section>

      <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-px bg-mist border border-mist">
        {[
          { label: "Per-listing campaign", body: "Auto-triggers on Active. 12 assets in <24h." },
          { label: "Weekly content engine", body: "Market stats, just-sold, investor tips, agent personality." },
          { label: "Fair Housing linter", body: "Strict mode. Not bypassable. 100% audit-logged." },
        ].map((c) => (
          <div key={c.label} className="bg-parchment p-6">
            <p className="eyebrow !text-brass mb-3">{c.label}</p>
            <p className="text-sm text-smoke leading-relaxed">{c.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
