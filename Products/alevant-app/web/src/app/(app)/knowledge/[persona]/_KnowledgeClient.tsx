"use client";

import Link from "next/link";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Image as ImageIcon,
  Upload,
  Folder,
  Tag as TagIcon,
  Save,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type {
  KbPersona,
  KnowledgeCollection,
  KnowledgeEntry,
  KnowledgeFile,
} from "@/lib/kb";

interface Props {
  persona: KbPersona;
  collections: KnowledgeCollection[];
  entries: KnowledgeEntry[];
  files: KnowledgeFile[];
  fileUrls: Record<string, string>;
}

const TABS: { id: KbPersona; label: string; href: string }[] = [
  { id: "sofia", label: "Sofia", href: "/knowledge/sofia" },
  { id: "vesper", label: "Vesper", href: "/knowledge/vesper" },
  { id: "shared", label: "Shared", href: "/knowledge/shared" },
];

const PERSONA_BLURB: Record<KbPersona, string> = {
  sofia: "How Sofia thinks like Thomas — voice rules, neighborhood expertise, objection handlers, qualifying playbooks.",
  vesper: "How Vesper posts like Thomas — caption examples, photo references, channel tone, brand mood.",
  shared: "Compliance language and brand identity used by both Sofia and Vesper.",
};

const SOFIA_CATEGORIES = [
  "voice_rule", "do_not_say", "neighborhood_fact", "building_fact",
  "objection_handler", "qualifying_rule", "transcript", "compliance_phrase", "fact",
];
const VESPER_CATEGORIES = [
  "voice_example", "visual_reference", "do_not_use", "channel_tone",
  "campaign_template", "mood_reference", "past_campaign", "fact",
];
const SHARED_CATEGORIES = [
  "compliance_phrase", "fair_housing_synonym", "disclaimer", "fact",
];

function categoriesFor(p: KbPersona) {
  return p === "sofia" ? SOFIA_CATEGORIES : p === "vesper" ? VESPER_CATEGORIES : SHARED_CATEGORIES;
}

export function KnowledgeClient({ persona, collections, entries, files, fileUrls }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<string | "all">("all");

  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags))).sort();
  const filtered = entries.filter((e) => {
    if (filter && !`${e.title}\n${e.body ?? ""}`.toLowerCase().includes(filter.toLowerCase())) return false;
    if (filterTag && !e.tags.includes(filterTag)) return false;
    if (collectionFilter !== "all" && e.collection_id !== collectionFilter) return false;
    return true;
  });

  return (
    <div className="px-10 py-12 max-w-6xl">
      {/* Header */}
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Knowledge base</p>
        <h1 className="serif-display text-ink text-5xl mb-2">Teach the AI.</h1>
        <p className="serif-italic text-stone text-base max-w-3xl">{PERSONA_BLURB[persona]}</p>
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 mb-8 border-b border-mist">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={`px-5 py-3 text-sm transition-colors border-b-2 -mb-px ${
              t.id === persona
                ? "border-indigo text-indigo font-medium"
                : "border-transparent text-stone hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Input
          placeholder="Search title or body…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={collectionFilter}
          onChange={(e) => setCollectionFilter(e.target.value)}
          className="bg-parchment border border-mist px-4 py-3 text-sm text-ink"
        >
          <option value="all">All collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="w-3 h-3 mr-1" /> New entry
          </Button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterTag(null)}
            className={`text-[10px] uppercase tracking-[0.18em] px-3 py-1 border ${
              !filterTag ? "border-indigo text-indigo bg-indigo/5" : "border-mist text-stone hover:border-indigo"
            }`}
          >
            All tags
          </button>
          {allTags.slice(0, 30).map((t) => (
            <button
              key={t}
              onClick={() => setFilterTag(filterTag === t ? null : t)}
              className={`text-[10px] uppercase tracking-[0.18em] px-3 py-1 border ${
                filterTag === t ? "border-indigo text-indigo bg-indigo/5" : "border-mist text-stone hover:border-indigo"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* New entry form */}
      {adding && (
        <EntryForm
          persona={persona}
          collections={collections}
          onClose={() => setAdding(false)}
          mode="create"
        />
      )}

      {/* Vesper file gallery */}
      {persona === "vesper" && (
        <FileGallerySection persona={persona} files={files} fileUrls={fileUrls} />
      )}

      {/* Entries */}
      <section className="space-y-4">
        {filtered.length === 0 ? (
          <div className="border border-mist bg-bone p-12 text-center">
            <p className="serif-display text-ink text-2xl mb-2">No entries match.</p>
            <p className="text-sm text-stone">Try clearing filters or click "New entry" to add one.</p>
          </div>
        ) : (
          filtered.map((e) => {
            const collection = collections.find((c) => c.id === e.collection_id);
            return editingId === e.id ? (
              <EntryForm
                key={e.id}
                persona={persona}
                collections={collections}
                onClose={() => setEditingId(null)}
                mode="edit"
                entry={e}
              />
            ) : (
              <EntryRow
                key={e.id}
                entry={e}
                collection={collection}
                onEdit={() => setEditingId(e.id)}
              />
            );
          })
        )}
      </section>
    </div>
  );
}

function EntryRow({ entry, collection, onEdit }: { entry: KnowledgeEntry; collection?: KnowledgeCollection; onEdit: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function togglePin() {
    setPending(true);
    try {
      await fetch("/api/kb/entries", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: entry.id, is_pinned: !entry.is_pinned }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${entry.title}"?`)) return;
    setPending(true);
    try {
      await fetch(`/api/kb/entries?id=${entry.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <article
      className={`border bg-parchment transition-colors ${
        entry.is_pinned ? "border-indigo/40" : "border-mist hover:border-indigo/40"
      }`}
    >
      <div className="px-6 py-4 grid grid-cols-[1fr_auto] gap-4 items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="serif-display text-ink text-xl">{entry.title}</p>
            {entry.is_pinned && <Badge tone="indigo">Pinned</Badge>}
            {collection && (
              <span className="text-[10px] uppercase tracking-[0.18em] text-stone flex items-center gap-1">
                <Folder className="w-3 h-3" /> {collection.name}
              </span>
            )}
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone">
              · {entry.category.replace(/_/g, " ")}
            </span>
            {entry.source !== "manual" && (
              <span className="text-[10px] uppercase tracking-[0.18em] text-brass">
                · {entry.source.replace(/_/g, " ")}
              </span>
            )}
          </div>
          {entry.body && (
            <p className="text-sm text-smoke leading-relaxed whitespace-pre-wrap">{entry.body}</p>
          )}
          {entry.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {entry.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] uppercase tracking-[0.18em] text-stone border border-mist px-2 py-0.5 inline-flex items-center gap-1"
                >
                  <TagIcon className="w-2.5 h-2.5" /> {t}
                </span>
              ))}
            </div>
          )}
          {entry.source_url && (
            <a
              href={entry.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo hover:underline mt-2 inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" /> source
            </a>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={togglePin}
            disabled={pending}
            className={`p-1.5 ${entry.is_pinned ? "text-indigo" : "text-stone hover:text-indigo"}`}
            title={entry.is_pinned ? "Unpin" : "Pin (always include in prompt)"}
          >
            <Star className="w-4 h-4" fill={entry.is_pinned ? "currentColor" : "none"} />
          </button>
          <button onClick={onEdit} className="p-1.5 text-stone hover:text-indigo" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={remove} disabled={pending} className="p-1.5 text-stone hover:text-hot" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function EntryForm({
  persona,
  collections,
  onClose,
  mode,
  entry,
}: {
  persona: KbPersona;
  collections: KnowledgeCollection[];
  onClose: () => void;
  mode: "create" | "edit";
  entry?: KnowledgeEntry;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [category, setCategory] = useState(entry?.category ?? categoriesFor(persona)[0]);
  const [collectionId, setCollectionId] = useState<string | "">(entry?.collection_id ?? "");
  const [tagsText, setTagsText] = useState((entry?.tags ?? []).join(", "));
  const [pinned, setPinned] = useState(entry?.is_pinned ?? false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setPending(true);
    setError(null);
    const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      const payload = {
        ...(mode === "edit" && entry ? { id: entry.id } : { persona }),
        category,
        title: title.trim(),
        body: body.trim(),
        tags,
        is_pinned: pinned,
        collection_id: collectionId || null,
      };
      const r = await fetch("/api/kb/entries", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "failed");
      router.refresh();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="border border-indigo bg-indigo/5 mb-4">
      <div className="px-6 py-5">
        <p className="eyebrow !text-indigo mb-3">{mode === "edit" ? "Edit entry" : "New entry"}</p>
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            autoFocus
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Body — facts, instructions, examples, talking points…"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-parchment border border-mist px-4 py-3 text-sm text-ink"
            >
              {categoriesFor(persona).map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className="bg-parchment border border-mist px-4 py-3 text-sm text-ink"
            >
              <option value="">No collection</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="tags, comma, separated"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Pin (always include in AI prompt — use sparingly)
          </label>
          {error && <p className="text-xs text-hot">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={submit} disabled={pending}>
              <Save className="w-3 h-3 mr-1" /> {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Save entry"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function FileGallerySection({
  persona,
  files,
  fileUrls,
}: {
  persona: KbPersona;
  files: KnowledgeFile[];
  fileUrls: Record<string, string>;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const f of Array.from(list)) {
        const fd = new FormData();
        fd.append("persona", persona);
        fd.append("file", f);
        const r = await fetch("/api/kb/files", { method: "POST", body: fd });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `upload failed: ${f.name}`);
      }
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this file?")) return;
    await fetch(`/api/kb/files?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="mb-10 border border-mist bg-parchment">
      <div className="px-6 py-4 border-b border-mist flex items-center justify-between">
        <div>
          <p className="eyebrow !text-brass">Visual library</p>
          <p className="text-xs text-stone mt-1">Photos, videos, brochures Vesper learns from. Up to 15 MB per file.</p>
        </div>
        <div>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <Button size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
            <Upload className="w-3 h-3 mr-1" /> {uploading ? "Uploading…" : "Upload files"}
          </Button>
        </div>
      </div>
      {error && <div className="px-6 py-2 text-xs text-hot">{error}</div>}
      <div className="p-4">
        {files.length === 0 ? (
          <div className="text-center py-12 text-sm text-stone">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-mist" strokeWidth={1.2} />
            No files yet. Upload headshots, listing photos, drone footage, brochures — Vesper will learn from them.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {files.map((f) => {
              const url = fileUrls[f.id];
              const isImage = (f.file_type ?? "").startsWith("image/");
              return (
                <div key={f.id} className="relative group border border-mist bg-bone aspect-square overflow-hidden">
                  {isImage && url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={f.caption ?? f.file_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone p-3 text-center">
                      <ImageIcon className="w-6 h-6 mb-1" strokeWidth={1.2} />
                      <p className="text-[10px] truncate max-w-full">{f.file_name}</p>
                    </div>
                  )}
                  <button
                    onClick={() => remove(f.id)}
                    className="absolute top-1 right-1 p-1.5 bg-ink/70 text-parchment opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
