import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewListingPage() {
  return (
    <div className="px-10 py-12 max-w-4xl">
      <Link href="/listings" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-stone hover:text-indigo mb-8">
        <ArrowLeft className="w-3 h-3" /> Listings
      </Link>

      <header className="mb-10">
        <p className="eyebrow !text-indigo mb-2">New Listing</p>
        <h1 className="serif-display text-ink text-5xl">Add a property.</h1>
        <p className="serif-italic text-stone text-base mt-2">Paste a Zillow / Realtor.com URL or fill manually.</p>
      </header>

      <form action="/api/listings" method="POST" className="space-y-8">
        <div className="border border-mist bg-bone p-6">
          <Label>Quick scrape</Label>
          <Input name="scrape_url" placeholder="https://www.zillow.com/homedetails/…" />
          <p className="mt-2 text-xs text-stone">We'll pre-fill everything below from the URL.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div><Label>Address</Label><Input name="address" required /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>City</Label><Input name="city" /></div>
            <div><Label>State</Label><Input name="state" defaultValue="FL" /></div>
            <div><Label>ZIP</Label><Input name="zip" /></div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div><Label>Price</Label><Input name="price" type="number" /></div>
          <div><Label>Beds</Label><Input name="beds" type="number" /></div>
          <div><Label>Baths</Label><Input name="baths" type="number" step="0.5" /></div>
          <div><Label>Sqft</Label><Input name="sqft" type="number" /></div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <Label>Property type</Label>
            <select name="property_type" className="w-full bg-parchment border border-mist px-4 py-3 text-sm text-ink">
              <option value="condo">Condo</option>
              <option value="sfh">Single-Family</option>
              <option value="townhouse">Townhouse</option>
              <option value="mf2_4">Multifamily 2-4</option>
              <option value="mf5plus">Multifamily 5+</option>
              <option value="land">Land</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
          <div><Label>Year built</Label><Input name="year_built" type="number" /></div>
          <div><Label>HOA / month</Label><Input name="hoa_monthly" type="number" /></div>
        </div>

        <div><Label>Description</Label><Textarea name="description" rows={6} /></div>

        <div>
          <Label>Status</Label>
          <select name="status" className="w-full bg-parchment border border-mist px-4 py-3 text-sm text-ink max-w-xs">
            <option value="draft">Draft</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="active">Active (auto-triggers Vesper)</option>
          </select>
        </div>

        <div className="flex gap-3">
          <Button type="submit">Save Listing</Button>
          <Button type="submit" variant="brass" name="trigger_vesper" value="1">Save & Trigger Vesper</Button>
        </div>
      </form>
    </div>
  );
}
