import { StageShell, FieldRow, Field } from "../_stage-shell";
import { Input } from "@/components/ui/input";

export default function StageMarketing() {
  return (
    <StageShell
      stage={8}
      title="Vesper's marketing defaults."
      intro="How aggressive do you want Vesper to be on Day One? Approval-gated by default — graduate to autonomous per channel as you build trust. Cadence flexes automatically when you take new listings."
      prevHref="/onboard/pipeline"
      nextHref="/onboard/compliance"
    >
      <Field label="Approval mode" hint="Recommended: gated for the first 30 days, then graduate per channel.">
        <select name="approval_mode" className="w-full bg-parchment border border-mist px-4 py-3 text-sm text-ink">
          <option value="gated">Approval-Gated (default)</option>
          <option value="hybrid">Hybrid — autonomous on selected channels</option>
          <option value="autonomous">Autonomous on all channels</option>
        </select>
      </Field>

      <FieldRow>
        <Field label="Default cadence (posts / day)"><Input name="posts_per_day" type="number" defaultValue="1" /></Field>
        <Field label="Approval window (minutes)" hint="If you don't approve in this window, the post is auto-discarded.">
          <Input name="approval_window" type="number" defaultValue="240" />
        </Field>
      </FieldRow>

      <Field label="Channels enabled" hint="V1 priority: IG · LinkedIn · X · TikTok.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          {["instagram","x","tiktok","linkedin","youtube","email","print"].map((ch) => (
            <label key={ch} className="inline-flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="channels" value={ch} defaultChecked={["instagram","x","tiktok","linkedin","email"].includes(ch)} />
              <span className="capitalize">{ch}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Fair Housing — strict mode" hint="Not bypassable. Posts with protected-class language are blocked at lint, not warned.">
        <label className="inline-flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="fair_housing_strict" defaultChecked disabled /> Strict (default)</label>
      </Field>

      <Field label="Per-listing campaign trigger" hint="When you mark a listing 'Active', Vesper auto-generates the 12-asset campaign within 24 hours.">
        <label className="inline-flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="auto_campaign_trigger" defaultChecked /> Auto-trigger</label>
      </Field>
    </StageShell>
  );
}
