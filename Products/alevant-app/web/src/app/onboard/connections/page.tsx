import Link from "next/link";
import { StageShell } from "../_stage-shell";
import { Button } from "@/components/ui/button";

const CONNECTIONS = [
  { id: "gmail", name: "Gmail", scopes: "Read/send mail, contacts", required: true, group: "Productivity" },
  { id: "gcal", name: "Google Calendar", scopes: "Read/write events", required: true, group: "Productivity" },
  { id: "instagram", name: "Instagram (Meta Business)", scopes: "DMs · post · insights", required: true, group: "Social" },
  { id: "x", name: "X (Twitter)", scopes: "DMs · post", required: true, group: "Social" },
  { id: "tiktok", name: "TikTok Business", scopes: "Post · insights", required: true, group: "Social" },
  { id: "linkedin", name: "LinkedIn", scopes: "DMs · post", required: true, group: "Social" },
  { id: "youtube", name: "YouTube", scopes: "Upload listing films", required: false, group: "Social" },
  { id: "facebook", name: "Facebook Business", scopes: "Lead Ads · post", required: false, group: "Social" },
  { id: "whatsapp", name: "WhatsApp Business", scopes: "Messages (LATAM, V2)", required: false, group: "Social" },
  { id: "docusign", name: "DocuSign", scopes: "Envelope read/write", required: true, group: "Transaction" },
  { id: "kwcommand", name: "KW Command", scopes: "Held — API not public yet", required: false, group: "Brokerage" },
  { id: "heygen", name: "HeyGen", scopes: "Avatar generation", required: false, group: "AI" },
];

export default function StageConnections() {
  const groups = Array.from(new Set(CONNECTIONS.map((c) => c.group)));
  return (
    <StageShell
      stage={4}
      title="Connect your accounts."
      intro="OAuth into the services Sofia and Vesper need. Required connections are marked. Most are one-click — refresh tokens are encrypted and rotated automatically."
      prevHref="/onboard/brand"
      nextHref="/onboard/sofia"
    >
      {groups.map((g) => (
        <div key={g}>
          <p className="eyebrow !text-brass mb-4">{g}</p>
          <div className="space-y-3">
            {CONNECTIONS.filter((c) => c.group === g).map((c) => (
              <div key={c.id} className="flex items-center justify-between border border-mist p-4 bg-parchment">
                <div>
                  <p className="text-sm text-ink font-medium flex items-center gap-2">
                    {c.name}
                    {c.required && <span className="text-[9px] uppercase tracking-[0.22em] text-brass">Required</span>}
                  </p>
                  <p className="text-xs text-stone mt-1">{c.scopes}</p>
                </div>
                <Link href={`/api/onboard/oauth/${c.id}`}><Button variant="ghost" size="sm">Connect</Button></Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </StageShell>
  );
}
