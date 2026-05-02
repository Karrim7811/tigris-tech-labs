import { StageShell, FieldRow, Field } from "../_stage-shell";
import { Input } from "@/components/ui/input";

export default function StageSofia() {
  return (
    <StageShell
      stage={5}
      title="Configure Sofia."
      intro="Sofia is your AI Inside Sales Agent. She picks up the phone, replies on socials, qualifies leads, books showings, and hands hot leads to you. We'll provision a local Miami area-code number."
      prevHref="/onboard/connections"
      nextHref="/onboard/sphere"
    >
      <FieldRow>
        <Field label="Sofia name"><Input name="sofia_name" defaultValue="Sofia" /></Field>
        <Field label="Languages enabled" hint="EN V1. ES + PT in V2."><Input name="languages" defaultValue="English" /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Live handoff hours (you)" hint="Outside these hours Sofia handles end-to-end."><Input name="live_hours" defaultValue="Mon-Sat 8:30am – 6:00pm" /></Field>
        <Field label="Qualification threshold" hint="Hot leads (score ≥) get pushed to your cell instantly."><Input name="qualification_threshold" type="number" defaultValue="70" /></Field>
      </FieldRow>
      <FieldRow>
        <Field label="Sofia voice (ElevenLabs)" hint="Pick warm-authority Miami English. Sample voices are previewable in app.">
          <select name="voice_id" className="w-full bg-parchment border border-mist px-4 py-3 text-sm text-ink">
            <option value="warm-authority-en">Warm Authority — English</option>
            <option value="warm-narrative-en">Warm Narrative — English</option>
            <option value="confident-direct-en">Confident Direct — English</option>
          </select>
        </Field>
        <Field label="Phone area code" hint="Local area code for your Twilio Sofia number."><Input name="area_code" defaultValue="305" /></Field>
      </FieldRow>
      <Field label="AI Disclosure" hint="Required by some state laws. Strongly recommended ON.">
        <label className="inline-flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="ai_disclosure" defaultChecked /> Sofia identifies as AI on every conversation.</label>
      </Field>
      <Field label="Recording consent" hint="Two-party-consent state compliance. Strongly recommended ON.">
        <label className="inline-flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="recording_consent" defaultChecked /> Sofia announces recording on every call.</label>
      </Field>
    </StageShell>
  );
}
