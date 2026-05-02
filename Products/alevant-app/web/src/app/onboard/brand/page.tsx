import { StageShell, FieldRow, Field } from "../_stage-shell";
import { Input, Textarea } from "@/components/ui/input";

export default function StageBrand() {
  return (
    <StageShell
      stage={3}
      title="Your brand kit."
      intro="Logo, palette, typography, and Vesper's voice. Magazine-tier creative starts from these inputs. Default suggestions are provided — override anything."
      prevHref="/onboard/brokerage"
      nextHref="/onboard/connections"
    >
      <Field label="Logo / wordmark upload" hint="SVG preferred. PNG fallback. We'll generate placeholders if you don't have one yet.">
        <input type="file" name="logo" accept=".svg,.png,.jpg" className="block text-sm text-smoke" />
      </Field>
      <FieldRow>
        <Field label="Wordmark text"><Input name="wordmark_text" placeholder="Bichi" /></Field>
        <Field label="Tagline" hint="Bichi default: Invest Miami. Live Miami."><Input name="tagline" placeholder="Invest Miami. Live Miami." /></Field>
      </FieldRow>

      <div>
        <p className="eyebrow !text-brass mb-4">Palette</p>
        <FieldRow>
          <Field label="Primary"><Input name="primary_color" placeholder="#0E5560" /></Field>
          <Field label="Secondary"><Input name="secondary_color" placeholder="#E8DCC4" /></Field>
        </FieldRow>
        <div className="mt-6">
          <FieldRow>
            <Field label="Accent"><Input name="accent_color" placeholder="#B5853E" /></Field>
            <Field label="Ink (text)"><Input name="ink_color" placeholder="#1A1915" /></Field>
          </FieldRow>
        </div>
      </div>

      <div>
        <p className="eyebrow !text-brass mb-4">Typography</p>
        <FieldRow>
          <Field label="Display font"><Input name="display_font" placeholder="Cormorant Garamond" /></Field>
          <Field label="Body font"><Input name="body_font" placeholder="Jost" /></Field>
        </FieldRow>
      </div>

      <div>
        <p className="eyebrow !text-brass mb-4">Photography library</p>
        <Field label="Headshots" hint="3–10 files."><input type="file" name="headshots" accept="image/*" multiple /></Field>
        <div className="mt-4">
          <Field label="Lifestyle / on-camera"><input type="file" name="lifestyle" accept="image/*" multiple /></Field>
        </div>
        <div className="mt-4">
          <Field label="Drone / b-roll video"><input type="file" name="broll" accept="video/*" multiple /></Field>
        </div>
        <div className="mt-4">
          <Field label="Social video URLs (one per line)" hint="IG / TikTok / YouTube — Vesper learns your on-camera voice from these.">
            <Textarea name="social_video_urls" placeholder="https://www.instagram.com/p/..." />
          </Field>
        </div>
      </div>

      <div>
        <p className="eyebrow !text-brass mb-4">Vesper voice preset</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: "insider", name: "The Insider", tier: "Sotheby's · Aman", sample: "Six bedrooms. The view at sunrise.", recommended: true },
            { id: "storyteller", name: "The Storyteller", tier: "Compass · T&C", sample: "She wakes to the bay. Coffee on the terrace before the city stirs." },
            { id: "authority", name: "The Authority", tier: "The Agency · Mauricio Umansky", sample: "Highest sale per sq ft in the building, 2026 YTD." },
            { id: "local_legend", name: "The Local Legend", tier: "Warm Miami insider", sample: "From the team that closed 11 transactions on Brickell this year." },
          ].map((v) => (
            <label key={v.id} className={`block border p-6 cursor-pointer transition-colors ${v.recommended ? "border-indigo bg-indigo/5" : "border-mist hover:border-indigo"}`}>
              <input type="radio" name="voice_preset" value={v.id} defaultChecked={v.recommended} className="sr-only peer" />
              <p className="serif-italic text-2xl text-ink mb-1">{v.name}</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-brass mb-3">{v.tier}{v.recommended ? " · Bichi V1" : ""}</p>
              <p className="serif-italic text-sm text-smoke italic leading-relaxed border-l-2 border-brass pl-3">{v.sample}</p>
            </label>
          ))}
        </div>
      </div>

      <Field label="Stock-photography prohibition" hint="When ON, Vesper will refuse to use stock photography. Strongly recommended.">
        <label className="inline-flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="prohibit_stock" defaultChecked /> Prohibit stock photography</label>
      </Field>
      <Field label="HeyGen avatar consent" hint="When ON, ALEVANT may train a HeyGen avatar from your headshots and voice samples. Avatar is watermarked 'AI-generated representation' on every output.">
        <label className="inline-flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="heygen_consent" /> Authorize HeyGen avatar training</label>
      </Field>
    </StageShell>
  );
}
