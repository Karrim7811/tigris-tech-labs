import Link from "next/link";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { Sparkles, Phone, Mail, MessageSquare, Calendar, StickyNote, Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

interface Step {
  day_offset: number;
  channel: "call" | "sms" | "email" | "meeting" | "note";
  action: string;
}

interface Playbook {
  id: string;
  name: string;
  description: string | null;
  trigger_lifecycle_stages: string[] | null;
  trigger_temperatures: string[] | null;
  steps_json: { steps: Step[] };
  is_system: boolean;
}

const ICONS = {
  call: Phone,
  sms: MessageSquare,
  email: Mail,
  meeting: Calendar,
  note: StickyNote,
} as const;

async function load(): Promise<Playbook[]> {
  const sb = await getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return [];
  const svc = getSupabaseService();
  const { data: ws } = await svc
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!ws) return [];
  const { data } = await svc
    .from("playbooks")
    .select("*")
    .eq("workspace_id", ws.id)
    .order("is_system", { ascending: false })
    .order("name");
  return (data ?? []) as Playbook[];
}

export default async function PlaybooksPage() {
  const playbooks = await load();

  return (
    <div className="px-10 py-12 max-w-5xl">
      <header className="mb-10 flex items-start justify-between gap-8">
        <div>
          <p className="eyebrow !text-indigo mb-2">Playbooks</p>
          <h1 className="serif-display text-ink text-5xl">Cadences.</h1>
          <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
            Each playbook is a sequence of touches that auto-starts when a contact's lifecycle
            stage and temperature match its triggers. Steps appear on your dashboard as
            "Today's plays" — confirm with one click to advance.
          </p>
        </div>
        <Link
          href="/playbooks/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.28em] bg-indigo text-parchment hover:bg-indigo-deep transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> New playbook
        </Link>
      </header>

      <div className="space-y-5">
        {playbooks.map((pb) => (
          <article key={pb.id} className="border border-mist bg-parchment p-6">
            <div className="flex items-start justify-between mb-3 gap-4">
              <div>
                <p className="serif-display text-ink text-2xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo" /> {pb.name}
                  {pb.is_system && (
                    <span className="text-[10px] uppercase tracking-[0.28em] text-stone border border-mist px-2 py-0.5">
                      system
                    </span>
                  )}
                </p>
                {pb.description && (
                  <p className="text-sm text-smoke mt-1 max-w-2xl">{pb.description}</p>
                )}
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <Link
                  href={`/playbooks/${pb.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs uppercase tracking-wider border border-mist text-stone hover:text-indigo hover:border-indigo"
                >
                  <Pencil className="w-3 h-3" /> {pb.is_system ? "View" : "Edit"}
                </Link>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-stone">Triggers</p>
                  <p className="text-xs text-ink mt-1">
                    {(pb.trigger_lifecycle_stages ?? []).join(" / ") || "—"}
                  </p>
                  <p className="text-xs text-indigo mt-0.5">
                    {(pb.trigger_temperatures ?? []).join(" · ") || "any temp"}
                  </p>
                </div>
              </div>
            </div>

            <ol className="space-y-2 mt-4 border-t border-mist pt-4">
              {(pb.steps_json?.steps ?? []).map((s, i) => {
                const Icon = ICONS[s.channel] ?? StickyNote;
                return (
                  <li key={i} className="grid grid-cols-[40px_80px_1fr] gap-3 items-start">
                    <div className="w-8 h-8 grid place-items-center bg-indigo/10 border border-indigo/30 text-indigo">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-stone">
                        Step {i + 1}
                      </p>
                      <p className="text-xs text-stone">
                        Day +{s.day_offset} · {s.channel}
                      </p>
                    </div>
                    <p className="text-sm text-ink leading-snug">{s.action}</p>
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>

      <p className="serif-italic text-stone text-sm mt-10">
        System playbooks are read-only — clone them to make a customizable copy. Custom
        playbooks have full edit access including triggers, step ordering, and channel mix.
      </p>
    </div>
  );
}
