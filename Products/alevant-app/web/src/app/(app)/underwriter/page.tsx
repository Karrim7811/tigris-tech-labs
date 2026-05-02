import { Calculator, TrendingUp } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function UnderwriterPage() {
  return (
    <div className="px-10 py-12 max-w-7xl">
      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">Underwriter</p>
        <h1 className="serif-display text-ink text-5xl">Address in. Numbers out.</h1>
        <p className="serif-italic text-stone text-base mt-2 max-w-3xl">
          Residential CMA in 60 seconds. Investor underwrite — cap rate, cash-on-cash, BRRRR, STR projection (AirDNA), FIRPTA flag, 1031 timing — in 30.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Residential CMA */}
        <div className="border border-mist bg-parchment p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-5 h-5 text-indigo" />
            <p className="serif-display text-ink text-2xl">Residential CMA</p>
          </div>
          <p className="text-sm text-smoke leading-relaxed mb-6">
            Comparable sold (90 / 180 days, 0.25 / 0.5 / 1 mile). Suggested list price with confidence interval. Branded PDF output.
          </p>
          <form action="/api/underwriter/cma" method="POST" className="space-y-4">
            <div><Label>Address</Label><Input name="address" required placeholder="2150 Ocean Drive #PH4, Miami Beach" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Beds</Label><Input name="beds" type="number" required /></div>
              <div><Label>Baths</Label><Input name="baths" type="number" step="0.5" required /></div>
              <div><Label>Sqft</Label><Input name="sqft" type="number" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Year built</Label><Input name="year_built" type="number" /></div>
              <div>
                <Label>Property type</Label>
                <select name="property_type" className="w-full bg-parchment border border-mist px-4 py-3 text-sm text-ink">
                  <option value="condo">Condo</option>
                  <option value="sfh">Single-Family</option>
                  <option value="townhouse">Townhouse</option>
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full">Run CMA · 60 sec</Button>
          </form>
        </div>

        {/* Investor underwriter */}
        <div className="border border-mist bg-parchment p-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-brass" />
            <p className="serif-display text-ink text-2xl">Investor / Multifamily</p>
          </div>
          <p className="text-sm text-smoke leading-relaxed mb-6">
            Cap rate, cash-on-cash, GRM, DSCR. BRRRR projection. STR projection (AirDNA). FIRPTA flag if foreign seller. 1031 window if active.
          </p>
          <form action="/api/underwriter/investor" method="POST" className="space-y-4">
            <div><Label>Subject address</Label><Input name="address" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Acquisition price</Label><Input name="price" type="number" required /></div>
              <div><Label>Units</Label><Input name="units" type="number" defaultValue="1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Gross rent (mo)</Label><Input name="gross_monthly_rent" type="number" /></div>
              <div><Label>Down %</Label><Input name="down_pct" type="number" step="1" defaultValue="25" /></div>
              <div><Label>Rate %</Label><Input name="rate_pct" type="number" step="0.05" defaultValue="7.0" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Rehab budget</Label><Input name="rehab_budget" type="number" /></div>
              <div><Label>STR ADR ($)</Label><Input name="str_adr" type="number" /></div>
              <div><Label>STR occ %</Label><Input name="str_occ" type="number" /></div>
            </div>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-xs text-smoke"><input type="checkbox" name="is_foreign_seller" /> Foreign seller (FIRPTA)</label>
              <label className="inline-flex items-center gap-2 text-xs text-smoke"><input type="checkbox" name="is_1031" /> 1031 active</label>
            </div>
            <Button type="submit" variant="brass" className="w-full">Underwrite · 30 sec</Button>
          </form>
        </div>
      </div>

      {/* Recent runs */}
      <section className="mt-12">
        <p className="eyebrow !text-brass mb-4">Recent runs</p>
        <div className="border border-mist bg-parchment">
          {[
            { addr: "1450 NW 7th St", mode: "Investor MF", outcome: "Cap 6.8% · CoC 9.2%", when: "2 hrs ago" },
            { addr: "2150 Ocean Drive #PH4", mode: "CMA", outcome: "$1.42M ± 4.1%", when: "yesterday" },
            { addr: "560 NW 33rd St", mode: "Investor + STR", outcome: "Cap 7.4% · STR $5.4k/mo", when: "yesterday" },
          ].map((r) => (
            <div key={r.addr} className="grid grid-cols-[2fr_1fr_2fr_120px] gap-4 px-5 py-4 items-center border-b border-mist last:border-b-0">
              <p className="text-sm text-ink">{r.addr}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-stone">{r.mode}</p>
              <p className="text-sm text-smoke">{r.outcome}</p>
              <p className="text-xs text-stone text-right">{r.when}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
