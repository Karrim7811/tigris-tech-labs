import Link from "next/link";
import { Phone, Mail, MessageCircle, Instagram, Linkedin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { bandFromScore, relativeTime } from "@/lib/utils";

interface Lead {
  id: string;
  name: string;
  channel: "voice" | "sms" | "ig_dm" | "linkedin_dm" | "email";
  intent: string;
  qualification: number;
  summary: string;
  received_at: string;
  source: "sofia" | "agent" | "form";
}

const SAMPLE: Lead[] = [
  { id: "1", name: "Carlos Mendes", channel: "voice", intent: "Buy investor", qualification: 88, summary: "Brickell condo $1.4M, cash, Brazilian, wants Saturday showing.", received_at: new Date(Date.now() - 1000*60*15).toISOString(), source: "sofia" },
  { id: "2", name: "Andrea Castillo", channel: "ig_dm", intent: "Sell", qualification: 76, summary: "Coral Gables 4BR, considering listing in 60 days, wants CMA.", received_at: new Date(Date.now() - 1000*60*47).toISOString(), source: "sofia" },
  { id: "3", name: "Mark Levine", channel: "sms", intent: "Buy primary", qualification: 62, summary: "Pre-approved $850k, 30-60 day, Coconut Grove.", received_at: new Date(Date.now() - 1000*60*60*2).toISOString(), source: "sofia" },
  { id: "4", name: "Daniela Pinto", channel: "linkedin_dm", intent: "Investor", qualification: 81, summary: "1031 exchange, 6-12 unit MF in Brickell area, $4M budget.", received_at: new Date(Date.now() - 1000*60*60*3).toISOString(), source: "sofia" },
  { id: "5", name: "John Reyes", channel: "email", intent: "Rental", qualification: 45, summary: "Rental seeker, $4.5k/mo, 1BR Brickell, 6mo lease.", received_at: new Date(Date.now() - 1000*60*60*5).toISOString(), source: "form" },
];

const ICONS = {
  voice: Phone,
  sms: MessageCircle,
  ig_dm: Instagram,
  linkedin_dm: Linkedin,
  email: Mail,
};

export default function InboxPage() {
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

      <div className="border border-mist bg-parchment">
        {SAMPLE.map((lead) => {
          const Icon = ICONS[lead.channel];
          const band = bandFromScore(lead.qualification);
          return (
            <Link
              key={lead.id}
              href={`/inbox/${lead.id}`}
              className="grid grid-cols-[40px_1fr_120px_80px] gap-4 px-5 py-5 items-center border-b border-mist hover:bg-bone transition-colors"
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
              <p className="text-xs text-stone uppercase tracking-[0.18em]">{lead.intent}</p>
              <p className="text-xs text-stone text-right">{relativeTime(lead.received_at)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
