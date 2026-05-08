import { StageForm, FieldRow, Field } from "../_stage-form";
import { Input } from "@/components/ui/input";
import { loadOnboardContext } from "../_load-onboard-defaults";

export default async function StageBrokerage() {
  const ctx = await loadOnboardContext();
  const v = ctx.defaults[2] ?? {};
  return (
    <StageForm
      stage={2}
      title="Brokerage and license."
      intro="Compliance-required brokerage data. The brokerage logo is shown small in a 'Brokered by' footer treatment — your personal brand stays primary."
      prevHref="/onboard/identity"
      nextHref="/onboard/brand"
    >
      <FieldRow>
        <Field label="Brokerage name"><Input name="brokerage_name" defaultValue={v.brokerage_name} placeholder="Keller Williams Capital Realty" required /></Field>
        <Field label="Brokerage phone"><Input name="brokerage_phone" type="tel" defaultValue={v.brokerage_phone} /></Field>
      </FieldRow>
      <Field label="Brokerage address">
        <Input name="brokerage_address" defaultValue={v.brokerage_address} placeholder="550 Biltmore Way #PH2, Coral Gables, FL 33134" />
      </Field>
      <FieldRow>
        <Field label="License number"><Input name="license_number" defaultValue={v.license_number} placeholder="SL-3261222" required /></Field>
        <Field label="License state(s)" hint="Comma-separated."><Input name="license_states" defaultValue={v.license_states} placeholder="FL" /></Field>
      </FieldRow>
      <Field label="MLS memberships" hint="Comma-separated. Used to gate listing sync once MLS API integration is live.">
        <Input name="mls_memberships" defaultValue={v.mls_memberships} placeholder="MIAMI Association of REALTORS, MLS of South Florida" />
      </Field>
      <FieldRow>
        <Field label="Team name (optional)"><Input name="team_name" defaultValue={v.team_name} placeholder="Invest Miami – Live Miami" /></Field>
        <Field label="Team phone (optional)"><Input name="team_phone" type="tel" defaultValue={v.team_phone} placeholder="866-295-3322" /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Brokerage compliance email" hint="For audit copies of consent records and AI disclosures."><Input name="compliance_email" type="email" defaultValue={v.compliance_email} /></Field>
        <Field label="KW Command username" hint="Held until KW Command API is publicly available; CSV imports work today.">
          <Input name="kw_command_username" defaultValue={v.kw_command_username} />
        </Field>
      </FieldRow>
    </StageForm>
  );
}
