import { StageForm, FieldRow, Field } from "../_stage-form";
import { Input } from "@/components/ui/input";
import { loadOnboardContext } from "../_load-onboard-defaults";

export default async function StagePipeline() {
  const ctx = await loadOnboardContext();
  const v = ctx.defaults[7] ?? {};
  const c = ctx.counts;
  return (
    <StageForm
      stage={7}
      title="Snapshot your live pipeline."
      intro="Day One should not be a blank slate. Capture your active listings, buyers, rentals, and investor deals so Sofia knows your inventory and Vesper knows what to market."
      prevHref="/onboard/sphere"
      nextHref="/onboard/marketing"
    >
      <div className="border border-mist p-5 bg-bone">
        <p className="eyebrow !text-brass mb-2">Already imported</p>
        <p className="text-sm text-smoke leading-relaxed">
          {c.listings} active listing{c.listings === 1 ? "" : "s"} · {c.buyers} buyer{c.buyers === 1 ? "" : "s"} · {c.rentals} rental{c.rentals === 1 ? "" : "s"} · {c.investorDeals} investor deal{c.investorDeals === 1 ? "" : "s"} · {c.transactions} active transaction{c.transactions === 1 ? "" : "s"}.
        </p>
        <p className="text-xs text-stone mt-1">Update the counts below if these don't match your real book — we'll reconcile during activation.</p>
      </div>

      <FieldRow>
        <Field label="Active listings — count"><Input name="listings_count" type="number" defaultValue={v.listings_count} /></Field>
        <Field label="Active buyers — count"><Input name="buyers_count" type="number" defaultValue={v.buyers_count} /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Active rentals — count"><Input name="rentals_count" type="number" defaultValue={v.rentals_count} /></Field>
        <Field label="Active investor deals — count"><Input name="investor_deals_count" type="number" defaultValue={v.investor_deals_count} /></Field>
      </FieldRow>

      <div className="border border-mist p-6 bg-bone">
        <p className="eyebrow !text-brass mb-3">Quick listing add (optional)</p>
        <p className="text-sm text-smoke leading-relaxed mb-4">
          Paste a Zillow / Realtor.com / Compass URL — we'll scrape and prefill. You can also enter manually after activation.
        </p>
        <Input name="listing_url" defaultValue={v.listing_url} placeholder="https://www.zillow.com/homedetails/…" />
      </div>

      <div className="border border-mist p-6 bg-parchment">
        <p className="eyebrow !text-indigo mb-3">The Grid — farm zip codes</p>
        <p className="text-sm text-smoke leading-relaxed mb-4">
          Pick the zip codes the predictive seller-lead engine should monitor. Start with 3-5 zips you actively farm. We'll generate a Motivation Score for every home in those zones daily.
        </p>
        <Input name="grid_zips" defaultValue={v.grid_zips} placeholder="33131, 33132, 33134, 33139, 33141" />
      </div>
    </StageForm>
  );
}
