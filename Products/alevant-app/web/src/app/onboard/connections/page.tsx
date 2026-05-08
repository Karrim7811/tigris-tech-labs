import { StageForm, Field } from "../_stage-form";
import { loadOnboardContext } from "../_load-onboard-defaults";

const CONNECTIONS = [
  { id: "gmail",     name: "Gmail",                       scopes: "Read/send mail, contacts",     required: true,  group: "Productivity" },
  { id: "gcal",      name: "Google Calendar",             scopes: "Read/write events",            required: true,  group: "Productivity" },
  { id: "instagram", name: "Instagram (Meta Business)",   scopes: "DMs · post · insights",        required: true,  group: "Social" },
  { id: "x",         name: "X (Twitter)",                 scopes: "DMs · post",                   required: true,  group: "Social" },
  { id: "tiktok",    name: "TikTok Business",             scopes: "Post · insights",              required: true,  group: "Social" },
  { id: "linkedin",  name: "LinkedIn",                    scopes: "DMs · post",                   required: true,  group: "Social" },
  { id: "youtube",   name: "YouTube",                     scopes: "Upload listing films",         required: false, group: "Social" },
  { id: "facebook",  name: "Facebook Business",           scopes: "Lead Ads · post",              required: false, group: "Social" },
  { id: "whatsapp",  name: "WhatsApp Business",           scopes: "Messages (LATAM, V2)",         required: false, group: "Social" },
  { id: "docusign",  name: "DocuSign",                    scopes: "Envelope read/write",          required: true,  group: "Transaction" },
  { id: "kwcommand", name: "KW Command",                  scopes: "Held — API not public yet",    required: false, group: "Brokerage" },
  { id: "heygen",    name: "HeyGen",                      scopes: "Avatar generation",            required: false, group: "AI" },
];

export default async function StageConnections() {
  const ctx = await loadOnboardContext();
  const conn = ctx.connections ?? {};
  const groups = Array.from(new Set(CONNECTIONS.map((c) => c.group)));
  return (
    <StageForm
      stage={4}
      title="Connect your accounts."
      intro="Each connection unlocks Sofia / Vesper / Transaction Brain features. Connect now or queue for later — required ones are flagged. Refresh tokens are encrypted and rotated automatically."
      prevHref="/onboard/brand"
      nextHref="/onboard/sofia"
    >
      {groups.map((g) => (
        <div key={g}>
          <p className="eyebrow !text-brass mb-4">{g}</p>
          <div className="space-y-3">
            {CONNECTIONS.filter((c) => c.group === g).map((c) => {
              const state = conn[c.id] ?? { connected: false, queued: false };
              const status = state.connected ? "Connected" : state.queued ? "Queued" : "Not connected";
              const statusColor = state.connected ? "text-success" : state.queued ? "text-brass" : "text-stone";
              return (
                <div key={c.id} className="flex items-center justify-between border border-mist p-4 bg-parchment">
                  <div>
                    <p className="text-sm text-ink font-medium flex items-center gap-2">
                      {c.name}
                      {c.required && <span className="text-[9px] uppercase tracking-[0.22em] text-brass">Required</span>}
                    </p>
                    <p className="text-xs text-stone mt-1">{c.scopes}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] uppercase tracking-[0.18em] ${statusColor}`}>{status}</span>
                    <label className="inline-flex items-center gap-2 text-xs text-ink cursor-pointer">
                      <input type="checkbox" name={`queue_${c.id}`} defaultChecked={!!state.queued || !!state.connected} />
                      Queue for later
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <Field label="Notes (optional)" hint="Anything we should know about your existing tools or migration constraints?">
        <textarea name="connections_notes" className="w-full bg-parchment border border-mist px-4 py-3 text-sm text-ink resize-y" rows={3} />
      </Field>
    </StageForm>
  );
}
