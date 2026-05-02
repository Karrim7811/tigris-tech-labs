import { StageShell, Field } from "../_stage-shell";

export default function StageSphere() {
  return (
    <StageShell
      stage={6}
      title="Import your sphere."
      intro="ALEVANT scans the last 36 months of your Gmail, identifies past clients, vendors, and sphere members, and asks you to confirm. KW Command CSV exports go in here too. Manual additions for VIP investors live below."
      prevHref="/onboard/sofia"
      nextHref="/onboard/pipeline"
    >
      <div className="border border-mist p-6 bg-bone">
        <p className="eyebrow !text-brass mb-3">Auto-detected from Gmail</p>
        <p className="text-sm text-smoke leading-relaxed mb-4">
          Once Gmail is connected, we'll scan and surface contacts in batches of 50 for confirmation. Each is auto-classified as Past Client / Active Client / Sphere / Vendor / Personal.
        </p>
        <p className="text-xs text-stone">Status: Pending Gmail OAuth · ETA after connection: 4-8 minutes.</p>
      </div>

      <Field label="KW Command — Contacts CSV" hint="Export your contacts list from KW Command and upload here. Standard fields auto-mapped.">
        <input type="file" accept=".csv" name="kw_contacts_csv" className="block text-sm text-smoke" />
      </Field>

      <Field label="KW Command — Active Listings CSV" hint="Export active listings.">
        <input type="file" accept=".csv" name="kw_listings_csv" className="block text-sm text-smoke" />
      </Field>

      <Field label="KW Command — Closed Transactions CSV" hint="Export closed deals (last 24 months minimum).">
        <input type="file" accept=".csv" name="kw_transactions_csv" className="block text-sm text-smoke" />
      </Field>

      <div className="border border-mist p-6 bg-parchment">
        <p className="eyebrow !text-indigo mb-3">VIP / Top-50 Sphere</p>
        <p className="text-sm text-smoke leading-relaxed">
          Add your top investor relationships, off-market relationships, and key referral sources manually after activation — Sphere Brain will prioritize their signals daily.
        </p>
      </div>
    </StageShell>
  );
}
