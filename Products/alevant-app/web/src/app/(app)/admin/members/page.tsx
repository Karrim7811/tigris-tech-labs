import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminMembersPage() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: ws } = await sb.from("workspaces").select("id").eq("owner_user_id", user?.id || "").maybeSingle();

  const { data: members } = await sb
    .from("workspace_memberships")
    .select("role, user_id, agents:agents!inner(full_name, title, email, headshot_url, languages, specialties)")
    .eq("workspace_id", ws?.id || "");

  return (
    <div className="px-10 py-12 max-w-6xl">
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-stone hover:text-indigo mb-6">
        <ArrowLeft className="w-3 h-3" /> Admin
      </Link>
      <header className="flex items-end justify-between mb-10">
        <div>
          <p className="eyebrow !text-indigo mb-2">Members</p>
          <h1 className="serif-display text-ink text-5xl">Workspace team.</h1>
          <p className="serif-italic text-stone text-base mt-2">
            Roles control what agents can edit. Owners and admins see cross-agent reporting; agents see only their own data.
          </p>
        </div>
        <Button><UserPlus className="w-4 h-4 mr-2" /> Invite member</Button>
      </header>

      <div className="border border-mist bg-parchment">
        <div className="grid grid-cols-[2fr_1fr_1fr_120px] gap-4 px-5 py-3 border-b border-mist text-[10px] uppercase tracking-[0.22em] text-stone bg-bone">
          <div>Name</div>
          <div>Title</div>
          <div>Languages</div>
          <div>Role</div>
        </div>
        {(members || []).map((m: any, i: number) => (
          <div key={i} className="grid grid-cols-[2fr_1fr_1fr_120px] gap-4 px-5 py-5 items-center border-b border-mist last:border-b-0">
            <div>
              <p className="text-sm text-ink font-medium">{m.agents?.full_name || "—"}</p>
              <p className="text-xs text-stone">{m.agents?.email || "—"}</p>
            </div>
            <p className="text-sm text-smoke">{m.agents?.title || "—"}</p>
            <p className="text-xs text-smoke">{(m.agents?.languages || []).join(", ").toUpperCase() || "—"}</p>
            <Badge tone={m.role === "owner" ? "indigo" : m.role === "admin" ? "brass" : "neutral"}>{m.role}</Badge>
          </div>
        ))}
        {!members?.length && (
          <p className="px-5 py-8 text-center text-sm text-stone">No members yet. Invite your first agent.</p>
        )}
      </div>
    </div>
  );
}
