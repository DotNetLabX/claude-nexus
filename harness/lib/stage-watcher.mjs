// stage-watcher.mjs — F7 S2: mechanized stage/skeptic firing over the Step-4 run journal (dev-repo harness).
//
// WHY: subagent background-run completion notifications are unreliable (the "poll, don't wait" pilot
// lesson) — a stage can strand waiting on a callback that never fires. This watcher mechanizes the nudge:
// it polls the run journal on a bounded interval and, when a stage has been RUNNING longer than the stall
// threshold, advances it (or fires the cadence skeptic), logging each firing — no operator input needed.
//
// STATE SOURCE (binding, critic MEDIUM-1): the Step-4 run journal. An external watcher PROCESS cannot
// reach the Workflow tool's in-session `agent()` cache, so the journal — stage / status / timestamps — is
// the only substrate it can poll. The DECISION (`pollJournal`) is a pure function over journal state; the
// LOOP (`runWatcher`) is dev-repo machinery (Windows-compatible `setInterval`, NO cron assumption), and
// the LIVE Workflow missed-completion exercise is operator-owed (a subagent has no Workflow tool).
//
// PURE decision, no LLM. `runWatcher` is the only fs/timer-touching path and lives behind the CLI guard.
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';

const DEFAULT_STALL_MS = 10 * 60 * 1000; // 10 minutes with no stage progress = stalled.
const DEFAULT_INTERVAL_MS = 60 * 1000;   // poll cadence.
const DEFAULT_SKEPTIC_STAGE = 'consolidate-skeptic';

/**
 * Poll a run journal for a stalled stage. PURE — the live watcher reads the same journal state.
 * @param {object} journal  A parsed run journal (harness/lib/run-journal.mjs shape).
 * @param {{now:string, stallMs?:number, skepticStage?:string}} opts
 * @returns {{action:'advance'|'fire-skeptic'|'none', stage?:string, sinceMs?:number, reason:string}}
 */
export function pollJournal(journal, { now, stallMs = DEFAULT_STALL_MS, skepticStage = DEFAULT_SKEPTIC_STAGE } = {}) {
  if (!journal || journal.status === 'completed') {
    return { action: 'none', reason: 'run not active (completed or absent)' };
  }
  const running = (journal.stages ?? []).filter((s) => s.status === 'running');
  for (const s of running) {
    const startedMs = s.startedAt ? Date.parse(s.startedAt) : NaN;
    const sinceMs = Number.isNaN(startedMs) ? 0 : Date.parse(now) - startedMs;
    if (sinceMs > stallMs) {
      const action = s.name === skepticStage ? 'fire-skeptic' : 'advance';
      return { action, stage: s.name, sinceMs, reason: `stage "${s.name}" running ${sinceMs}ms > stall ${stallMs}ms` };
    }
  }
  return { action: 'none', reason: 'no stalled stage' };
}

/**
 * Render a single firing as a loggable line, or null when there is nothing to fire (each firing is logged).
 * @param {{action:string, stage?:string, sinceMs?:number, reason?:string}} decision
 * @param {{runId?:string}} ctx
 * @returns {string|null}
 */
export function formatFiring(decision, { runId } = {}) {
  if (!decision || decision.action === 'none') return null;
  const secs = decision.sinceMs != null ? ` (stalled ${Math.round(decision.sinceMs / 1000)}s)` : '';
  return `[stage-watcher] runId ${runId ?? '?'}: ${decision.action} stage "${decision.stage}"${secs} — ${decision.reason}`;
}

// --- The watcher loop (dev-repo machinery — operator-owed live arm) -------------------------------
// A bounded, Windows-compatible poll loop (setInterval, no cron). Each tick reads the journal file, polls
// it, and on a firing logs the line + invokes onFire. The Workflow-side effect of a firing (relaunching a
// stalled stage / firing the skeptic) is the operator's to wire to their run — this loop DETECTS + LOGS.
/**
 * @param {string} journalPath
 * @param {{intervalMs?:number, stallMs?:number, skepticStage?:string, onFire?:Function, log?:Function, readFile?:Function}} opts
 * @returns {{stop:Function}}
 */
export function runWatcher(journalPath, {
  intervalMs = DEFAULT_INTERVAL_MS, stallMs = DEFAULT_STALL_MS, skepticStage = DEFAULT_SKEPTIC_STAGE,
  onFire, log = console.log, readFile,
} = {}) {
  const read = readFile ?? ((p) => JSON.parse(readFileSync(p, 'utf8')));
  const tick = () => {
    let journal;
    try { journal = read(journalPath); } catch { return; } // journal not written yet / mid-write — skip
    const decision = pollJournal(journal, { now: new Date().toISOString(), stallMs, skepticStage });
    const line = formatFiring(decision, { runId: journal?.runId });
    if (line) { log(line); onFire?.(decision, journal); }
  };
  const handle = setInterval(tick, intervalMs);
  if (typeof handle.unref === 'function') handle.unref();
  return { stop: () => clearInterval(handle) };
}

// --- CLI (operator-owed live watcher) ------------------------------------------------------------
//   node harness/lib/stage-watcher.mjs watch <journalPath> [stallMinutes]
const _invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (_invokedDirectly) {
  const [cmd, journalPath, stallMin] = process.argv.slice(2);
  if (cmd === 'watch' && journalPath) {
    const fs = await import('node:fs');
    // Guard a non-numeric / non-positive stallMinutes: Number('abc')=NaN would make `sinceMs > NaN` always
    // false, so the watcher would SILENTLY never fire. Fail loud instead (reviewer LOW).
    let stallMs = DEFAULT_STALL_MS;
    if (stallMin !== undefined) {
      const mins = Number(stallMin);
      if (!Number.isFinite(mins) || mins <= 0) {
        // eslint-disable-next-line no-console
        console.error(`[stage-watcher] invalid stallMinutes "${stallMin}" — must be a positive number`);
        process.exit(2);
      }
      stallMs = mins * 60 * 1000;
    }
    // eslint-disable-next-line no-console
    console.log(`[stage-watcher] watching ${journalPath} (stall ${stallMs}ms, interval ${DEFAULT_INTERVAL_MS}ms) — Ctrl-C to stop`);
    runWatcher(journalPath, { stallMs, readFile: (p) => JSON.parse(fs.readFileSync(p, 'utf8')) });
    setInterval(() => {}, 1 << 30); // keep the process alive for the operator
  } else {
    // eslint-disable-next-line no-console
    console.error('usage: node harness/lib/stage-watcher.mjs watch <journalPath> [stallMinutes]');
    process.exit(2);
  }
}
