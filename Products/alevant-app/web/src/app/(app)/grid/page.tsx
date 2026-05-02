import Link from "next/link";
import { Flame, Mail, Megaphone, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { bandFromMotivationScore } from "@/lib/grid-engine";

interface GridRow {
  id: string;
  address: string;
  city: string;
  zip: string;
  motivation: number;
  estimated_value: number;
  estimated_equity_pct: number;
  years_owned: number;
  reasons_summary: string;
  flags: string[];
}

const SAMPLE: GridRow[] = [
  {
    id: "g1",
    address: "1287 SW 12th Ave",
    city: "Miami",
    zip: "33135",
    motivation: 92,
    estimated_value: 720000,
    estimated_equity_pct: 84,
    years_owned: 18,
    reasons_summary: "18-year tenure · est. equity 84% · probate filing 11 days ago.",
    flags: ["probate", "long_tenure", "high_equity"],
  },
  {
    id: "g2",
    address: "560 NW 33rd St",
    city: "Miami",
    zip: "33127",
    motivation: 88,
    estimated_value: 845000,
    estimated_equity_pct: 71,
    years_owned: 14,
    reasons_summary: "14-year tenure · pre-foreclosure NOD filed · absentee owner.",
    flags: ["pre_foreclosure", "absentee", "long_tenure"],
  },
  {
    id: "g3",
    address: "330 Sunset Dr",
    city: "Coral Gables",
    zip: "33143",
    motivation: 85,
    estimated_value: 1450000,
    estimated_equity_pct: 92,
    years_owned: 22,
    reasons_summary: "22-year tenure · senior owner · est. equity 92%.",
    flags: ["senior", "long_tenure", "high_equity"],
  },
  {
    id: "g4",
    address: "1500 Brickell Bay Dr #1808",
    city: "Miami",
    zip: "33131",
    motivation: 81,
    estimated_value: 1280000,
    estimated_equity_pct: 65,
    years_owned: 9,
    reasons_summary: "Divorce filing · vacant 4+ months · absorption rate 2.3 mo.",
    flags: ["divorce", "vacant", "hot_market"],
  },
  {
    id: "g5",
    address: "1100 Alhambra Cir",
    city: "Coral Gables",
    zip: "33134",
    motivation: 73,
    estimated_value: 1890000,
    estimated_equity_pct: 78,
    years_owned: 16,
    reasons_summary: "16-year tenure · tax delinquent 6 months · code violation cleared 30 days ago.",
    flags: ["tax_delinquent", "code_violations", "long_tenure"],
  },
];

const FLAG_LABELS: Record<string, string> = {
  pre_foreclosure: "Pre-foreclosure",
  tax_delinquent: "Tax delinquent",
  code_violations: "Code violation",
  hoa_delinquency: "HOA delinquency",
  vacant: "Vacant",
  absentee: "Absentee owner",
  probate: "Probate",
  divorce: "Divorce",
  senior: "Senior owner",
  long_tenure: "Long tenure",
  high_equity: "High equity",
  hot_market: "Hot market",
};

export default function GridPage() {
  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="flex items-end justify-between mb-10">
        <div>
          <p className="eyebrow !text-indigo mb-2">The Grid</p>
          <h1 className="serif-display text-ink text-5xl">Predictive seller leads.</h1>
          <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
            Every home in your farm zip codes scored daily on tenure, equity, distress, life events, and market velocity. The top of the list is where listings come from before anyone else even knows.
          </p>
        </div>
        <button className="btn-base bg-bone text-ink border border-mist hover:bg-mist">
          Configure farm zones
        </button>
      </header>

      {/* Score bands legend */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-px bg-mist border border-mist mb-10">
        {[
          { tier: "Blazing", range: "80–100", desc: "Multiple signals · contact this week", count: 11, tone: "hot" as const },
          { tier: "Hot", range: "65–79", desc: "Strong single-signal motivation", count: 24, tone: "warm" as const },
          { tier: "Warm", range: "45–64", desc: "Watch & nurture", count: 47, tone: "cold" as const },
          { tier: "Watch", range: "0–44", desc: "Background drip", count: 312, tone: "neutral" as const },
        ].map((b) => (
          <div key={b.tier} className="bg-parchment p-6">
            <div className="flex items-center gap-2 mb-2">
              <Flame className={`w-4 h-4 ${b.tone === "hot" ? "text-hot" : b.tone === "warm" ? "text-warm" : "text-stone"}`} />
              <p className="serif-italic text-ink text-2xl">{b.tier}</p>
            </div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-stone mb-2">Score {b.range}</p>
            <p className="serif-display text-ink text-3xl mb-1">{b.count}</p>
            <p className="text-xs text-stone leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </section>

      {/* Top signals */}
      <section className="space-y-4">
        <p className="eyebrow !text-brass mb-2">Today's top signals · Bichi farm zones</p>
        {SAMPLE.map((row) => {
          const band = bandFromMotivationScore(row.motivation);
          return (
            <div key={row.id} className="border border-mist bg-parchment p-6 grid grid-cols-1 md:grid-cols-[80px_1fr_220px] gap-6 items-start">
              <div className="text-center">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center serif-display text-3xl ${band === "blazing" ? "bg-hot text-parchment" : band === "hot" ? "bg-warm text-ink" : "bg-bone text-ink"}`}>
                  {row.motivation}
                </div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone mt-2">{band}</p>
              </div>
              <div>
                <p className="serif-display text-ink text-2xl mb-1">{row.address}</p>
                <p className="text-sm text-stone mb-3">{row.city}, FL {row.zip} · {row.years_owned} yrs owned · est. {formatCurrency(row.estimated_value)} · {row.estimated_equity_pct}% equity</p>
                <p className="text-sm text-smoke leading-relaxed mb-3">{row.reasons_summary}</p>
                <div className="flex flex-wrap gap-2">
                  {row.flags.map((f) => (
                    <Badge key={f} tone="brass">{FLAG_LABELS[f] || f}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Link href={`/grid/${row.id}/outreach?channel=direct_mail`} className="btn-base w-full bg-indigo text-parchment hover:bg-indigo-deep text-center">
                  <Mail className="w-3 h-3 mr-2" /> Direct mail
                </Link>
                <Link href={`/grid/${row.id}/outreach?channel=ig_dm`} className="btn-base w-full bg-bone text-ink border border-mist hover:bg-mist text-center">
                  <Megaphone className="w-3 h-3 mr-2" /> IG / FB ad
                </Link>
                <Link href={`/grid/${row.id}/outreach?channel=agent_call_script`} className="btn-base w-full bg-bone text-ink border border-mist hover:bg-mist text-center">
                  <Phone className="w-3 h-3 mr-2" /> Agent call script
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      <p className="text-xs text-stone text-center mt-12 leading-relaxed max-w-2xl mx-auto">
        TCPA · DNC · CCPA compliant. ALEVANT scrubs every signal against the federal Do Not Call registry before any cold-call workflow runs. Distress signals are framed as opportunity in outreach copy, never disclosed.
      </p>
    </div>
  );
}
