import { StageForm, FieldRow, Field } from "../_stage-form";
import { Input, Textarea } from "@/components/ui/input";
import { loadOnboardContext } from "../_load-onboard-defaults";

export default async function StageIdentity() {
  const ctx = await loadOnboardContext();
  const v = ctx.defaults[1] ?? {};
  return (
    <StageForm
      stage={1}
      title="Who are you, professionally?"
      intro="Identity, specialty, and credentials. The platform tunes Sofia's voice and Vesper's positioning to this profile."
      nextHref="/onboard/brokerage"
    >
      <FieldRow>
        <Field label="Legal first name"><Input name="legal_first_name" defaultValue={v.legal_first_name} required /></Field>
        <Field label="Legal last name"><Input name="legal_last_name" defaultValue={v.legal_last_name} required /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Preferred display name" hint="Shown on listings, microsites, and Sofia's intros."><Input name="preferred_name" defaultValue={v.preferred_name} placeholder="Thomas Bichi" /></Field>
        <Field label="Title"><Input name="title" defaultValue={v.title} placeholder="Realtor® / Team Lead" /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Mobile (cell)" hint="For Sofia handoff alerts."><Input name="cell_phone" type="tel" defaultValue={v.cell_phone} placeholder="(305) 608-6357" /></Field>
        <Field label="Year started in real estate"><Input name="year_started" type="number" min={1970} max={2026} defaultValue={v.year_started} placeholder="2016" /></Field>
      </FieldRow>
      <Field label="Email"><Input name="email" type="email" defaultValue={v.email} placeholder="thomas@investmiami-livemiami.com" /></Field>
      <Field label="Specialties (comma-separated)" hint="Residential, Investor, Luxury, New Construction, Rentals, Commercial, Multifamily, Pre-Construction, Foreign Buyers, 1031.">
        <Input name="specialties" defaultValue={v.specialties} placeholder="Residential, Investor, Multifamily, Pre-Construction, Foreign Buyers" />
      </Field>
      <Field label="Languages spoken (comma-separated)">
        <Input name="languages" defaultValue={v.languages} placeholder="English, Spanish, Portuguese" />
      </Field>
      <Field label="Awards / recognitions" hint="Optional. AI parses for press use and bio generation.">
        <Textarea name="awards" defaultValue={v.awards} placeholder="Top KW Producer 2016–2024, Miami Beach SoFi specialist…" />
      </Field>
      <Field label="Bio" hint="Used as the long-form 'about' on microsites and Vesper's first-person posts.">
        <Textarea name="bio_text" defaultValue={v.bio_text} rows={6} />
      </Field>
    </StageForm>
  );
}
