import { StageForm, FieldRow, Field } from "../_stage-form";
import { Input } from "@/components/ui/input";
import { loadOnboardContext } from "../_load-onboard-defaults";

export default async function StageSofia() {
  const ctx = await loadOnboardContext();
  const v = ctx.defaults[5] ?? {};
  return (
    <StageForm
      stage={5}
      title="Configure Sofia."
      intro="Sofia is your AI Inside Sales Agent. She picks up the phone, replies on socials, qualifies leads, books showings, and hands hot leads to you. We'll provision a local Miami area-code number."
      prevHref="/onboard/connections"
      nextHref="/onboard/sphere"
    >
      <FieldRow>
        <Field label="Sofia name"><Input name="sofia_name" defaultValue={v.sofia_name} /></Field>
        <Field label="Languages enabled" hint="EN V1. ES + PT in V2."><Input name="languages" defaultValue={v.languages} /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Live handoff hours (you)" hint="Outside these hours Sofia handles end-to-end."><Input name="live_hours" defaultValue={v.live_hours} /></Field>
        <Field label="Qualification threshold" hint="Hot leads (score ≥) get pushed to your cell instantly."><Input name="qualification_threshold" type="number" defaultValue={v.qualification_threshold} /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Sofia voice (ElevenLabs)" hint="Pick warm-authority Miami English. Sample voices are previewable in app.">
          <select name="voice_id" defaultValue={v.voice_id} className="w-full bg-parchment border border-mist px-4 py-3 text-sm text-ink">
            <option value="warm-authority-en">Warm Authority — English</option>
            <option value="warm-narrative-en">Warm Narrative — English</option>
            <option value="confident-direct-en">Confident Direct — English</option>
          </select>
        </Field>
        <Field label="Phone area code" hint="Local area code for your Twilio Sofia number."><Input name="area_code" defaultValue={v.area_code} /></Field>
      </FieldRow>
      <Field label="AI Disclosure" hint="Required by some state laws. Strongly recommended ON.">
        <label className="inline-flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="ai_disclosure" defaultChecked={v.ai_disclosure !== false} /> Sofia identifies as AI on every conversation.</label>
      </Field>
      <Field label="Recording consent" hint="Two-party-consent state compliance. Strongly recommended ON.">
        <label className="inline-flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="recording_consent" defaultChecked={v.recording_consent !== false} /> Sofia announces recording on every call.</label>
      </Field>
    </StageForm>
  );
}
