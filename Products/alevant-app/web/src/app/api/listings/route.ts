import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const { data: { ms } } = { data: { ms: null } } as any;

  const { data: ws } = await sb
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const address = String(form.get("address") || "");
  const microsite_slug = slugify(address);

  const { data: listing, error } = await sb
    .from("listings")
    .insert({
      workspace_id: ws.id,
      address,
      city: String(form.get("city") || ""),
      state: String(form.get("state") || "FL"),
      zip: String(form.get("zip") || ""),
      price: Number(form.get("price")) || null,
      property_type: String(form.get("property_type") || "condo"),
      beds: Number(form.get("beds")) || null,
      baths: Number(form.get("baths")) || null,
      sqft: Number(form.get("sqft")) || null,
      year_built: Number(form.get("year_built")) || null,
      hoa_monthly: Number(form.get("hoa_monthly")) || null,
      description: String(form.get("description") || ""),
      status: String(form.get("status") || "draft"),
      microsite_slug,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-trigger Vesper if requested
  if (form.get("trigger_vesper") || listing?.status === "active") {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/vesper/generate-campaign`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: req.headers.get("cookie") || "" },
      body: JSON.stringify({ listing_id: listing!.id }),
    }).catch(() => {});
  }

  return NextResponse.redirect(new URL(`/listings/${listing!.id}`, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"), { status: 303 });
}
