// Fair Housing Act + state-extended-class linter.
// Strict mode by default. Refuses to publish copy with protected-class language.

const PROTECTED_TERMS: { term: RegExp; class: string; severity: "block" | "warn" }[] = [
  { term: /\b(christian|jewish|muslim|hindu|buddhist|catholic|protestant)\b/i, class: "religion", severity: "block" },
  { term: /\b(white|black|asian|hispanic|latino|latina)\s+(neighborhood|community|family|area)\b/i, class: "race", severity: "block" },
  { term: /\bperfect\s+for\s+(families|couples|singles|kids|seniors|empty[\s-]nesters)\b/i, class: "familial_status", severity: "block" },
  { term: /\b(no\s+children|adults\s+only|child[\s-]free|kid[\s-]free|child[\s-]less|family[\s-]less)\b/i, class: "familial_status", severity: "block" },
  { term: /\b(great|good|excellent|top|best)\s+schools?\b/i, class: "familial_status_steering", severity: "warn" },
  { term: /\b(safe|quiet|crime[\s-]free)\s+neighborhood\b/i, class: "race_steering", severity: "warn" },
  { term: /\b(walking[\s-]?distance|easy\s+access)\s+to\s+(church|synagogue|mosque|temple)\b/i, class: "religion_steering", severity: "block" },
  { term: /\b(handicap[\s-]friendly|wheelchair[\s-]accessible)\b/i, class: "disability_advisory", severity: "warn" },
  { term: /\b(bachelor|bachelorette)\s+pad\b/i, class: "sex_steering", severity: "warn" },
  { term: /\b(traditional|family\s+values)\s+(neighborhood|home)\b/i, class: "familial_status_steering", severity: "warn" },
  { term: /\b(young|old|mature|senior|elderly)\s+(buyer|owner|tenant|professional)\b/i, class: "age", severity: "warn" },
  { term: /\bsection\s*8\s+(prohibited|not\s+accepted|not\s+welcome)\b/i, class: "source_of_income", severity: "block" },
  { term: /\bno\s+section\s*8\b/i, class: "source_of_income", severity: "block" },
  { term: /\b(LGBTQ?|gay|lesbian)\s+(friendly|community)\b/i, class: "sexual_orientation", severity: "warn" },
];

export interface FairHousingResult {
  passed: boolean;
  findings: { term: string; class: string; severity: "block" | "warn"; suggestion: string }[];
  flagged_terms: string[];
}

const SUGGESTIONS: Record<string, string> = {
  familial_status: "Describe the property, not the audience. Replace with feature-specific language (e.g., bedroom count, layout).",
  familial_status_steering: "Use objective school data (test scores, ratings) without value judgments.",
  race_steering: "Describe property features, not neighborhood demographics.",
  religion: "Remove references to religion. Describe location with street/distance.",
  religion_steering: "Use street name or generic distance language.",
  disability_advisory: "Use 'accessible' or describe specific accessible features.",
  sex_steering: "Use neutral lifestyle language or describe the floor plan.",
  age: "Describe property features rather than the buyer demographic.",
  source_of_income: "Source-of-income discrimination is illegal in many jurisdictions. Remove.",
  sexual_orientation: "Avoid demographic descriptors of neighborhoods.",
  race: "Remove demographic descriptors of neighborhoods.",
};

export function lintFairHousing(text: string, mode: "strict" | "advisory" = "strict"): FairHousingResult {
  const findings: FairHousingResult["findings"] = [];
  const flaggedTerms: string[] = [];
  for (const rule of PROTECTED_TERMS) {
    const m = text.match(rule.term);
    if (m) {
      flaggedTerms.push(m[0]);
      findings.push({
        term: m[0],
        class: rule.class,
        severity: rule.severity,
        suggestion: SUGGESTIONS[rule.class] || "Rephrase to describe the property, not the audience.",
      });
    }
  }
  const blocked = findings.some((f) => f.severity === "block");
  const passed = mode === "strict" ? findings.length === 0 : !blocked;
  return { passed, findings, flagged_terms: flaggedTerms };
}
