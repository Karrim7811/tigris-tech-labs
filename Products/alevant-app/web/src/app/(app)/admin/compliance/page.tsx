import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function AdminCompliancePage() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: ws } = await sb.from("workspaces").select("id").eq("owner_user_id", user?.id || "").maybeSingle();

  const [
    { data: acks },
    { data: lintLog },
    { data: consents },
  ] = await Promise.all([
    sb.from("compliance_acknowledgments").select("*").eq("workspace_id", ws?.id || "").order("acknowledged_at", { ascending: false }),
    sb.from("fair_housing_lint_log").select("*").eq("workspace_id", ws?.id || "").order("created_at", { ascending: false }).limit(20),
    sb.from("consent_records").select("*").eq("workspace_id", ws?.id || "").order("granted_at", { ascending: false }).limit(20),
  ]);

  return (
    <div className="px-10 py-12 max-w-6xl">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-stone hover:text-indigo mb-6">
        <ArrowLeft className="w-3 h-3" /> Admin
      </Link>
      <header className="mb-10 flex items-end gap-4">
        <ShieldCheck className="w-10 h-10 text-indigo" strokeWidth={1.2} />
        <div>
          <p className="eyebrow !text-indigo mb-2">Compliance</p>
          <h1 className="serif-display text-ink text-5xl">Audit trail.</h1>
        </div>
      </header>

      <section className="mb-10">
        <p className="eyebrow !text-brass mb-4">Acknowledgments</p>
        <div className="border border-mist bg-parchment">
          {(acks || []).map((a: any) => (
            <div key={a.id} className="grid grid-cols-[1fr_140px_140px] gap-4 px-5 py-3 items-center border-b border-mist last:border-b-0">
              <p className="text-sm text-ink">{a.type.replace(/_/g, " ").toUpperCase()}</p>
              <p className="text-xs text-stone">v{a.version}</p>
              <p className="text-xs text-stone text-right">{new Date(a.acknowledged_at).toLocaleDateString()}</p>
            </div>
          ))}
          {!acks?.length && <p className="px-5 py-8 text-center text-sm text-stone">No acknowledgments on file.</p>}
        </div>
      </section>

      <section className="mb-10">
        <p className="eyebrow !text-brass mb-4">Fair Housing lint events</p>
        <div className="border border-mist bg-parchment">
          {(lintLog || []).map((l: any) => (
            <div key={l.id} className="grid grid-cols-[40px_1fr_140px] gap-4 px-5 py-3 items-center border-b border-mist last:border-b-0">
              <Badge tone={l.passed ? "success" : "hot"}>{l.passed ? "pass" : "block"}</Badge>
              <p className="text-xs text-smoke truncate">
                {l.passed ? "Linted clean" : `Blocked: ${(l.flagged_terms || []).join(", ")}`}
              </p>
              <p className="text-xs text-stone text-right">{new Date(l.created_at).toLocaleString()}</p>
            </div>
          ))}
          {!lintLog?.length && <p className="px-5 py-8 text-center text-sm text-stone">No lint events yet.</p>}
        </div>
      </section>

      <section>
        <p className="eyebrow !text-brass mb-4">Consent records</p>
        <div className="border border-mist bg-parchment">
          <div className="grid grid-cols-[100px_120px_120px_1fr_120px] gap-4 px-5 py-3 border-b border-mist bg-bone text-[10px] uppercase tracking-[0.22em] text-stone">
            <div>Channel</div><div>Scope</div><div>Source</div><div>Granted</div><div>Revoked</div>
          </div>
          {(consents || []).map((c: any) => (
            <div key={c.id} className="grid grid-cols-[100px_120px_120px_1fr_120px] gap-4 px-5 py-3 items-center border-b border-mist last:border-b-0">
              <p className="text-xs text-ink uppercase">{c.consent_type}</p>
              <p className="text-xs text-ink">{c.scope}</p>
              <p className="text-xs text-stone">{c.granted_via || "—"}</p>
              <p className="text-xs text-stone">{new Date(c.granted_at).toLocaleString()}</p>
              <p className="text-xs text-stone text-right">{c.revoked_at ? new Date(c.revoked_at).toLocaleDateString() : "—"}</p>
            </div>
          ))}
          {!consents?.length && <p className="px-5 py-8 text-center text-sm text-stone">No consent records yet.</p>}
        </div>
      </section>
    </div>
  );
}
