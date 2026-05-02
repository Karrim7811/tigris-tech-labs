import { StageShell, FieldRow, Field } from "../_stage-shell";
import { Input, Textarea } from "@/components/ui/input";

export default function StageIdentity() {
  return (
    <StageShell
      stage={1}
      title="Who are you, professionally?"
      intro="Identity, specialty, and credentials. The platform tunes Sofia's voice and Vesper's positioning to this profile."
      nextHref="/onboard/brokerage"
    >
      <FieldRow>
        <Field label="Legal first name"><Input name="legal_first_name" required /></Field>
        <Field label="Legal last name"><Input name="legal_last_name" required /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Preferred display name" hint="Shown on listings, microsites, and Sofia's intros."><Input name="preferred_name" placeholder="Thomas Bichi" /></Field>
        <Field label="Title"><Input name="title" placeholder="Realtor® / Team Lead" /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Mobile (cell)" hint="For Sofia handoff alerts."><Input name="cell_phone" type="tel" placeholder="(305) 608-6357" /></Field>
        <Field label="Year started in real estate"><Input name="year_started" type="number" min={1970} max={2026} placeholder="2014" /></Field>
      </FieldRow>
      <Field label="Specialties (comma-separated)" hint="Residential, Investor, Luxury, New Construction, Rentals, Commercial, Multifamily, Pre-Construction, Foreign Buyers, 1031.">
        <Input name="specialties" placeholder="Residential, Investor, Multifamily, Pre-Construction, Foreign Buyers" />
      </Field>
      <Field label="Languages spoken (comma-separated)">
        <Input name="languages" placeholder="English, Spanish, Portuguese" />
      </Field>
      <Field label="Awards / recognitions" hint="Optional. AI parses for press use and bio generation.">
        <Textarea name="awards" placeholder="Top KW Producer 2016–2024, Miami Beach SoFi specialist…" />
      </Field>
    </StageShell>
  );
}
