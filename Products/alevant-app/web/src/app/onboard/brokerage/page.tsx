import { StageShell, FieldRow, Field } from "../_stage-shell";
import { Input } from "@/components/ui/input";

export default function StageBrokerage() {
  return (
    <StageShell
      stage={2}
      title="Brokerage and license."
      intro="Compliance-required brokerage data. The brokerage logo is shown small in a 'Brokered by' footer treatment — your personal brand stays primary."
      prevHref="/onboard/identity"
      nextHref="/onboard/brand"
    >
      <FieldRow>
        <Field label="Brokerage name"><Input name="brokerage_name" placeholder="Keller Williams Capital Realty" /></Field>
        <Field label="Brokerage phone"><Input name="brokerage_phone" type="tel" /></Field>
      </FieldRow>
      <Field label="Brokerage address">
        <Input name="brokerage_address" placeholder="550 Biltmore Way #PH2, Coral Gables, FL 33134" />
      </Field>
      <FieldRow>
        <Field label="License number"><Input name="license_number" required /></Field>
        <Field label="License state(s)" hint="Comma-separated."><Input name="license_states" placeholder="FL" /></Field>
      </FieldRow>
      <Field label="MLS memberships" hint="Comma-separated. Used to gate listing sync once MLS API integration is live.">
        <Input name="mls_memberships" placeholder="Miami MLS, MLS of South FL" />
      </Field>
      <FieldRow>
        <Field label="Team name (optional)"><Input name="team_name" placeholder="Invest Miami – Live Miami" /></Field>
        <Field label="Brokerage compliance email" hint="For audit copies of consent records and AI disclosures."><Input name="compliance_email" type="email" /></Field>
      </FieldRow>
      <Field label="KW Command username" hint="Held until KW Command API is publicly available; CSV imports work today.">
        <Input name="kw_command_username" />
      </Field>
    </StageShell>
  );
}
