/**
 * Knowledge base — hybrid storage (structured rows + pgvector embeddings).
 *
 * V1: CRUD on entries + collections + files. Embeddings are populated by a
 * background job when the Voyage API key lands; until then entries store
 * NULL in the embedding column and retrieval falls back to tag/category
 * filtering. The `searchByTags` function is the V1 retrieval path.
 *
 * V2 will add `searchBySimilarity` once embeddings are computed.
 */
import { getSupabaseService } from "@/lib/supabase/server";

export type KbPersona = "sofia" | "vesper" | "shared";

export interface KnowledgeCollection {
  id: string;
  workspace_id: string;
  persona: KbPersona;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
}

export interface KnowledgeEntry {
  id: string;
  workspace_id: string;
  persona: KbPersona;
  collection_id: string | null;
  category: string;
  title: string;
  body: string | null;
  metadata: Record<string, any>;
  tags: string[];
  is_pinned: boolean;
  source: string;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeFile {
  id: string;
  workspace_id: string;
  entry_id: string | null;
  persona: KbPersona;
  storage_path: string;
  file_name: string;
  file_type: string | null;
  file_size_bytes: number | null;
  caption: string | null;
  tags: string[];
  shot_type: string | null;
  time_of_day: string | null;
  mood: string | null;
  is_approved: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

const STORAGE_BUCKET = "knowledge-files";

/** Read collections + entries + files for a workspace+persona. */
export async function loadKnowledge(workspaceId: string, persona: KbPersona) {
  const svc = getSupabaseService();
  const [{ data: collections }, { data: entries }, { data: files }] = await Promise.all([
    svc
      .from("knowledge_collections")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("persona", persona)
      .order("sort_order", { ascending: true }),
    svc
      .from("knowledge_entries")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("persona", persona)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false }),
    svc
      .from("knowledge_files")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("persona", persona)
      .order("created_at", { ascending: false }),
  ]);

  return {
    collections: (collections ?? []) as KnowledgeCollection[],
    entries: (entries ?? []) as KnowledgeEntry[],
    files: (files ?? []) as KnowledgeFile[],
  };
}

export interface CreateEntryInput {
  workspaceId: string;
  persona: KbPersona;
  collection_id?: string | null;
  category: string;
  title: string;
  body?: string;
  tags?: string[];
  is_pinned?: boolean;
  source?: string;
  source_url?: string | null;
  metadata?: Record<string, any>;
}

export async function createEntry(input: CreateEntryInput): Promise<KnowledgeEntry> {
  const svc = getSupabaseService();
  const { data, error } = await svc
    .from("knowledge_entries")
    .insert({
      workspace_id: input.workspaceId,
      persona: input.persona,
      collection_id: input.collection_id ?? null,
      category: input.category,
      title: input.title,
      body: input.body ?? null,
      tags: input.tags ?? [],
      is_pinned: input.is_pinned ?? false,
      source: input.source ?? "manual",
      source_url: input.source_url ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as KnowledgeEntry;
}

export async function updateEntry(input: {
  id: string;
  title?: string;
  body?: string | null;
  tags?: string[];
  is_pinned?: boolean;
  collection_id?: string | null;
  category?: string;
}): Promise<void> {
  const svc = getSupabaseService();
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.body !== undefined) patch.body = input.body;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.is_pinned !== undefined) patch.is_pinned = input.is_pinned;
  if (input.collection_id !== undefined) patch.collection_id = input.collection_id;
  if (input.category !== undefined) patch.category = input.category;
  const { error } = await svc.from("knowledge_entries").update(patch).eq("id", input.id);
  if (error) throw new Error(error.message);
}

export async function deleteEntry(id: string): Promise<void> {
  const svc = getSupabaseService();
  const { error } = await svc.from("knowledge_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createCollection(input: {
  workspaceId: string;
  persona: KbPersona;
  name: string;
  description?: string;
}): Promise<KnowledgeCollection> {
  const svc = getSupabaseService();
  const { data, error } = await svc
    .from("knowledge_collections")
    .insert({
      workspace_id: input.workspaceId,
      persona: input.persona,
      name: input.name,
      description: input.description ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as KnowledgeCollection;
}

/**
 * Upload a file to the knowledge-files bucket and create a knowledge_files
 * row. Returns the row plus a freshly-signed URL for immediate display.
 */
export async function uploadKnowledgeFile(input: {
  workspaceId: string;
  persona: KbPersona;
  entryId?: string | null;
  fileName: string;
  fileType: string;
  bytes: ArrayBuffer | Uint8Array | Buffer;
  caption?: string;
  tags?: string[];
  shot_type?: string | null;
  time_of_day?: string | null;
  mood?: string | null;
}): Promise<{ file: KnowledgeFile; signedUrl: string | null }> {
  const svc = getSupabaseService();
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${input.workspaceId}/${input.persona}/${Date.now()}_${safeName}`;
  const buffer =
    input.bytes instanceof Uint8Array
      ? input.bytes
      : Buffer.isBuffer(input.bytes)
      ? input.bytes
      : new Uint8Array(input.bytes as ArrayBuffer);
  const { error: uploadErr } = await svc.storage.from(STORAGE_BUCKET).upload(path, buffer, {
    contentType: input.fileType,
    upsert: false,
  });
  if (uploadErr) throw new Error(`upload failed: ${uploadErr.message}`);

  const { data: row, error: rowErr } = await svc
    .from("knowledge_files")
    .insert({
      workspace_id: input.workspaceId,
      persona: input.persona,
      entry_id: input.entryId ?? null,
      storage_path: path,
      file_name: input.fileName,
      file_type: input.fileType,
      file_size_bytes: buffer.byteLength,
      caption: input.caption ?? null,
      tags: input.tags ?? [],
      shot_type: input.shot_type ?? null,
      time_of_day: input.time_of_day ?? null,
      mood: input.mood ?? null,
    })
    .select()
    .single();
  if (rowErr) throw new Error(rowErr.message);

  const { data: signed } = await svc.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 60 * 24);
  return { file: row as KnowledgeFile, signedUrl: signed?.signedUrl ?? null };
}

export async function deleteKnowledgeFile(fileId: string): Promise<void> {
  const svc = getSupabaseService();
  const { data: row } = await svc
    .from("knowledge_files")
    .select("storage_path")
    .eq("id", fileId)
    .maybeSingle();
  if (row?.storage_path) {
    await svc.storage.from(STORAGE_BUCKET).remove([row.storage_path]);
  }
  await svc.from("knowledge_files").delete().eq("id", fileId);
}

/** Sign URLs for a batch of files so the gallery can render them. */
export async function signFileUrls(files: KnowledgeFile[]): Promise<Record<string, string>> {
  const svc = getSupabaseService();
  const out: Record<string, string> = {};
  await Promise.all(
    files.map(async (f) => {
      const { data } = await svc.storage.from(STORAGE_BUCKET).createSignedUrl(f.storage_path, 60 * 60 * 24);
      if (data?.signedUrl) out[f.id] = data.signedUrl;
    })
  );
  return out;
}
