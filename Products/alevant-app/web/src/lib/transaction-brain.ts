// Transaction Brain — orchestrates contract-to-close.
//
// Builds a deal-specific milestone timeline, schedules nudges, detects risk signals.
// Default template: standard FL residential 35-day close.

import { addDays, format, differenceInDays } from "date-fns";

export type MilestoneType =
  | "contract_signed"
  | "earnest_money"
  | "inspection"
  | "inspection_negotiation"
  | "financing_application"
  | "appraisal"
  | "loan_commitment"
  | "title_prep"
  | "hoa_estoppel"
  | "clear_to_close"
  | "final_walkthrough"
  | "closing"
  | "funding";

export interface Milestone {
  type: MilestoneType;
  label: string;
  due_date: string;
  responsible_party: "buyer" | "seller" | "lender" | "title" | "inspector" | "agent" | "hoa";
  nudge_schedule_days: number[]; // days before due date to nudge
  blocking: boolean;
  status: "pending" | "in_progress" | "completed" | "at_risk" | "blocked";
}

export interface Transaction {
  id: string;
  workspace_id: string;
  contract_date: string;
  expected_close: string;
  side: "buyer" | "seller" | "both";
}

const RES_TEMPLATE: Array<Pick<Milestone, "type" | "label" | "responsible_party" | "nudge_schedule_days" | "blocking"> & { offset: number }> = [
  { type: "contract_signed", label: "Executed contract", offset: 0, responsible_party: "agent", nudge_schedule_days: [], blocking: true },
  { type: "earnest_money", label: "Earnest money deposited", offset: 3, responsible_party: "buyer", nudge_schedule_days: [1], blocking: true },
  { type: "inspection", label: "Inspection ordered + completed", offset: 10, responsible_party: "inspector", nudge_schedule_days: [4, 1], blocking: true },
  { type: "inspection_negotiation", label: "Inspection objections resolved", offset: 15, responsible_party: "agent", nudge_schedule_days: [3, 1], blocking: true },
  { type: "financing_application", label: "Financing application complete", offset: 14, responsible_party: "lender", nudge_schedule_days: [3, 1], blocking: true },
  { type: "appraisal", label: "Appraisal ordered + received", offset: 21, responsible_party: "lender", nudge_schedule_days: [5, 2, 1], blocking: true },
  { type: "loan_commitment", label: "Loan commitment letter", offset: 28, responsible_party: "lender", nudge_schedule_days: [5, 2, 1], blocking: true },
  { type: "title_prep", label: "Title commitment + survey", offset: 28, responsible_party: "title", nudge_schedule_days: [5, 1], blocking: true },
  { type: "hoa_estoppel", label: "HOA estoppel", offset: 30, responsible_party: "hoa", nudge_schedule_days: [10, 5, 2], blocking: true },
  { type: "clear_to_close", label: "Clear to close", offset: 33, responsible_party: "lender", nudge_schedule_days: [3, 1], blocking: true },
  { type: "final_walkthrough", label: "Final walkthrough", offset: 34, responsible_party: "buyer", nudge_schedule_days: [1], blocking: false },
  { type: "closing", label: "Closing / signing", offset: 35, responsible_party: "title", nudge_schedule_days: [3, 1], blocking: true },
  { type: "funding", label: "Funded + recorded", offset: 36, responsible_party: "title", nudge_schedule_days: [1], blocking: true },
];

export function buildResidentialTimeline(
  contractDate: string,
  expectedClose?: string
): Milestone[] {
  const start = new Date(contractDate);
  return RES_TEMPLATE.map((m) => ({
    type: m.type,
    label: m.label,
    due_date: format(addDays(start, m.offset), "yyyy-MM-dd"),
    responsible_party: m.responsible_party,
    nudge_schedule_days: m.nudge_schedule_days,
    blocking: m.blocking,
    status: m.type === "contract_signed" ? "completed" : "pending",
  }));
}

// =============================================================================
// Risk detection
// =============================================================================

export interface RiskFlag {
  type:
    | "lender_silence"
    | "appraisal_gap"
    | "inspection_dealbreaker"
    | "title_issue"
    | "hoa_delay"
    | "milestone_overdue"
    | "missing_docusign";
  severity: "low" | "medium" | "high";
  milestone?: MilestoneType;
  detected_at: string;
  reason: string;
  suggested_action: string;
}

export function detectRisks(opts: {
  timeline: Milestone[];
  contractPrice?: number;
  appraisalAmount?: number;
  inspectionFindings?: string;
  lastLenderTouchAt?: string;
  lastTitleTouchAt?: string;
}): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const now = new Date();

  // Overdue milestones
  for (const m of opts.timeline) {
    if (m.status !== "pending" && m.status !== "in_progress") continue;
    const due = new Date(m.due_date);
    if (due < now) {
      const daysOverdue = differenceInDays(now, due);
      flags.push({
        type: "milestone_overdue",
        severity: daysOverdue > 3 ? "high" : daysOverdue > 1 ? "medium" : "low",
        milestone: m.type,
        detected_at: now.toISOString(),
        reason: `${m.label} is ${daysOverdue} day(s) past due (responsible: ${m.responsible_party}).`,
        suggested_action: `Contact ${m.responsible_party} for status. Confirm whether expected close date should shift.`,
      });
    }
  }

  // Lender silence — 5+ days no touch on a deal with active financing milestones
  const hasLenderMilestonesPending = opts.timeline.some(
    (m) => m.responsible_party === "lender" && (m.status === "pending" || m.status === "in_progress")
  );
  if (hasLenderMilestonesPending && opts.lastLenderTouchAt) {
    const days = differenceInDays(now, new Date(opts.lastLenderTouchAt));
    if (days >= 5) {
      flags.push({
        type: "lender_silence",
        severity: days >= 10 ? "high" : "medium",
        detected_at: now.toISOString(),
        reason: `${days} days since last lender activity.`,
        suggested_action: "Call the lender directly. Escalate to the lender's manager if no response in 24 hours.",
      });
    }
  }

  // Appraisal gap
  if (opts.contractPrice && opts.appraisalAmount) {
    const gapPct = (opts.contractPrice - opts.appraisalAmount) / opts.contractPrice;
    if (gapPct > 0.02) {
      flags.push({
        type: "appraisal_gap",
        severity: gapPct > 0.05 ? "high" : "medium",
        detected_at: now.toISOString(),
        reason: `Appraisal $${opts.appraisalAmount.toLocaleString()} is ${(gapPct * 100).toFixed(1)}% below contract $${opts.contractPrice.toLocaleString()}.`,
        suggested_action: "Discuss options: appraisal rebuttal, price renegotiation, or buyer cash-to-close gap coverage.",
      });
    }
  }

  // Inspection dealbreaker keywords
  if (opts.inspectionFindings) {
    const keywords = ["structural", "foundation", "mold", "asbestos", "lead paint", "roof replacement", "termite", "sinkhole", "sea wall"];
    const hits = keywords.filter((k) => opts.inspectionFindings!.toLowerCase().includes(k));
    if (hits.length) {
      flags.push({
        type: "inspection_dealbreaker",
        severity: "high",
        detected_at: now.toISOString(),
        reason: `Inspection report contains potential dealbreaker keywords: ${hits.join(", ")}.`,
        suggested_action: "Review the report with the buyer. Get specialist quotes before proceeding to negotiation.",
      });
    }
  }

  return flags;
}

// =============================================================================
// Nudge scheduler
// =============================================================================

export interface NudgePayload {
  milestone: MilestoneType;
  responsible_party: Milestone["responsible_party"];
  due_date: string;
  days_to_due: number;
  message_draft: string;
}

export function dueNudges(timeline: Milestone[], today = new Date()): NudgePayload[] {
  const out: NudgePayload[] = [];
  for (const m of timeline) {
    if (m.status === "completed" || m.status === "blocked") continue;
    const due = new Date(m.due_date);
    const daysToDue = differenceInDays(due, today);
    if (m.nudge_schedule_days.includes(daysToDue) && daysToDue >= 0) {
      out.push({
        milestone: m.type,
        responsible_party: m.responsible_party,
        due_date: m.due_date,
        days_to_due: daysToDue,
        message_draft: defaultNudgeMessage(m, daysToDue),
      });
    }
  }
  return out;
}

function defaultNudgeMessage(m: Milestone, daysToDue: number): string {
  const when = daysToDue === 0 ? "today" : daysToDue === 1 ? "tomorrow" : `in ${daysToDue} days`;
  switch (m.responsible_party) {
    case "lender":
      return `Friendly check-in — ${m.label} is due ${when}. Confirm we're on track or flag any blockers.`;
    case "title":
      return `Quick status — ${m.label} due ${when}. Anything outstanding from us?`;
    case "inspector":
      return `Confirming the inspection schedule — ${m.label} due ${when}. Report ETA?`;
    case "hoa":
      return `Following up on the HOA estoppel — needed by ${m.due_date}.`;
    case "buyer":
      return `Quick reminder — ${m.label} is due ${when}. Anything I can help with?`;
    case "seller":
      return `Status check — ${m.label} due ${when}. Any questions on our side?`;
    default:
      return `${m.label} is due ${when}. Confirming we're on track.`;
  }
}
