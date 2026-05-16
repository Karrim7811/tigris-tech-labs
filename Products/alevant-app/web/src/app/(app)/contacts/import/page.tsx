"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ParsedRow {
  full_name?: string;
  emails: string[];
  phones: string[];
  category?: string;
  lifecycle_stage?: string;
  language?: string;
  tags: string[];
  source?: string;
  notes?: string;
  _line: number;
  _error?: string;
}

const TEMPLATE = `full_name,email,phone,category,lifecycle_stage,tags,language,notes
Carlos Mendes,carlos@example.com,+13055550100,buyer,prospect,"brickell,investor",en,Met at open house
Andrea Castillo,andrea@example.com,+13055550101,seller,lead,coral-gables,es,Owns 330 Sunset Dr
Marcus Webb,marcus@example.com,+13055550102,lead,prospect,,en,
`;

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];
  const headerLine = lines[0];
  const headers = splitCsvRow(headerLine).map((h) => h.toLowerCase().trim());
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvRow(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, j) => (obj[h] = cells[j] ?? ""));
    const emails = (obj.email || obj.emails || "")
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const phones = (obj.phone || obj.phones || "")
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const tags = (obj.tags || "")
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const row: ParsedRow = {
      full_name: obj.full_name || obj.name || undefined,
      emails,
      phones,
      category: obj.category || "lead",
      lifecycle_stage: obj.lifecycle_stage || obj.stage || "prospect",
      language: obj.language || "en",
      tags,
      source: obj.source || "import",
      notes: obj.notes || undefined,
      _line: i + 1,
    };
    if (!row.full_name && emails.length === 0 && phones.length === 0) {
      row._error = "no name, email, or phone";
    }
    rows.push(row);
  }
  return rows;
}

// Minimal RFC-4180-ish CSV row splitter with quoted-field support.
function splitCsvRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQ = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
  }
  out.push(cur);
  return out;
}

export default function ImportContactsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [filename, setFilename] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFilename(f.name);
    const text = await f.text();
    const parsed = parseCSV(text);
    setRows(parsed);
    setError(null);
    setResult(null);
  }

  async function submit() {
    const valid = rows.filter((r) => !r._error);
    if (!valid.length) {
      setError("No valid rows to import.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contacts: valid.map((r) => ({
            full_name: r.full_name,
            emails: r.emails,
            phones: r.phones,
            category: r.category,
            lifecycle_stage: r.lifecycle_stage,
            tags: r.tags,
            language: r.language,
            source: r.source,
            notes: r.notes,
            prospect_source: "import",
          })),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Unknown" }));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const j = await res.json();
      setResult({ inserted: j.inserted ?? 0, skipped: j.skipped ?? 0 });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alevant-contacts-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const validCount = rows.filter((r) => !r._error).length;
  const errorCount = rows.length - validCount;

  return (
    <div className="px-10 py-12 max-w-5xl">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-stone hover:text-ink mb-8"
      >
        <ArrowLeft className="w-3 h-3" /> Back to contacts
      </Link>

      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Import CSV</p>
        <h1 className="serif-display text-ink text-5xl">Bulk-add contacts.</h1>
        <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
          Upload a CSV exported from Follow Up Boss, kvCORE, BoomTown, Google Contacts,
          or a spreadsheet. Required columns: at least one of <code>full_name</code>,{" "}
          <code>email</code>, <code>phone</code>. Optional:{" "}
          <code>category, lifecycle_stage, tags, language, notes, source</code>.
        </p>
      </header>

      <div className="grid grid-cols-[1fr_auto] gap-3 items-stretch mb-8">
        <label className="border-2 border-dashed border-mist bg-parchment p-6 cursor-pointer hover:border-indigo transition-colors flex items-center gap-4">
          <Upload className="w-6 h-6 text-stone" />
          <div>
            <p className="serif-display text-ink text-xl">
              {filename || "Drop a CSV here, or click to choose"}
            </p>
            <p className="text-xs text-stone mt-1">
              {filename ? `${rows.length} rows parsed` : "We'll preview before importing."}
            </p>
          </div>
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
        </label>
        <button
          type="button"
          onClick={downloadTemplate}
          className="px-5 text-xs uppercase tracking-[0.28em] border border-mist text-stone hover:text-ink hover:border-indigo"
        >
          Download template
        </button>
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex items-center gap-6 mb-4 text-sm">
            <span className="flex items-center gap-2 text-indigo">
              <CheckCircle2 className="w-4 h-4" /> {validCount} valid
            </span>
            {errorCount > 0 && (
              <span className="flex items-center gap-2 text-hot">
                <AlertCircle className="w-4 h-4" /> {errorCount} skipped
              </span>
            )}
          </div>

          <div className="border border-mist bg-parchment mb-6 overflow-hidden">
            <div className="grid grid-cols-[40px_2fr_1.5fr_1.5fr_120px_120px_1fr] gap-3 px-5 py-3 border-b border-mist text-[10px] tracking-[0.28em] uppercase text-stone">
              <div>#</div>
              <div>Name</div>
              <div>Email</div>
              <div>Phone</div>
              <div>Category</div>
              <div>Stage</div>
              <div>Tags</div>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {rows.slice(0, 200).map((r) => (
                <div
                  key={r._line}
                  className={`grid grid-cols-[40px_2fr_1.5fr_1.5fr_120px_120px_1fr] gap-3 px-5 py-2.5 border-b border-mist/40 last:border-0 text-sm ${
                    r._error ? "bg-hot/5" : ""
                  }`}
                >
                  <div className="text-stone text-xs">{r._line}</div>
                  <div className={r._error ? "text-hot" : "text-ink"}>
                    {r.full_name || "—"}
                    {r._error && (
                      <span className="block text-[10px] uppercase tracking-wider mt-0.5">
                        {r._error}
                      </span>
                    )}
                  </div>
                  <div className="text-smoke text-xs truncate">{r.emails.join(", ") || "—"}</div>
                  <div className="text-smoke text-xs truncate">{r.phones.join(", ") || "—"}</div>
                  <div className="text-smoke text-xs uppercase tracking-wider">{r.category}</div>
                  <div className="text-smoke text-xs uppercase tracking-wider">
                    {r.lifecycle_stage}
                  </div>
                  <div className="text-smoke text-xs truncate">{r.tags.join(", ")}</div>
                </div>
              ))}
              {rows.length > 200 && (
                <div className="px-5 py-3 text-xs text-stone text-center bg-mist/20">
                  …{rows.length - 200} more rows hidden from preview
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="border border-hot bg-hot/5 px-4 py-3 text-sm text-hot mb-4">{error}</div>
      )}

      {result && (
        <div className="border border-indigo bg-indigo/5 px-4 py-3 text-sm text-indigo mb-4 flex items-center justify-between">
          <span>
            <CheckCircle2 className="w-4 h-4 inline mr-2" />
            Imported {result.inserted} contacts.{" "}
            {result.skipped > 0 && `${result.skipped} skipped.`}
          </span>
          <button
            onClick={() => router.push("/contacts")}
            className="text-xs uppercase tracking-[0.28em] underline"
          >
            View contacts
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-mist">
        <button
          type="button"
          disabled={!rows.length || submitting || validCount === 0}
          onClick={submit}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-[0.28em] bg-indigo text-parchment hover:bg-indigo-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {submitting ? "Importing…" : `Import ${validCount} contact${validCount === 1 ? "" : "s"}`}
        </button>
        <Link
          href="/contacts"
          className="px-5 py-2.5 text-xs uppercase tracking-[0.28em] text-stone hover:text-ink"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
