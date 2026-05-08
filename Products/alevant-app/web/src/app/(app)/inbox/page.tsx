import Link from "next/link";
import { Phone, Mail, MessageCircle, Instagram, Linkedin, Inbox as InboxIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { bandFromScore, relativeTime } from "@/lib/utils";
import { getSupabaseService } from "@/lib/supabase/server";
import { resolveCurrentWorkspaceId } from "@/app/(app)/_lib/resolve-workspace";

const ICONS: Record<string, typeof Phone> = {
  voice: Phone,
  sms: MessageCircle,
  ig_dm: Instagram,
  instagram: Instagram,
  linkedin_dm: Linkedin,
  linkedin: Linkedin,
  email: Mail,
};

function inferChannel(contact: any, lastConv: any): string {
  if (lastConv?.channel) return lastConv.channel;
  const src = (contact.source || "").toLowerCase();
  if (src.includes("voice") || src.includes("call")) return "voice";
  if (src.includes("ig") || src.includes("instagram")) return "ig_dm";
  if (src.includes("linkedin")) return "linkedin_dm";
  if (src.includes("sms") || src.includes("text")) return "sms";
  if (src.includes("email") || src.includes("form")) return "email";
  return "voice";
}

export default async function InboxPage() {
  const { workspaceId } = await resolveCurrentWorkspaceId();
  const svc = getSupabaseService();

  // Pull contacts + their most-recent sofia conversation + most-recent activity_log
  const [{ data: contacts }, { data: convs }, { data: activity }] = await Promise.all([
    svc
      .from("contacts")
      .select("id, full_name, emails, phones, category, relationship_score, source, language, last_touch_at, created_at, notes")
      .eq("workspace_id", workspaceId)
      .order("last_touch_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50),
    svc
      .from("sofia_conversations")
      .select("id, contact_id, channel, qualification_score, classification, started_at, transcript")
      .eq("workspace_id", workspaceId)
      .order("started_at", { ascending: false })
      .limit(100),
    svc
      .from("activity_log")
      .select("id, contact_id, activity_type, summary, next_action, next_date, source, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const _contacts = contacts ?? [];
  const _convs = convs ?? [];
  const _activity = activity ?? [];

  // Index latest conv + activity by contact_id
  const lastConvByContact = new Map<string, any>();
  for (const c of _convs) {
    if (!lastConvByContact.has(c.contact_id)) lastConvByContact.set(c.contact_id, c);
  }
  const lastActivityByContact = new Map<string, any>();
  for (const a of _activity) {
    if (a.contact_id && !lastActivityByContact.has(a.contact_id)) lastActivityByContact.set(a.contact_id, a);
  }

  // Build display rows
  const rows = _contacts.map((c) => {
    const lastConv = lastConvByContact.get(c.id);
    const lastAct = lastActivityByContact.get(c.id);
    const score = lastConv?.qualification_score ?? c.relationship_score ?? 0;
    const channel = inferChannel(c, lastConv);
    const summary =
      lastAct?.summary ||
      (Array.isArray(lastConv?.transcript) && lastConv.transcript[0]?.summary) ||
      (typeof lastConv?.classification === "object" && (lastConv.classification as any)?.summary) ||
      c.notes ||
      "—";
    const intent =
      (lastConv?.classification as any)?.intent ||
      (lastAct?.activity_type ? lastAct.activity_type.replace(/_/g, " ") : null) ||
      (c.category ? c.category.replace(/_/g, " ") : "Lead");
    const receivedAt = lastConv?.started_at || lastAct?.created_at || c.last_touch_at || c.created_at;
    const isFromSofia = lastConv != null || (c.source ?? "").toLowerCase().includes("sofia");

    return {
      id: c.id,
      name: c.full_name || "Unnamed lead",
      channel,
      intent,
      score,
      summary,
      receivedAt,
      source: isFromSofia ? "sofia" : (c.source ?? "manual"),
      category: c.category,
    };
  });

  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="flex items-end justify-between mb-10">
        <div>
          <p className="eyebrow !text-indigo mb-2">Lead Inbox</p>
          <h1 className="serif-display text-ink text-5xl">All inbound, one place.</h1>
          <p className="serif-italic text-stone text-base mt-2">Voice, SMS, IG / LinkedIn DM, web, email — fused.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-base bg-bone text-ink border border-mist hover:bg-mist">All channels</button>
          <button className="btn-base bg-bone text-ink border border-mist hover:bg-mist">Hot only</button>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="border border-mist bg-bone p-16 text-center">
          <InboxIcon className="w-8 h-8 text-stone mx-auto mb-4" strokeWidth={1.2} />
          <p className="serif-display text-ink text-2xl mb-2">No leads yet.</p>
          <p className="text-sm text-stone leading-relaxed max-w-md mx-auto">
            When Sofia picks up a call, when someone DMs your IG, when a web form comes in — the lead lands here. Until then, this inbox is empty by design.
          </p>
        </div>
      ) : (
        <div className="border border-mist bg-parchment">
          {rows.map((lead) => {
            const Icon = ICONS[lead.channel] || Phone;
            const band = bandFromScore(lead.score);
            return (
              <Link
                key={lead.id}
                href={`/inbox/${lead.id}`}
                className="grid grid-cols-[40px_1fr_120px_80px] gap-4 px-5 py-5 items-center border-b border-mist last:border-b-0 hover:bg-bone transition-colors"
              >
                <Icon className="w-4 h-4 text-stone" strokeWidth={1.5} />
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-sm font-medium text-ink truncate">{lead.name}</p>
                    <Badge tone={band === "hot" ? "hot" : band === "warm" ? "warm" : "cold"}>{band}</Badge>
                    {lead.source === "sofia" && <Badge tone="indigo">Sofia</Badge>}
                  </div>
                  <p className="text-sm text-smoke truncate">{lead.summary}</p>
                </div>
                <p className="text-xs text-stone uppercase tracking-[0.18em] truncate">{lead.intent}</p>
                <p className="text-xs text-stone text-right">{lead.receivedAt ? relativeTime(lead.receivedAt) : "—"}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
