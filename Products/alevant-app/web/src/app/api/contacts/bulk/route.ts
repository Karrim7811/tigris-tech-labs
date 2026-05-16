import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";

/**
 * POST /api/contacts/bulk
 * Body: { contacts: Partial<ContactInsert>[] }
 *
 * Deduplicates within the batch and against existing rows by (workspace_id, email)
 * — the first email or phone is the dedupe key. Returns inserted/skipped counts.
 */

interface BulkContact {
  full_name?: string;
  emails?: string[];
  phones?: string[];
  category?: string;
  lifecycle_stage?: string;
  tags?: string[];
  language?: string;
  source?: string;
  prospect_source?: string;
  notes?: string;
  relationship_score?: number;
}

const MAX_BATCH = 2000;

export async function POST(req: Request) {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return NextResponse.json({ error: "no workspace" }, { status: 404 });

  const body = await req.json();
  const contacts: BulkContact[] = Array.isArray(body.contacts) ? body.contacts : [];
  if (!contacts.length) {
    return NextResponse.json({ error: "contacts array required" }, { status: 400 });
  }
  if (contacts.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Batch too large; max ${MAX_BATCH} contacts per request` },
      { status: 400 }
    );
  }

  // Normalize + dedupe within the batch by (lowercased first email || first phone || full_name)
  const seen = new Set<string>();
  const normalized: BulkContact[] = [];
  let skipped = 0;
  for (const c of contacts) {
    const emails = (c.emails ?? []).map((s) => s.trim()).filter(Boolean);
    const phones = (c.phones ?? []).map((s) => s.trim()).filter(Boolean);
    const name = c.full_name?.trim();
    if (!name && emails.length === 0 && phones.length === 0) {
      skipped++;
      continue;
    }
    const key = (emails[0] || phones[0] || name || "").toLowerCase();
    if (key && seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    normalized.push({
      full_name: name,
      emails,
      phones,
      category: c.category ?? "lead",
      lifecycle_stage: c.lifecycle_stage ?? "prospect",
      tags: c.tags ?? [],
      language: c.language,
      source: c.source,
      prospect_source: c.prospect_source ?? "import",
      notes: c.notes,
      relationship_score: c.relationship_score ?? 0,
    });
  }

  if (!normalized.length) {
    return NextResponse.json({ inserted: 0, skipped, error: "no valid rows" });
  }

  // Dedupe against existing contacts in this workspace by first-email match (cheap, opinionated)
  const allEmails = normalized.flatMap((c) => c.emails ?? []).filter(Boolean);
  let existingEmails = new Set<string>();
  if (allEmails.length) {
    const { data: existing } = await svc
      .from("contacts")
      .select("emails")
      .eq("workspace_id", ws.id)
      .overlaps("emails", allEmails);
    existingEmails = new Set(
      (existing ?? []).flatMap((r) => (r.emails ?? []).map((e: string) => e.toLowerCase()))
    );
  }

  const toInsert = normalized.filter((c) => {
    if (!c.emails?.length) return true;
    const collision = c.emails.some((e) => existingEmails.has(e.toLowerCase()));
    if (collision) skipped++;
    return !collision;
  });

  if (!toInsert.length) {
    return NextResponse.json({ inserted: 0, skipped });
  }

  const rows = toInsert.map((c) => ({
    workspace_id: ws.id,
    full_name: c.full_name ?? null,
    emails: c.emails ?? [],
    phones: c.phones ?? [],
    category: c.category ?? "lead",
    lifecycle_stage: c.lifecycle_stage ?? "prospect",
    tags: c.tags ?? [],
    language: c.language ?? null,
    source: c.source ?? null,
    prospect_source: c.prospect_source ?? "import",
    notes: c.notes ?? null,
    relationship_score: c.relationship_score ?? 0,
    metadata: {},
  }));

  const { data, error } = await svc.from("contacts").insert(rows).select("id");
  if (error) {
    return NextResponse.json({ error: error.message, skipped }, { status: 500 });
  }
  return NextResponse.json({
    inserted: data?.length ?? 0,
    skipped,
  });
}
