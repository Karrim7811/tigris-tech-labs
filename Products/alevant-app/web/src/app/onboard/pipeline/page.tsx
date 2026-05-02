import { StageShell, FieldRow, Field } from "../_stage-shell";
import { Input } from "@/components/ui/input";

export default function StagePipeline() {
  return (
    <StageShell
      stage={7}
      title="Snapshot your live pipeline."
      intro="Day One should not be a blank slate. Capture your active listings, buyers, rentals, and investor deals so Sofia knows your inventory and Vesper knows what to market."
      prevHref="/onboard/sphere"
      nextHref="/onboard/marketing"
    >
      <FieldRow>
        <Field label="Active listings — count"><Input name="listings_count" type="number" defaultValue="0" /></Field>
        <Field label="Active buyers — count"><Input name="buyers_count" type="number" defaultValue="0" /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Active rentals — count"><Input name="rentals_count" type="number" defaultValue="0" /></Field>
        <Field label="Active investor deals — count"><Input name="investor_deals_count" type="number" defaultValue="0" /></Field>
      </FieldRow>

      <div className="border border-mist p-6 bg-bone">
        <p className="eyebrow !text-brass mb-3">Quick listing add (optional)</p>
        <p className="text-sm text-smoke leading-relaxed mb-4">
          Paste a Zillow / Realtor.com / Compass URL — we'll scrape and prefill. You can also enter manually after activation.
        </p>
        <Input name="listing_url" placeholder="https://www.zillow.com/homedetails/…" />
      </div>

      <div className="border border-mist p-6 bg-parchment">
        <p className="eyebrow !text-indigo mb-3">The Grid — farm zip codes</p>
        <p className="text-sm text-smoke leading-relaxed mb-4">
          Pick the zip codes the predictive seller-lead engine should monitor. Start with 3-5 zips you actively farm. We'll generate a Motivation Score for every home in those zones daily.
        </p>
        <Input name="grid_zips" placeholder="33131, 33132, 33134, 33139, 33141" />
      </div>
    </StageShell>
  );
}
