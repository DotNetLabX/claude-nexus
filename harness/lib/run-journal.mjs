// run-journal.mjs — the F7 S3 per-run journal + idempotent cross-session reconcile (dev-repo harness).
//
// WHY: the Workflow tool's resume machinery (`Workflow({ scriptPath, resumeFromRunId })`) replays the
// unchanged `agent()` prefix from a SAME-SESSION cache — a run killed today could not be resumed tomorrow.
// The journal is the durable run-state record layered over that cache: a per-run file under the runs dir
// carrying stage / status / runId / timestamps (+ per-stage token accrual for Step 7). It lets a
// reconcile pass in a NEW session know exactly where a killed run stopped and produce a resume plan,
// instead of writing the whole run off.
//
// SHARED SUBSTRATE (critic MEDIUM-1): this journal is the ONE run-state source for the wave —
//   - Step 5's watcher polls stage status/timestamps here to detect stalls (Workflow in-session state is
//     unreachable by an external watcher process; the journal is the only viable substrate).
//   - Step 7 accrues realized tokens per completed stage here (the runway-forecast input).
//
// PURE — no filesystem, no LLM. The orchestrator/operator reads the journal file, calls these functions,
// and writes the result back (the same no-fs-in-the-orchestrator discipline as the other harness libs).
// The reconcile shape (resume / complete-tail / none) mirrors VWH `recovery.py` — SHAPE ONLY, no imports.

import { pathToFileURL } from 'node:url';

const RUNNING = 'running';
const COMPLETED = 'completed';

/**
 * Build a fresh journal with every stage pending and the run marked running.
 * @param {{runId:string, script:string, stages:string[], now:string, budget?:object}} opts
 * @returns {object} journal
 */
export function createJournal({ runId, script, stages = [], now, budget } = {}) {
  return {
    runId,
    script,
    status: RUNNING,
    createdAt: now,
    updatedAt: now,
    ...(budget ? { budget } : {}),
    stages: stages.map((name) => ({ name, status: 'pending' })),
  };
}

function _stage(journal, name) {
  return journal.stages.find((s) => s.name === name);
}

/** Mark a stage running + stamp its start; returns a NEW journal (pure). */
export function startStage(journal, name, now) {
  const stages = journal.stages.map((s) => (s.name === name ? { ...s, status: 'running', startedAt: now } : s));
  return { ...journal, stages, updatedAt: now };
}

/**
 * Mark a stage done, stamp its end, accrue its realized tokens, and flip the run to completed when the
 * last stage finishes. Returns a NEW journal (pure).
 * @param {object} journal
 * @param {string} name
 * @param {{now:string, tokens?:number}} opts
 */
export function completeStage(journal, name, { now, tokens } = {}) {
  const stages = journal.stages.map((s) =>
    s.name === name ? { ...s, status: 'done', endedAt: now, ...(tokens !== undefined ? { tokens } : {}) } : s,
  );
  const allDone = stages.every((s) => s.status === 'done');
  return {
    ...journal,
    stages,
    updatedAt: now,
    ...(allDone ? { status: COMPLETED, completedAt: now } : {}),
  };
}

/**
 * Reconcile a journal — the idempotent cross-session recovery entry path. Returns the decision plus the
 * reconciled journal. Three actions (VWH recovery.py shape):
 *   - resume        — a stage is unfinished (the run was killed mid-flight): reset any dangling `running`
 *                     stage to `pending` and resume from the first non-done stage.
 *   - complete-tail — every stage is done but the completion status was never written: finalize it.
 *   - none          — the run is already completed (or already reconciled to a stable state): no-op.
 * Idempotency (binding): reconcile(reconcile(j).journal) causes NO further state drift.
 * @param {object} journal
 * @param {string} now
 * @returns {{action:'resume'|'complete-tail'|'none', resumeFromStage:string|null, journal:object}}
 */
export function reconcile(journal, now) {
  const firstNotDone = journal.stages.find((s) => s.status !== 'done');

  if (!firstNotDone) {
    if (journal.status === COMPLETED) {
      return { action: 'none', resumeFromStage: null, journal };
    }
    return {
      action: 'complete-tail',
      resumeFromStage: null,
      journal: { ...journal, status: COMPLETED, completedAt: journal.completedAt ?? now },
    };
  }

  // A stage is unfinished — the run was killed. Reset a dangling `running` stage back to `pending` so the
  // resumed run re-executes it (a `running` stage that outlived its session never completed).
  const stages = journal.stages.map((s) => {
    if (s.status === 'running') {
      const { startedAt, ...rest } = s;
      return { ...rest, status: 'pending' };
    }
    return s;
  });
  const resumeFromStage = stages.find((s) => s.status !== 'done').name;
  return {
    action: 'resume',
    resumeFromStage,
    journal: { ...journal, stages, status: RUNNING, reconciledAt: journal.reconciledAt ?? now },
  };
}

/**
 * F7 S5: the marginal-budget rail's FORWARD projection. Over the journal's per-stage token accrual, project
 * spent + projected-remaining vs the budget and emit `forecast: over-budget at stage N` (binding line
 * shape) BEFORE the overrun — the proactive complement to the reactive report-on-halt rail (which is
 * unchanged). The projection is the average realized cost per completed stage applied to the remaining
 * stages; `overBudgetAtStage` is the 1-based run position of the FIRST stage whose projected cumulative
 * exceeds the budget. No completed stages (no basis) or no remaining stages → no forecast.
 *
 * @param {object} journal
 * @param {{budget:number}} opts  The run's marginal-spend ceiling.
 * @returns {{spent:number, avgPerStage:number, projectedRemaining:number, projectedTotal:number,
 *   overBudgetAtStage:number|null, line:string|null}}
 */
export function forecastRunway(journal, { budget } = {}) {
  const stages = journal?.stages ?? [];
  const done = stages.filter((s) => s.status === 'done' && typeof s.tokens === 'number');
  const spent = done.reduce((a, s) => a + s.tokens, 0);
  const remaining = stages.filter((s) => s.status !== 'done');

  if (done.length === 0 || remaining.length === 0) {
    return { spent, avgPerStage: 0, projectedRemaining: 0, projectedTotal: spent, overBudgetAtStage: null, line: null };
  }

  const avgPerStage = spent / done.length;
  let cum = spent;
  let overBudgetAtStage = null;
  for (const s of remaining) {
    cum += avgPerStage;
    if (overBudgetAtStage === null && budget != null && cum > budget) {
      overBudgetAtStage = stages.indexOf(s) + 1; // 1-based run position of the crossing stage
    }
  }
  const projectedTotal = cum;
  return {
    spent,
    avgPerStage,
    projectedRemaining: projectedTotal - spent,
    projectedTotal,
    overBudgetAtStage,
    line: overBudgetAtStage !== null ? `forecast: over-budget at stage ${overBudgetAtStage}` : null,
  };
}

/** Serialize the journal to stable pretty JSON (the on-disk form). */
export function serializeJournal(journal) {
  return JSON.stringify(journal, null, 2);
}

/** Parse a journal file's text back into an object (the deterministic inverse of serializeJournal). */
export function parseJournal(text) {
  return JSON.parse(text ?? '{}');
}

// --- Thin CLI (operator-owed cross-session exercise) ---------------------------------------------
// Lets the operator reconcile a journal file in a NEW session:
//   node harness/lib/run-journal.mjs reconcile <journalPath>
// Reads the file, runs reconcile, prints the decision, and writes the reconciled journal back. This is
// the ONLY fs-touching path and it lives behind the direct-invocation guard, keeping the lib itself pure.
const _invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (_invokedDirectly) {
  const [cmd, journalPath] = process.argv.slice(2);
  if (cmd === 'reconcile' && journalPath) {
    const fs = await import('node:fs');
    const journal = parseJournal(fs.readFileSync(journalPath, 'utf8'));
    const now = new Date().toISOString();
    const result = reconcile(journal, now);
    fs.writeFileSync(journalPath, serializeJournal(result.journal));
    // eslint-disable-next-line no-console
    console.log(`reconcile: ${result.action}${result.resumeFromStage ? ` from stage "${result.resumeFromStage}"` : ''} (runId ${journal.runId ?? '?'})`);
  } else {
    // eslint-disable-next-line no-console
    console.error('usage: node harness/lib/run-journal.mjs reconcile <journalPath>');
    process.exit(2);
  }
}
