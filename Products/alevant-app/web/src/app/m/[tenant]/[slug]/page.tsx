// Public listing microsite — dynamically themed per tenant.
// Path: /m/{tenant}/{slug}  (resolved by tenant subdomain in production: bichi.miami/m/2150oceandrive-ph4)
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { getSupabaseService } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function ListingMicrosite({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}) {
  const { tenant, slug } = await params;

  const sb = getSupabaseService();
  const { data: ws } = await sb.from("workspaces").select("id, name, brand_kit_id, slug").eq("slug", tenant).maybeSingle();
  if (!ws) return notFound();

  const { data: kit } = await sb.from("brand_kits").select("*").eq("id", ws.brand_kit_id ?? "").maybeSingle();
  const { data: listing } = await sb
    .from("listings")
    .select("*")
    .eq("workspace_id", ws.id)
    .eq("microsite_slug", slug)
    .maybeSingle();
  if (!listing) return notFound();

  const primary = kit?.primary_color || "#0E5560";
  const accent = kit?.accent_color || "#B5853E";
  const surface = kit?.surface_color || "#FAFAF8";
  const ink = kit?.ink_color || "#1A1915";

  return (
    <div style={{ background: surface, color: ink, minHeight: "100vh" }}>
      <header
        style={{
          padding: "24px 40px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span className="serif-italic" style={{ fontSize: 24, color: ink }}>
          {kit?.wordmark_text || ws.name}
        </span>
        <span style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: ink, opacity: 0.6 }}>
          Brokered by Keller Williams Capital Realty
        </span>
      </header>

      <section style={{ padding: "120px 40px 80px", textAlign: "center" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", color: accent, marginBottom: 24 }}>
          Just Listed · {listing.city}, {listing.state}
        </p>
        <h1 className="serif-display" style={{ fontSize: "clamp(40px, 6vw, 88px)", color: ink, lineHeight: 1, marginBottom: 28 }}>
          {listing.address}
        </h1>
        <p className="serif-italic" style={{ fontSize: 22, color: ink, opacity: 0.65, marginBottom: 40 }}>
          {listing.beds} bedrooms · {listing.baths} bathrooms · {listing.sqft?.toLocaleString()} square feet
        </p>
        <p className="serif-display" style={{ fontSize: 36, color: accent, marginBottom: 56 }}>
          {formatCurrency(Number(listing.price))}
        </p>
        <a
          href="#schedule"
          style={{
            display: "inline-block",
            padding: "14px 32px",
            background: primary,
            color: surface,
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Schedule a private viewing
        </a>
      </section>

      {listing.description && (
        <section style={{ padding: "80px 40px", maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <p className="serif-italic" style={{ fontSize: 20, color: ink, opacity: 0.85, lineHeight: 1.7 }}>
            {listing.description}
          </p>
        </section>
      )}

      <footer style={{ padding: "60px 40px", textAlign: "center", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <span className="serif-italic" style={{ fontSize: 32, color: ink }}>
          {kit?.wordmark_text || ws.name}
        </span>
        {kit?.tagline && (
          <p className="serif-italic" style={{ fontSize: 14, color: ink, opacity: 0.55, marginTop: 8 }}>
            {kit.tagline}
          </p>
        )}
        <p style={{ fontSize: 10, letterSpacing: "0.32em", textTransform: "uppercase", color: ink, opacity: 0.4, marginTop: 32 }}>
          Powered by ALEVANT · A Tigris Tech Labs Product
        </p>
      </footer>
    </div>
  );
}
