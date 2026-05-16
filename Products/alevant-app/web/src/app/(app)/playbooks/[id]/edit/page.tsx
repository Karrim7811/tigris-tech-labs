import { notFound } from "next/navigation";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { PlaybookEditor, type Playbook } from "../../PlaybookEditor";

export const dynamic = "force-dynamic";

async function load(id: string): Promise<Playbook | null> {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return null;
  const { data } = await svc
    .from("playbooks")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  return (data as Playbook | null) ?? null;
}

export default async function EditPlaybookPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const playbook = await load(id);
  if (!playbook) return notFound();

  return (
    <div className="px-10 py-12 max-w-5xl">
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">
          Playbooks · {playbook.is_system ? "System template" : "Edit"}
        </p>
        <h1 className="serif-display text-ink text-5xl leading-tight">{playbook.name}</h1>
        {playbook.description && (
          <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
            {playbook.description}
          </p>
        )}
      </header>

      <PlaybookEditor initial={{ ...playbook, id }} mode="edit" />
    </div>
  );
}
