// Playbook execution engine.
//
// Responsibilities:
//   1. Pick the right playbook for a contact given its lifecycle_stage + temperature.
//   2. Start a playbook_run with step 0 scheduled to now (day_offset = 0).
//   3. Schedule subsequent steps based on each step's day_offset (in days from run start).
//   4. Advance a run when the current step completes (logs activity + schedules next).
//   5. Snooze, pause, abort.
//
// Step shape:
//   { day_offset: int,
//     channel: 'call' | 'sms' | 'email' | 'meeting' | 'note',
//     action: string,
//     draft_prompt?: string }

import type { SupabaseClient } from "@supabase/supabase-js";

export interface PlaybookStep {
  day_offset: number;
  channel: "call" | "sms" | "email" | "meeting" | "note";
  action: string;
  draft_prompt?: string;
}

export interface Playbook {
  id: string;
  workspace_id: string;
  name: string;
  description?: string | null;
  trigger_lifecycle_stages: string[] | null;
  trigger_temperatures: string[] | null;
  steps_json: { steps: PlaybookStep[] };
  is_system: boolean;
}

export interface Contact {
  id: string;
  workspace_id: string;
  full_name?: string | null;
  lifecycle_stage?: string | null;
  temperature?: string | null;
}

/**
 * Find playbooks whose triggers match the contact. Picks the single best match
 * (most specific lifecycle + temperature combo wins; system templates are tied).
 */
export async function findMatchingPlaybook(
  svc: SupabaseClient,
  contact: Contact
): Promise<Playbook | null> {
  if (!contact.lifecycle_stage || !contact.temperature) return null;

  const { data } = await svc
    .from("playbooks")
    .select("*")
    .eq("workspace_id", contact.workspace_id);
  const matches = (data ?? []).filter((p: Playbook) => {
    const stages = p.trigger_lifecycle_stages ?? [];
    const temps = p.trigger_temperatures ?? [];
    return (
      stages.length > 0 &&
      stages.includes(contact.lifecycle_stage as string) &&
      temps.length > 0 &&
      temps.includes(contact.temperature as string)
    );
  }) as Playbook[];

  if (!matches.length) return null;
  // Prefer the playbook with the most specific (smallest) trigger set
  matches.sort((a, b) => {
    const aSpec =
      (a.trigger_lifecycle_stages?.length ?? 0) + (a.trigger_temperatures?.length ?? 0);
    const bSpec =
      (b.trigger_lifecycle_stages?.length ?? 0) + (b.trigger_temperatures?.length ?? 0);
    return aSpec - bSpec;
  });
  return matches[0];
}

/**
 * Start a playbook run for a contact. Idempotent: if an active run already exists
 * for this (contact, playbook), returns the existing one.
 */
export async function startPlaybookRun(
  svc: SupabaseClient,
  playbook: Playbook,
  contact: Contact
): Promise<{ run_id: string; new: boolean }> {
  // Skip if already an active run for the same playbook+contact
  const { data: existing } = await svc
    .from("playbook_runs")
    .select("id")
    .eq("workspace_id", contact.workspace_id)
    .eq("playbook_id", playbook.id)
    .eq("contact_id", contact.id)
    .in("status", ["active", "paused"])
    .maybeSingle();
  if (existing) return { run_id: existing.id, new: false };

  const { data: run, error } = await svc
    .from("playbook_runs")
    .insert({
      workspace_id: contact.workspace_id,
      playbook_id: playbook.id,
      contact_id: contact.id,
      status: "active",
      current_step: 0,
    })
    .select("*")
    .single();
  if (error || !run) throw new Error(error?.message ?? "failed to start run");

  // Schedule every step
  const steps = playbook.steps_json?.steps ?? [];
  const now = Date.now();
  const rows = steps.map((s, idx) => ({
    workspace_id: contact.workspace_id,
    run_id: run.id,
    contact_id: contact.id,
    step_index: idx,
    step_json: s,
    due_at: new Date(now + s.day_offset * 86_400_000).toISOString(),
    state: "scheduled",
  }));
  if (rows.length) await svc.from("playbook_step_runs").insert(rows);

  // Log the start on the contact timeline
  await svc.from("contact_activities").insert({
    workspace_id: contact.workspace_id,
    contact_id: contact.id,
    kind: "system_event",
    channel: "playbook",
    direction: "internal",
    subject: `Playbook started: ${playbook.name}`,
    body: `${steps.length} step${steps.length === 1 ? "" : "s"} scheduled.`,
    occurred_at: new Date().toISOString(),
    logged_by_system: "playbook-engine",
    metadata: { playbook_id: playbook.id, run_id: run.id },
  });

  return { run_id: run.id, new: true };
}

/**
 * Evaluate playbooks for a contact and start the matching one if no active run
 * exists. Called whenever a contact's temperature or lifecycle_stage changes.
 */
export async function evaluateAndStart(
  svc: SupabaseClient,
  contact: Contact
): Promise<{ playbook_id: string | null; run_id: string | null }> {
  const pb = await findMatchingPlaybook(svc, contact);
  if (!pb) return { playbook_id: null, run_id: null };
  const { run_id } = await startPlaybookRun(svc, pb, contact);
  return { playbook_id: pb.id, run_id };
}

/**
 * Mark a step complete (optionally linking the related activity) and advance the
 * run. If this was the final step, mark the run completed.
 */
export async function completeStep(
  svc: SupabaseClient,
  step_id: string,
  opts: { activity_id?: string; notes?: string } = {}
): Promise<void> {
  const now = new Date().toISOString();
  const { data: step } = await svc
    .from("playbook_step_runs")
    .select("*")
    .eq("id", step_id)
    .maybeSingle();
  if (!step) return;

  await svc
    .from("playbook_step_runs")
    .update({
      state: "completed",
      completed_at: now,
      related_activity_id: opts.activity_id ?? null,
      notes: opts.notes ?? null,
      updated_at: now,
    })
    .eq("id", step_id);

  // Is this the last step?
  const { data: nextSteps } = await svc
    .from("playbook_step_runs")
    .select("id, step_index, state")
    .eq("run_id", step.run_id)
    .order("step_index", { ascending: true });

  const allDone = (nextSteps ?? []).every((s) => s.state === "completed" || s.state === "skipped");
  await svc
    .from("playbook_runs")
    .update(
      allDone
        ? { current_step: step.step_index + 1, status: "completed", completed_at: now }
        : { current_step: step.step_index + 1 }
    )
    .eq("id", step.run_id);
}

export async function skipStep(svc: SupabaseClient, step_id: string, notes?: string): Promise<void> {
  const now = new Date().toISOString();
  await svc
    .from("playbook_step_runs")
    .update({ state: "skipped", completed_at: now, notes: notes ?? null, updated_at: now })
    .eq("id", step_id);
  // Advance run cursor if needed
  const { data: step } = await svc
    .from("playbook_step_runs")
    .select("run_id, step_index")
    .eq("id", step_id)
    .maybeSingle();
  if (step) {
    await svc
      .from("playbook_runs")
      .update({ current_step: step.step_index + 1 })
      .eq("id", step.run_id);
    // Mark run completed if all steps are terminal
    const { data: siblings } = await svc
      .from("playbook_step_runs")
      .select("state")
      .eq("run_id", step.run_id);
    const allDone = (siblings ?? []).every((s) => s.state === "completed" || s.state === "skipped" || s.state === "aborted");
    if (allDone) {
      await svc
        .from("playbook_runs")
        .update({ status: "completed", completed_at: now })
        .eq("id", step.run_id);
    }
  }
}

export async function snoozeStep(svc: SupabaseClient, step_id: string, until: Date): Promise<void> {
  await svc
    .from("playbook_step_runs")
    .update({
      state: "snoozed",
      snoozed_until: until.toISOString(),
      due_at: until.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", step_id);
}

export async function pauseRun(svc: SupabaseClient, run_id: string): Promise<void> {
  const now = new Date().toISOString();
  await svc
    .from("playbook_runs")
    .update({ status: "paused", paused_at: now })
    .eq("id", run_id);
}

export async function resumeRun(svc: SupabaseClient, run_id: string): Promise<void> {
  await svc.from("playbook_runs").update({ status: "active", paused_at: null }).eq("id", run_id);
}

export async function abortRun(svc: SupabaseClient, run_id: string): Promise<void> {
  const now = new Date().toISOString();
  await svc
    .from("playbook_runs")
    .update({ status: "aborted", completed_at: now })
    .eq("id", run_id);
  await svc
    .from("playbook_step_runs")
    .update({ state: "aborted", updated_at: now })
    .eq("run_id", run_id)
    .in("state", ["scheduled", "surfaced", "snoozed"]);
}

/**
 * Surface scheduled steps that have come due. Called by the cron.
 * Returns the number of steps newly surfaced.
 */
export async function surfaceDueSteps(svc: SupabaseClient): Promise<number> {
  const now = new Date().toISOString();
  // Only surface steps whose run is active
  const { data: due } = await svc
    .from("playbook_step_runs")
    .select("id, run_id")
    .eq("state", "scheduled")
    .lte("due_at", now)
    .limit(500);
  if (!due?.length) return 0;

  // Filter to active runs only
  const runIds = Array.from(new Set(due.map((d) => d.run_id)));
  const { data: runs } = await svc
    .from("playbook_runs")
    .select("id, status")
    .in("id", runIds);
  const activeRunIds = new Set(
    (runs ?? []).filter((r) => r.status === "active").map((r) => r.id)
  );
  const toSurface = due.filter((d) => activeRunIds.has(d.run_id));
  if (!toSurface.length) return 0;

  await svc
    .from("playbook_step_runs")
    .update({ state: "surfaced", surfaced_at: now, updated_at: now })
    .in(
      "id",
      toSurface.map((d) => d.id)
    );
  return toSurface.length;
}
