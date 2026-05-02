import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function AdminBrandingPage() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: ws } = await sb
    .from("workspaces")
    .select("id, name, custom_domain, brand_kits(*)")
    .eq("owner_user_id", user?.id || "")
    .maybeSingle();
  const kit = (ws as any)?.brand_kits;

  return (
    <div className="px-10 py-12 max-w-5xl">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-stone hover:text-indigo mb-6">
        <ArrowLeft className="w-3 h-3" /> Admin
      </Link>
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Branding</p>
        <h1 className="serif-display text-ink text-5xl">White-label.</h1>
        <p className="serif-italic text-stone text-base mt-2">
          Tenant-side branding. Sofia, Vesper, and listing microsites theme from these values.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="border border-mist bg-parchment p-6">
          <p className="eyebrow !text-brass mb-4">Workspace</p>
          <p className="text-sm text-ink mb-2"><strong>Name:</strong> {ws?.name}</p>
          <p className="text-sm text-ink mb-2"><strong>Custom domain:</strong> {ws?.custom_domain || "—"}</p>
          <p className="text-sm text-ink"><strong>Subdomain:</strong> {`${(ws as any)?.slug || "—"}.alevant.ai`}</p>
        </div>

        <div className="border border-mist bg-parchment p-6">
          <p className="eyebrow !text-brass mb-4">Voice</p>
          <p className="text-sm text-ink mb-2"><strong>Vesper preset:</strong> {kit?.voice_preset || "insider"}</p>
          <p className="text-sm text-ink mb-2"><strong>Tagline:</strong> {kit?.tagline || "—"}</p>
          <p className="text-sm text-ink"><strong>Wordmark:</strong> {kit?.wordmark_text || "—"}</p>
        </div>
      </section>

      <section className="border border-mist bg-parchment p-6">
        <p className="eyebrow !text-brass mb-4">Palette</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Primary", value: kit?.primary_color },
            { label: "Secondary", value: kit?.secondary_color },
            { label: "Accent", value: kit?.accent_color },
            { label: "Surface", value: kit?.surface_color },
            { label: "Ink", value: kit?.ink_color },
          ].map((c) => (
            <div key={c.label}>
              <div
                className="w-full aspect-square border border-mist mb-2"
                style={{ background: c.value || "#fff" }}
              />
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone">{c.label}</p>
              <p className="text-xs text-ink font-mono">{c.value || "—"}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
