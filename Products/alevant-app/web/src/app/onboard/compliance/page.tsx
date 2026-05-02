import Link from "next/link";
import { StageShell } from "../_stage-shell";
import { Button } from "@/components/ui/button";

const ACKS = [
  {
    id: "tcpa",
    title: "TCPA & CAN-SPAM",
    body: "I confirm that no AI-initiated SMS or call will be sent without verified prior express written consent. Outbound to past clients and sphere will use my existing opt-ins. Sofia will scrub against the Do Not Call registry before any cold dial. All consent records and revocations are immutably logged.",
  },
  {
    id: "fair_housing",
    title: "Fair Housing Act",
    body: "I confirm that all generated content will be auto-linted for protected-class violations under the Fair Housing Act and applicable state-extended classes. Strict mode is enabled and not bypassable.",
  },
  {
    id: "nar_buyer_broker",
    title: "NAR Settlement — Buyer-Broker Agreements",
    body: "I confirm that all buyer-side workflows assume a signed buyer-broker representation agreement before any showing. The 'Schedule Showing' action is gated on this signature.",
  },
  {
    id: "ai_disclosure",
    title: "AI Disclosure",
    body: "I authorize Sofia to identify as an AI assistant on every conversation, and HeyGen avatars to be watermarked 'AI-generated representation' on every video output.",
  },
  {
    id: "data_ownership",
    title: "Data Ownership",
    body: "I acknowledge that I own all data in my workspace. ALEVANT processes but does not resell. On termination, data is exportable for 90 days then deleted.",
  },
];

export default function StageCompliance() {
  return (
    <StageShell
      stage={9}
      title="Compliance and activation."
      intro="A short set of explicit acknowledgments. These are not boilerplate — they shape how Sofia and Vesper behave in your workspace. Each is logged immutably."
      prevHref="/onboard/marketing"
    >
      <div className="space-y-4">
        {ACKS.map((a) => (
          <label key={a.id} className="block border border-mist p-6 bg-parchment cursor-pointer hover:border-indigo transition-colors">
            <div className="flex items-start gap-4">
              <input type="checkbox" name={`ack_${a.id}`} required className="mt-1" />
              <div>
                <p className="serif-italic text-2xl text-ink mb-2">{a.title}</p>
                <p className="text-sm text-smoke leading-relaxed">{a.body}</p>
              </div>
            </div>
          </label>
        ))}
      </div>
      <div className="border-t border-mist mt-12 pt-8 flex items-center justify-between">
        <Link href="/onboard/marketing"><Button variant="ghost">← Back</Button></Link>
        <Link href="/api/onboard/activate"><Button variant="brass" size="lg">Activate ALEVANT</Button></Link>
      </div>
    </StageShell>
  );
}
