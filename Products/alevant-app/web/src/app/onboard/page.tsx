import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OnboardIndex() {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow !text-indigo mb-4">Begin</p>
      <h1 className="serif-display text-ink text-5xl mb-6 leading-tight">
        Welcome. Let's set up your workspace.
      </h1>
      <p className="text-base text-smoke leading-relaxed mb-4">
        ALEVANT will run as your AI Operating System once setup is complete. Sofia, Vesper, the Underwriter, and the Grid all calibrate from the data you enter here.
      </p>
      <p className="text-base text-smoke leading-relaxed mb-10">
        Plan for 25 to 40 minutes. Save and resume from any stage. Stages 1-3 require nothing external. Stages 4-7 connect your accounts and import your existing book.
      </p>
      <div className="border border-mist p-8 bg-bone mb-10">
        <p className="eyebrow !text-brass mb-3">What you'll need</p>
        <ul className="space-y-2 text-sm text-smoke">
          <li>· Your real estate license number and brokerage info</li>
          <li>· Logo and brand assets (or we'll generate placeholders)</li>
          <li>· Gmail account access (read-write for Sofia + sphere import)</li>
          <li>· Instagram, X, TikTok, LinkedIn business accounts (for Vesper)</li>
          <li>· DocuSign or Dotloop account (for Transaction Brain — pick whichever you already use)</li>
          <li>· KW Command CSV exports (contacts, listings, transactions)</li>
        </ul>
      </div>
      <Link href="/onboard/identity">
        <Button size="lg">Start Stage 01 — Identity</Button>
      </Link>
    </div>
  );
}
