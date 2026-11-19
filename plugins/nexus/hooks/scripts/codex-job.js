#!/usr/bin/env node
/**
 * Nexus codex-job: the one dispatch path for every Codex job, whichever seat starts it.
 *
 *   node codex-job.js start   --prompt-file <path> [--limit-minutes <n>] [--effort <level>] [--job-name discovery|audit|general] [--label <text>] [--kind <kind>] [--record <path>]
 *   node codex-job.js start   --prompt-file <path> --kind seat --seat <role> --unit <unit> --tree <absolute path> --slug <slug> [--questions] [--skills <a,b>] [--other-work <file>] [--spawned] [--limit-minutes <n>] [--effort <level>]
 *   node codex-job.js wait    --job <id> --deadline <iso> [--started <iso>] [--max-seconds <n>]
 *   node codex-job.js collect --job <id> --deadline <iso> [--started <iso>] [--kind review|done-check|research|panel|mining|helper|seat]
 *   node codex-job.js watch   --job <id> --deadline <iso> [--started <iso>] [--kind <kind>] --out <path>
 *   node codex-job.js jobs    --label <text>
 *   node codex-job.js sweep
 *   node codex-job.js seat-release --tree <absolute path> [--close]
 *   node codex-job.js seat-check
 *   node codex-job.js seat --role <role> --slug <slug> [--tree <absolute path>] [--spawned]
 *
 * THE CRITIC-ROUND SCHEDULE. A `start` labelled `{slug} {spec-review|plan-review} round {n}` is
 * checked by lib/round-gate.js after its arguments are validated and before anything is written: a
 * round the schedule does not allow prints `{"refused": true, "reason": …}` and exits 0, starting no
 * job and writing no intent line. Round 3 reads the record named by --record; a round 3 without it is
 * refused, naming the flag. The owner-ordered line in the brief lets any round through. Any other
 * label passes untouched, and an error inside the check passes too.
 *
 * Every call prints one JSON object on stdout and exits 0 on every handled outcome — an unavailable
 * Codex, a failed or cancelled job, a job cut off at its limit. Exit 2 is reserved for a call the
 * helper cannot act on (a missing argument, a prompt file that does not exist, an unknown --kind),
 * printed as `{error}`.
 *
 * A JOB A LATER SESSION CAN FIND. The companion's job records are per working directory and no session
 * keeps another's job id, so a session started after one ended could not reach its jobs. `start`
 * appends an intent line to `.claude/audit/codex-jobs.jsonl` in the session root before it calls the
 * companion — its --label, or null without one — then the job id, or `unstarted` when no companion was
 * found to call. A labelled intent it cannot write starts no job, `unavailable`; an unlabelled one
 * starts the job anyway and adds `recordError`. A companion call that returns no id leaves the intent
 * standing, since its worker may already run; so does an id line it cannot write, which adds
 * `recordError`. `jobs --label` prints every job recorded under exactly that label, newest first:
 * `recorded` with its id, `started, id not recorded` for an intent with neither, or `none`, a missing
 * record file included; a record it cannot read whole is `unreadable`. --kind is validated as
 * `collect` validates it and recorded. A `collect` or `watch` that returns `completed`, `failed` or
 * `cancelled` for a job the record holds appends one `end` line — its label, the job id, when it ended,
 * the state, for a failed or cancelled job its reason, and `codexSession` where the companion's result
 * names a `Codex session ID:` — once per job, so every job's run time can be read
 * back and its failures counted by cause; a job the record does not hold, a
 * companion not found, or a job still running writes none, and `jobs --label` reads past the line.
 *
 * CLOSING FORGOTTEN SERVERS. The Codex plugin keeps one background server per folder and, when its
 * connect check on it fails, starts another without ending the old one. `start`, before it calls the
 * companion, and a `collect` whose job ended — read as completed, failed or cancelled, or cut with the
 * cancel confirmed — end the job's folder's forgotten servers (lib/codex-servers.js), a seat job's tree
 * or else the session root: those whose pid file
 * is gone and that no Codex record names, and only while no Codex job runs in the folder, this
 * collect's own worker left out. The recorded server stays; the Codex plugin stops it when the session
 * ends. Each such call prints `serversClosed`; a close that fails adds `serversNote` and never changes
 * the job's state, verdict, output or early flag. `sweep` does the same for every folder on the
 * machine and prints one row per folder — closed, kept, and why kept — with the total. Every close
 * that ends servers appends one `close` line: when, the folder, how many, their ages in minutes, and
 * the trigger, `start`, `collect`, `sweep` or `seat-release`.
 *
 * RUN FROM THE SESSION ROOT. The Codex companion keeps its job records per working directory, so
 * every subcommand runs from the session root and its record. A seat job alone names another folder:
 * the companion is told the job's tree with `--cwd` at `start` and at every later call — status,
 * result, cancel — read back from the record, since a job started for another folder is found only
 * with that folder. Every other kind sends no `--cwd`, and a review of a worktree names the worktree
 * in its brief.
 *
 * A SEAT JOB. `--kind seat` starts one unit of a pipeline seat's work (lib/codex-seat.js): the
 * companion is told the tree as its folder, the tree is the project root of everything the job runs
 * (`CLAUDE_PROJECT_DIR`), and the label is built as `{slug} seat {role} {unit}`, then the model where
 * the role's entry names one. Its model and effort come from the role's seat setting
 * (lib/model-presets.js `seats`) in a helper job entry's place. Every start, `--questions` included,
 * is refused where the role's row allows no seat (no row does today: lib/codex-entry.js). A writing start — any but `--questions` — also checks
 * its own other conditions whatever an earlier call said: its entry is a usable seat setting, the
 * call carries no `--spawned`, and no campaign gear names the role's author model. One that fails
 * prints `{refused: true, reason}` and starts nothing.
 * Its limit is --limit-minutes raised to the repo's Codex limit where shorter. Before the companion is
 * called the start takes the tree: one reservation file per tree under the seat folder, made so only
 * one caller can make it; a tree another seat job holds is `refused`, naming that job. A start that
 * got no job id gives the tree back once nothing of it — the tree's companion task and worker processes, its
 * servers and what runs under them — runs there, after ending those servers while no other Codex job runs there,
 * else keeps it (`treeHeld`); a `collect` gives it back only once the job's end is confirmed (THE STOP). A job whose id the
 * reservation could not be given still holds it by its intent, and the start adds `recordError`. The intent line
 * adds the tree, the seat, the unit and the write option, and keeps the slug, `--skills`, the
 * `--other-work` file's paths and the files git showed as uncommitted before the job.
 * `seat-release --tree` ends that folder's Codex servers, the recorded one included, while no Codex
 * job runs there, and prints how many; it gives back a tree held by a job whose end was not confirmed
 * once that end is confirmed — running the safety copy's look and the checks first, as a confirming `collect`
 * does — or by a start that got no job id once nothing of it runs (`released`, else `held` with
 * `heldReason`). A held tree's servers are ended only inside that confirmation, after the look that reads what runs
 * under them, or once it is confirmed; a tree still held keeps them. Only with `--close`, while no seat job holds the tree, does it drop the tree's safety copies
 * (`copiesDropped`) — none where this same call found a gone feature file (`copiesKept`).
 *
 * THE SAFETY COPY. Before a seat job with the write option starts, every uncommitted file git shows
 * in the tree — changed or untracked, each untracked file by itself, never an ignored one — is copied
 * under the seat folder (lib/seat-copy.js), and an earlier copy of the tree whose feature files are now
 * committed is dropped; a copy that cannot be made, or a tree whose uncommitted files git cannot list, starts
 * nothing, `unavailable`. `--other-work` names the other work in the tree, one path or folder per line. Once,
 * by the call that confirms the job's end (THE STOP), it looks
 * only for copied files that are gone: other work is put back, other work that changed is left as it
 * is, a gone feature file is left gone with its copy kept, and no file that exists is written over.
 * It returns the three lists as `safetyCopy` and records them in one `copy` line. A `--questions` job
 * gets no copy.
 *
 * THE SEAT'S RECORDS. No Nexus hook runs inside Codex, so the helper writes in the session root what the hooks
 * write for a Claude seat (lib/seat-records.js), each with the coordinating session's id and phase token. Once a
 * seat start has its job id: one skill-log line per `--skills` entry, its agent the seat's role and `via:
 * "brief"`, and one `spawn` row in the hand-back log whose target is the role. When `collect` finds the job ended:
 * one `handback` row, with the end line, its agent id `codex-{job id}` — both rows marked `engine: "codex"`; the
 * job's step-run records in the tree's verify log, carried into the session root's once (`stepRunsCarried`) —
 * only those of the seat's identity, `codex-seat-{role}`, whose own tree is the job's tree, written after its
 * intent, with the session's token where theirs is empty, and none where the tree is the session root; and the
 * job's `minutes`. A `seat-release` that confirms a held end carries the step-run records written since once more.
 * A record that cannot be written adds `recordsNote` and never changes the job's outcome.
 *
 * THE CHECKS AFTER A SEAT JOB. The call that confirms a seat job's end — a `collect`, or `seat-release` for a held
 * end — also records, once, in the session root's violations log, what a hook would have recorded for a Claude
 * seat (lib/seat-checks.js), and sends nothing back: each command in Codex's own session record of the job that the
 * test-entry gate would refuse on that seat, as an unblocked `test-entry` line — or one `seat-unread` line where
 * that record cannot be found or read whole; for a seat whose row lists the compare, each file the job changed
 * that lies under `.claude/`, is another role's artifact, or lies outside the session's live approved set; and
 * for a completed fix round, a round block with no class-check line. It returns `seatChecks`: those results, the
 * units whose step runs passed two (`stepRunsOverTwo`), and whether the approved-set compare ran. A `collect` that
 * leaves the end unconfirmed runs neither these nor the safety copy's look, and says so (`checksWait`).
 *
 * THE SANDBOX CHECK. A writing seat start also needs a standing pass of the machine's sandbox check
 * (lib/seat-check.js): none, a failed one, or one made under another machine name, Codex version or
 * Codex config hash prints `refused` with the reason. `seat-check` runs it: in a throwaway repository
 * under the seat folder, one short write job in its main checkout and one in a linked worktree, each
 * started and waited on as a seat job and told to run the probe script the helper put there. The
 * helper reads the probe's result file and the repository — never the model's message — and records
 * the result whole, then ends both folders' Codex servers. A standing pass is reused; one check runs at
 * a time on the machine, and a caller that finds one running waits for its record. The check's own two
 * jobs are the one writing start made without a pass. `seat` prints whether a role's seat runs on Codex
 * now — the engine; the model and effort the seat runs on, a Codex job's or, on Claude, the role's own
 * without its Codex entry (the gear's where a gear decided), with the entry's Codex settings beside it as
 * `codexModel` and `codexEffort`; one disclosure line naming the seat, the reason and that model; and `read`,
 * the rule section the coordinator follows for the unit. It never runs the check: with no
 * usable record it answers that the check is owed and gives the `seat-check` call. It never refuses
 * and asks nothing.
 *
 * READ-ONLY BUT FOR A SEAT. `--write` is sent for a seat job without `--questions` and for the
 * sandbox check's two jobs, and for nothing else. `start` sends `--model` only from a helper job's own `codexModel` or a seat's: wherever
 * none names one, the user's Codex config is the model dial. It
 * sends `--effort` only where the dispatch's own `--effort` or, without one, the repo's
 * `codex.effort` names a Codex level — or, under a gear, where the session's active gear context
 * names one for Codex's effort (lib/gears.js decides which wins: a campaign's gear above the repo
 * setting, the repo setting above the feature's gear); a dispatch `--effort` outside the levels
 * starts no job, so a run asked to go lower never runs at the configured level. `--job-name` reads
 * that job's `{model: codex, effort, codexModel}` entry in the repo's `jobs`, with no other key, read by
 * lib/codex-entry.js, which alone knows the entry's keys, the Codex levels and the name's shape: its
 * effort is the repo setting's first choice, above `codex.effort`, and, under `--kind helper` with a
 * string `model`, its `codexModel` — a name of letters, digits, `.`, `_`, `:` and `-` opening with a
 * letter or digit — is sent as `--model` whatever the effort; a name of any other shape is not sent
 * and is named on stderr. `start` prints
 * the effort and the model it sent, and the intent line records the model.
 *
 * ONE LIMIT, AND A STALL CHECK. `codex.timeLimitMinutes` (default 25) runs from the job's start. Inside
 * it the job's own log decides: 6 minutes with no new `[ISO time]` line is a stall — measured on 84 jobs,
 * no completed job went quiet longer than 5.6 minutes and every stuck one went quiet 8 or more. Quiet
 * counts from the newest timestamped line, or from --started when the log exists and is empty; a log the
 * helper cannot use (no path, missing, unreadable, no parsable timestamp) never makes a stall, and the
 * limit stays the backstop. `wait` reads the state once without waiting, for the log's path, then waits
 * at most until a stall would fall due, and reports `stalled` with the quiet minutes. Only `collect`
 * cuts a stall: it re-reads state and log itself, and a job that wrote again is still running.
 * `wait` returns within --max-seconds (default 100) plus a 15-second grace for a hung companion,
 * inside the Bash tool's default two-minute timeout, so no caller needs a timeout argument; past the
 * deadline it adds `deadlinePassed` to an unfinished job's state, since an agent has no clock, and keeps
 * waiting up to --max-seconds, so a dispatcher waiting on the round's other readers can call it again.
 * A status read that fails — the companion erred, timed out or knew no job — is `unknown` with
 * `readError`, never a job failure: the caller keeps waiting to the deadline, and a fast error still
 * takes the whole wait. At the deadline `collect` re-reads the state, allowing that read 30 seconds of
 * its own. A job that just finished is taken; otherwise `collect` cancels it and returns the job's
 * whole log as `partial`; the caller runs its fallback as well. A later `collect` of a job the record
 * shows this helper cut returns that log as `partial` again, with the cut's reason.
 *
 * A HELPER JOB. For the `helper` and `seat` kinds silence with the worker alive is not a stall: the job
 * waits to its limit. A worker gone while the job reads `running` fails the job at once, unless the
 * status read again has the job ended; a re-read that fails is a read error, as above. `wait` has no
 * --kind and reads the kind from the job record; a job the record does not hold keeps the stall rule.
 * A `collect` with no --kind reads a seat job's kind from the record, and any other job's as `review`.
 *
 * WATCH. `watch` runs what a session's `wait` then `collect` loop runs, in one process: the same cut at
 * the limit, early flag and end line. Without --kind it reads the kind from the job record, else
 * `review`. It writes the job's output, or a cut job's partial, to --out and prints one line: the
 * state, the path, the size, any reason, any `earlyFailure`, and `partial` for a cut job — never the
 * output. A file it cannot write adds the reason; `collect` still returns the job's result, or a cut
 * job's partial.
 *
 * A REAL REPORT. For the kinds that take any output — research, panel, mining, helper and seat — the companion's page for a missing payload, its
 * line for an empty final message and the session lines it appends are no output.
 *
 * THE EARLY FLAG. With --started, a job failure — `unavailable` at start, `failed`, `cancelled` read
 * as terminal, a completed job with no usable output for its --kind — returned before the start plus
 * the window (6 minutes, or the whole limit where that is shorter) carries `earlyFailure`; a stall
 * carries it only when `collect` sees it before the window plus one minute of companion setup. The time
 * the helper sees the failure governs, less the time `start` spent closing forgotten servers, so no
 * caller keeps a clock. No --started, no flag.
 *
 * THE STOP. `collect` runs the companion's own `cancel` first (40 s), with Git Bash path conversion off
 * so the companion's `taskkill /PID` switches arrive intact. A cancel that fails is judged by the
 * process, not by the cancel's exit code: after the re-read, the record's pid gone, or held by another
 * program, reads as stopped; on Windows a pid whose command line names this job's `task-worker` is
 * ended here with `taskkill /PID {pid} /T /F`, no shell, then checked again. A lookup that errors, runs
 * past its 5 seconds or returns an empty command line is tried once more; two such are no answer, which
 * never reads as stopped. Only a job still running — by its process — is reported as that state with
 * the cancel's error, never as `cancelled`. Node's own warning lines never reach a `reason`. A failed
 * or cancelled job whose record carries no error message is reasoned from the last lines of its log.
 *
 * A SEAT JOB'S STOP IS CONFIRMED before anything else writes in its tree (lib/seat-end.js): its commands
 * run under the tree's Codex server, not under the worker, and a cancel the companion reports as done may
 * not have stopped the turn. The job's processes are one owned set — its workers, the tree's servers, what runs
 * under them and, off Windows, what shares their sessions — known by pid and creation time, read before anything is
 * ended and only ever grown, and an end is confirmed only when the whole set is gone. Any end but a completed one
 * first ends the worker's tree and the tree's servers — the servers only while no other Codex job runs there; where
 * a server is left, the end also needs the cancel's reply that the turn was interrupted or the job's Codex session
 * record showing the turn ended, which never confirms alone. An unconfirmed end's still-running processes, owned
 * sessions and worker pid go on the end line, each later try that still cannot confirm it adds what it found in one
 * `held` line, and every later try counts all of them as the job's; a record that cannot be read holds the tree,
 * and a look whose line cannot be written leaves what it found on the tree's reservation. `collect` then works in this
 * order: the end (`end`, `endReason`), the records, and — on a confirmed end only — the safety copy's look and
 * the checks; it returns whether a fallback is owed and why
 * (`fallback`, `fallbackReason`: the job failed, lost its worker, was cut or cancelled, or completed with no
 * hand-back line of the role's own) and `finishedSteps` — each step whose block in implementation.md ends
 * with `**Step done:** {n}` and whose latest step-run record of this job, in its tree, counts as passing. The
 * end line records the end, the fallback and their reasons. A confirmed end gives the tree back; an
 * `unconfirmed` one keeps it, naming the process or the missing proof, and a later `collect` or
 * `seat-release` that finds the set gone confirms it then, with one `confirm` line. Ending the servers never
 * drops the safety copy.
 *
 * A WORKER THAT NEVER TOOK THE JOB. The companion starts its background worker before it saves the
 * job, and a worker that reads first exits: the job stays `queued` with no process behind it. `start`
 * loads `codex-worker-wait.js` into the companion through NODE_OPTIONS, after whatever the shell set
 * there, and the worker then waits for its launcher to exit before it reads. Where a worker is lost
 * all the same, `wait` and `collect` read a `queued` job whose pid is gone, or held by another
 * program, as `failed` — a job failure, early flag included — and `collect` has the companion cancel
 * the record, only while no process holds the pid. A lookup with no answer never reads as lost, and
 * the stall check stays the backstop.
 *
 * FINDING THE COMPANION. `NEXUS_CODEX_COMPANION` names it directly. Otherwise
 * `installed_plugins.json` under CLAUDE_CONFIG_DIR (or ~/.claude), the first `codex@` key: the entry
 * installed for this working directory first, else the user-scope entry, the highest version
 * within the chosen group. Project paths compare case-folded on Windows, whose paths are.
 *
 * ONE JOB FOLDER. The companion keeps its jobs under CLAUDE_PLUGIN_DATA, which the Bash tool's shell
 * has and the PowerShell tool's has not, so a job started in one was unknown in the other. A shell
 * without the variable is given the Codex plugin's own data folder, `plugins/data/{id}` under the
 * config directory, the id being the registry key with every character outside letters, digits, `_`
 * and `-` turned into `-`. A companion named directly gets no folder.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_LIMIT_MINUTES = 25;
const DEFAULT_MAX_SECONDS = 100;
const STATUS_GRACE_MS = 15000;
const COLLECT_STATUS_MS = 30000;
const CANCEL_MS = 40000;
const QUIET_LIMIT_MS = 6 * 60000;
const SETUP_ALLOWANCE_MS = 60000;
const WAIT_FLOOR_MS = 1000;
const LOOKUP_MS = 5000;
const LOOKUP_TRIES = 2;
const READ_SLACK_MS = LOOKUP_MS * LOOKUP_TRIES + 1000;
const KILL_MS = 10000;
const RECHECK_MS = 2000;
const codexEntry = require('./lib/codex-entry');
const seats = require('./lib/codex-seat');
const seatCheck = require('./lib/seat-check');
const seatCopy = require('./lib/seat-copy');
const seatRecords = require('./lib/seat-records');
const seatChecks = require('./lib/seat-checks');
const seatEndLib = require('./lib/seat-end');
const { readRoundToken } = require('./lib/round-token');
const LEVELS_TEXT = codexEntry.LEVELS.join(', ');
const KINDS = ['review', 'done-check', 'research', 'panel', 'mining', 'helper', 'seat'];
const ANY_OUTPUT_KINDS = new Set(['research', 'panel', 'mining', 'helper', 'seat']);
const HELPER_KIND = 'helper';
const SEAT_KIND = 'seat';
const SILENT_KINDS = new Set([HELPER_KIND, SEAT_KIND]);
const SEAT_SECTION = 'codex-dispatch.md § Seat job';
const JOB_NAMES = ['discovery', 'audit', 'general'];
const RECORD_REL = '.claude/audit/codex-jobs.jsonl';
const TERMINAL = new Set(['completed', 'failed', 'cancelled']);
const WORKER_WAIT = path.join(__dirname, 'codex-worker-wait.js');
const PARTIAL_REASON = 'partial — Codex cancelled at the limit';
const STALL_REASON = 'stalled — no Codex output for 6 minutes';
const LOST_WORKER_REASON = 'the Codex worker exited before it took the job';
const GONE_WORKER_REASON = 'the Codex worker exited while the job was running';
const SESSION_LINE = /^Codex session ID:[ \t]*(\S+)[ \t]*\r?$/gm;
const SESSION_TRAILER = /\r?\n?Codex session ID:[^\r\n]*\r?\nResume in Codex:[^\r\n]*\r?\n?$/;
const NO_FINAL_MESSAGE = 'Codex did not return a final message.';
const NO_VERDICT = 'no verdict returned';
const NO_OUTPUT = 'no output returned';
const TAIL_LINES = 5;
const TAIL_CHARS = 400;
const LOG_TIME = /^\[(\d{4}-\d{2}-\d{2}T[^\]\s]+)\]/;
const NODE_WARNING = /^\(node:\d+\) (?:\[[A-Z]+\d+\] )?[A-Za-z]*Warning: /;
const DONE_CHECK_VERDICT = /^\s*(?:[-*+]\s+)?\*\*Verdict: (?:(PASS)\*\*|(FAIL)\b)/;
const BOLD_VERDICT = /^\s*\*\*(NO-GO|GO)(?:[.:!]|\s+[—–-]\s[^*]*)?\*\*[.:!]?\s*$/;

function print(obj) { process.stdout.write(JSON.stringify(obj) + '\n'); }
function warn(line) { process.stderr.write(line + '\n'); }
function sleepUntil(t) {
  const ms = t - Date.now();
  if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function usage(message) {
  print({ error: message });
  process.exitCode = 2;
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) opts[a.slice(2)] = true;
    else { opts[a.slice(2)] = next; i++; }
  }
  return opts;
}

const isPositive = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

function readConfigBlock(root, key) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'nexus-agents.json'), 'utf8'));
    return cfg && typeof cfg[key] === 'object' && cfg[key] ? cfg[key] : {};
  } catch {
    return {};
  }
}

const readCodexConfig = (root) => readConfigBlock(root, 'codex');

function resolveLimit(codex, flag) {
  let limit = DEFAULT_LIMIT_MINUTES;
  if ('timeLimitMinutes' in codex) {
    if (isPositive(codex.timeLimitMinutes)) limit = codex.timeLimitMinutes;
    else warn(`codex.timeLimitMinutes is ${JSON.stringify(codex.timeLimitMinutes)}, not a positive number of minutes — using ${limit}.`);
  }
  if (flag !== undefined) {
    const n = Number(flag);
    if (flag !== true && isPositive(n)) limit = n;
    else warn(`--limit-minutes is ${JSON.stringify(flag)}, not a positive number of minutes — using ${limit}.`);
  }
  return limit;
}

// A seat job's limit is the dispatch's, never shorter than the repo's Codex limit.
function seatLimit(codex, flag) {
  const repo = resolveLimit(codex, undefined);
  return flag === undefined ? repo : Math.max(repo, resolveLimit({ timeLimitMinutes: repo }, flag));
}

function repoEffort(codex) {
  if (!('effort' in codex)) return null;
  if (codexEntry.effortLevel(codex.effort)) return codex.effort;
  warn(`codex.effort is ${JSON.stringify(codex.effort)}, outside the Codex levels (${LEVELS_TEXT}) — not sent.`);
  return null;
}

// This job's Codex entry in the repo's `jobs` (lib/codex-entry.js), or null.
function jobEntry(root, name) {
  if (name === undefined) return null;
  const entry = readConfigBlock(root, 'jobs')[name];
  return codexEntry.codexEntry(entry) ? entry : null;
}

function jobEffort(entry, name) {
  if (!entry || !('effort' in entry)) return null;
  if (codexEntry.effortLevel(entry.effort)) return entry.effort;
  warn(`jobs.${name}.effort is ${JSON.stringify(entry.effort)}, outside the Codex levels (${LEVELS_TEXT}) — not sent.`);
  return null;
}

// Shape only: a name that cannot be read as a flag or carry a space. Which names exist is Codex's to answer.
function jobModel(entry, name, kind) {
  if (kind !== HELPER_KIND || !entry || typeof entry.model !== 'string' || !('codexModel' in entry)) return null;
  if (codexEntry.modelName(entry.codexModel)) return entry.codexModel;
  warn(`jobs.${name}.codexModel is ${JSON.stringify(entry.codexModel)}, not a Codex model name (letters, digits, '.', '_', ':' and '-', opening with a letter or digit) — not sent.`);
  return null;
}

// A seat setting's effort and model as sent; a value the entry names outside the levels or the shape is
// not sent and is named on stderr.
function seatEffort(setting, role) {
  if (!setting || !('effort' in setting.entry)) return null;
  if (setting.effort) return setting.effort;
  warn(`${role}.effort is ${JSON.stringify(setting.entry.effort)}, outside the Codex levels (${LEVELS_TEXT}) — not sent.`);
  return null;
}

function seatModel(setting, role) {
  if (!setting || !('codexModel' in setting.entry)) return null;
  if (setting.codexModel) return setting.codexModel;
  warn(`${role}.codexModel is ${JSON.stringify(setting.entry.codexModel)}, not a Codex model name (letters, digits, '.', '_', ':' and '-', opening with a letter or digit) — not sent.`);
  return null;
}

// Row 6 of the gear resolver for this session's active gear context, the dispatch's --effort as its
// explicit rung. A value naming no level (`not lowered`, `as today`) sends the repo's setting, else
// none; a resolver that cannot run leaves today's rule. A job's entry — a helper job's, or a seat's
// setting — is a repo setting: under a campaign's gear and over the feature's. `entryEffort` is read
// only where the dispatch names no --effort.
function resolveEffort(codex, opts, root, entryEffort) {
  const explicit = 'effort' in opts ? opts.effort : undefined;
  const entry = explicit === undefined ? entryEffort() : null;
  try {
    const gears = require('./lib/gears');
    const { resolveDeclaredTree } = require('./lib/worktree-target');
    const session = String(process.env.CLAUDE_CODE_SESSION_ID || '');
    const v = gears.valueOf({ setting: 6, explicit, root, tree: resolveDeclaredTree(root, session), session, env: process.env });
    const geared = v.source === 'campaign' || (v.source === 'gear' && !entry);
    if (geared && Object.hasOwn(gears.EFFORT_LEVELS, v.value)) return gears.EFFORT_LEVELS[v.value];
  } catch { /* today's rule below */ }
  if (explicit !== undefined) return explicit;
  return entry || repoEffort(codex);
}

function versionKey(v) {
  return String(v || '0').split('.').map((p) => parseInt(p, 10) || 0);
}

function compareVersionsDesc(a, b) {
  const x = versionKey(a.version);
  const y = versionKey(b.version);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (y[i] || 0) - (x[i] || 0);
    if (d) return d;
  }
  return 0;
}

let codexDataDir = null;

function findCompanion(cwd) {
  if (process.env.NEXUS_CODEX_COMPANION) return { path: process.env.NEXUS_CODEX_COMPANION };
  const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(path.join(configDir, 'plugins', 'installed_plugins.json'), 'utf8'));
  } catch {
    return { unavailable: 'the Codex plugin is not installed (no installed-plugins registry)' };
  }
  const plugins = (registry && registry.plugins) || registry || {};
  const key = Object.keys(plugins).find((k) => k.startsWith('codex@'));
  const entries = key && Array.isArray(plugins[key]) ? plugins[key].filter((e) => e && e.installPath) : [];
  const win = process.platform === 'win32';
  const norm = (p) => { const r = path.resolve(String(p || '')); return win ? r.toLowerCase() : r; };
  const here = norm(cwd);
  const forHere = entries.filter((e) => e.projectPath && norm(e.projectPath) === here);
  const pool = forHere.length ? forHere : entries.filter((e) => e.scope === 'user');
  if (!pool.length) return { unavailable: 'the Codex plugin is not installed for this directory' };
  const chosen = pool.slice().sort(compareVersionsDesc)[0];
  const script = path.join(chosen.installPath, 'scripts', 'codex-companion.mjs');
  if (!fs.existsSync(script)) return { unavailable: `the Codex companion is missing at ${script}` };
  if (!process.env.CLAUDE_PLUGIN_DATA) codexDataDir = path.join(configDir, 'plugins', 'data', key.replace(/[^A-Za-z0-9_-]/g, '-'));
  return { path: script };
}

// NODE_OPTIONS for the companion's `task` call: the worker wait, after whatever the shell set.
function workerWaitEnv() {
  if (!fs.existsSync(WORKER_WAIT)) return {};
  const flag = `--require "${WORKER_WAIT.replace(/[\\"]/g, (c) => `\\${c}`)}"`;
  const own = process.env.NODE_OPTIONS;
  return { NODE_OPTIONS: own ? `${own} ${flag}` : flag, NEXUS_CODEX_WORKER_WAIT: flag };
}

// Drops Node's own warning lines, and the `(Use \`node --trace-…` hint right after one.
function dropWarnings(text) {
  const kept = [];
  let afterWarning = false;
  for (const line of String(text || '').split(/\r?\n/)) {
    if (NODE_WARNING.test(line)) { afterWarning = true; continue; }
    if (afterWarning && line.startsWith('(Use `node --trace-')) { afterWarning = false; continue; }
    afterWarning = false;
    kept.push(line);
  }
  return kept.join('\n').trim();
}

// The tree the record names for the job a wait, collect or watch reads, sent as --cwd on every call
// after `start` (which sends its own). Null for a job of any other kind.
let jobTree = null;
// The reply of a cancel this call made, read where a seat job's end must be confirmed.
let cancelReply = null;

function companion(script, args, timeoutMs, extraEnv = {}) {
  const folder = jobTree && args[0] !== 'task' ? ['--cwd', jobTree] : [];
  const res = spawnSync(process.execPath, [script, ...args, ...folder], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(codexDataDir ? { CLAUDE_PLUGIN_DATA: codexDataDir } : {}),
      MSYS_NO_PATHCONV: '1',
      MSYS2_ARG_CONV_EXCL: '*',
      ...extraEnv,
    },
    timeout: timeoutMs,
    windowsHide: true,
  });
  const ok = res.status === 0 && !res.error;
  const reason = dropWarnings(res.stderr) || (res.error && res.error.message) || `the Codex companion exited ${res.status}`;
  let json = null;
  try { json = JSON.parse(res.stdout); } catch { /* text output, or none */ }
  return { ok, stdout: res.stdout || '', json, reason };
}

const windowMs = (limitMs) => Math.min(QUIET_LIMIT_MS, limitMs);

/** The critic-round schedule's refusal for a labelled spec or plan review round, or null (lib/round-gate.js). */
function roundRefusal(opts, promptFile) {
  try {
    const gate = require('./lib/round-gate');
    const parsed = gate.parseLabel(opts.label);
    if (!parsed || !parsed.kind) return null;
    const text = fs.readFileSync(promptFile, 'utf8');
    const record = typeof opts.record === 'string' && opts.record.trim() ? path.resolve(opts.record) : null;
    if (parsed.round === gate.LAST_ROUND && !record && !gate.ownerOrdered(text)) {
      return `critic round ${parsed.round} needs --record {the absolute path of the feature's review-critic.md}, the record the critic-round schedule is checked against — no job started`;
    }
    const verdict = gate.decide({
      round: parsed.round, kind: parsed.kind, text, readRecord: () => gate.readIfFile(record), recordName: record || 'the review record',
    });
    return verdict.refused ? `${verdict.reason} No job started.` : null;
  } catch {
    return null;
  }
}

function cmdStart(opts) {
  const callStart = Date.now();
  if (!opts['prompt-file'] || opts['prompt-file'] === true) return usage('start needs --prompt-file <path>');
  const promptFile = path.resolve(opts['prompt-file']);
  if (!fs.existsSync(promptFile)) return usage(`prompt file not found: ${promptFile}`);
  if ('effort' in opts && !codexEntry.effortLevel(opts.effort)) {
    return usage(`--effort is ${JSON.stringify(opts.effort)}, not one of the Codex levels (${LEVELS_TEXT}) — no job started`);
  }
  if ('kind' in opts && !KINDS.includes(opts.kind)) return usage(`--kind is ${JSON.stringify(opts.kind)}, not one of ${KINDS.join(', ')} — no job started`);
  if ('job-name' in opts && !JOB_NAMES.includes(opts['job-name'])) return usage(`--job-name is ${JSON.stringify(opts['job-name'])}, not one of ${JOB_NAMES.join(', ')} — no job started`);
  if ('label' in opts && (typeof opts.label !== 'string' || !opts.label.trim())) return usage('--label needs the text of the label — no job started');
  const seat = opts.kind === SEAT_KIND ? seatArgs(opts) : null;
  if (seat && seat.usage) return usage(seat.usage);
  const refusal = roundRefusal(opts, promptFile);
  if (refusal) return print({ refused: true, reason: refusal });
  const root = process.cwd();
  const codex = readCodexConfig(root);
  let setting = null;
  if (seat) {
    const decided = seats.seatDecision({ role: seat.role, root, tree: seat.tree, slug: seat.slug, spawned: seat.spawned });
    if (!decided.codex && (seat.write || decided.closed)) return print({ refused: true, reason: `${decided.reason} — no job started` });
    if (seat.write) {
      const machine = seatCheck.standing();
      if (machine.state !== 'pass') return print({ refused: true, reason: `${machine.reason} — no job started` });
    }
    setting = decided.setting || null;
  }
  const limit = seat ? seatLimit(codex, opts['limit-minutes']) : resolveLimit(codex, opts['limit-minutes']);
  const job = seat ? null : jobEntry(root, opts['job-name']);
  const effort = resolveEffort(codex, opts, root, () => (seat ? seatEffort(setting, seat.role) : jobEffort(job, opts['job-name'])));
  const model = seat ? seatModel(setting, seat.role) : jobModel(job, opts['job-name'], opts.kind);
  const label = seat ? seats.seatLabel({ slug: seat.slug, role: seat.role, unit: seat.unit, model }) : opts.label;
  let closeMs = 0;
  let giveBack = () => {};
  const unavailable = (why, servers = {}) => {
    giveBack();
    return print({
      ...(Date.now() - closeMs < callStart + windowMs(limit * 60000) ? { unavailable: why, earlyFailure: true } : { unavailable: why }),
      ...servers,
    });
  };

  const labelled = label !== undefined;
  let intent = `${Date.now().toString(36)}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  let recordError = null;
  const at = new Date();
  let reservation = null;
  if (seat) {
    const took = seats.reserveTree(seat.tree, { intent, label, sessionRoot: root, at: at.toISOString(), jobId: null });
    if (took.held) return print({ refused: true, reason: `${heldText(seat.tree, took.held)} — one seat job per tree; no job started` });
    if (took.error) return unavailable(took.error);
    reservation = took.file;
    const held = intent;
    giveBack = () => seats.releaseTree(seat.tree, { intent: held });
  }
  const uncommitted = seat ? seats.gitChanged(seat.tree) : null;
  if (seat && seat.write && uncommitted === null) {
    return unavailable('the tree\'s uncommitted files could not be listed — git status gave no answer — so no safety copy can be made');
  }
  let copy = null;
  if (seat && seat.write && uncommitted) {
    try {
      seatCopy.dropCommitted(seat.tree, uncommitted);
      copy = seatCopy.makeCopy({ tree: seat.tree, intent, unit: seat.unit, files: uncommitted, otherWork: seat.otherWork }).dir;
    } catch (err) {
      return unavailable(`the safety copy of the tree's uncommitted files could not be made: ${err.message}`);
    }
  }
  const seatFields = seat ? {
    tree: seat.tree, seat: seat.role, unit: seat.unit, write: seat.write, slug: seat.slug, skills: seat.skills,
    otherWork: seat.otherWork, changedBefore: uncommitted ? uncommitted.map((f) => f.path) : null, copy,
  } : {};
  const wroteIntent = appendRecord({
    type: 'intent', intent, label: labelled ? label : null, kind: opts.kind || null, model,
    at: at.toISOString(), deadline: new Date(at.getTime() + limit * 60000).toISOString(), ...seatFields,
  });
  if (wroteIntent !== true) {
    if (labelled) return unavailable(wroteIntent);
    recordError = wroteIntent;
    intent = null;
  }
  const unstarted = (why) => {
    if (intent) appendRecord({ type: 'unstarted', intent, reason: why });
    return unavailable(why);
  };
  const found = findCompanion(root);
  if (found.unavailable) return unstarted(found.unavailable);
  const closeStart = Date.now();
  const servers = closeServers('start', null, seat ? seat.tree : root);
  closeMs = Date.now() - closeStart;

  const startedAt = new Date();
  const res = launchTask(found, { promptFile, effort, model, tree: seat ? seat.tree : null, write: Boolean(seat && seat.write) });
  const jobId = res.json && res.json.jobId;
  if (!res.ok || !jobId) {
    const why = res.ok ? 'the Codex companion returned no job id' : res.reason;
    if (!seat) return unavailable(why, servers);
    const left = seatEndLib.confirmStart({ tree: seat.tree, closeTree: () => closeAndRecord('start', null, seat.tree, true) });
    if (left.end === 'confirmed') return unavailable(why, servers);
    giveBack = () => {};
    const kept = keepEvidence(seat.tree, left) ? '' : '; what this look found could not be kept on the tree\'s reservation';
    return unavailable(why, { ...servers, treeHeld: `${left.endReason}, so the tree is kept until seat-release finds nothing of this start running${kept}` });
  }
  if (reservation && !seats.updateReservation(reservation, { jobId })) {
    recordError = 'the tree\'s reservation could not be given the job id; the job is still found there by its intent';
  }
  const deadline = new Date(startedAt.getTime() + limit * 60000);
  const out = { jobId, startedAt: startedAt.toISOString(), deadline: deadline.toISOString(), effort: effort || null, model };
  if (seat) Object.assign(out, { label, tree: seat.tree, unit: seat.unit, write: seat.write, ...(copy ? { copy } : {}) });
  if (intent) {
    const wrote = appendRecord({ type: 'job', intent, jobId, startedAt: out.startedAt, deadline: out.deadline });
    if (wrote !== true) recordError = wrote;
  }
  if (recordError) out.recordError = recordError;
  if (seat) {
    const note = seatRecordsAt(() => {
      const marks = sessionMarks(root);
      seatRecords.writeSkillLines({ root, role: seat.role, skills: seat.skills, ...marks });
      seatRecords.writeStartRow({ root, role: seat.role, ...marks });
    });
    if (note) out.recordsNote = note;
  }
  print({ ...out, ...servers });
}

// The coordinating session's id and phase token, which a seat job's records carry as a Claude seat's do.
function sessionMarks(root) {
  const session = String(process.env.CLAUDE_CODE_SESSION_ID || '');
  return { session, token: readRoundToken(root, session) };
}

// A seat record that cannot be written is a note beside the job, never a change to its outcome.
function seatRecordsAt(write) {
  try {
    write();
    return null;
  } catch (err) {
    return `a seat record could not be written: ${err.message}`;
  }
}

// The companion's `task` call. A tree is sent as its folder and its project root; the write option only
// where asked, for a seat's writing unit or the sandbox check.
function launchTask(found, { promptFile, effort, model, tree, write }) {
  const args = ['task', '--background', '--prompt-file', promptFile, '--json'];
  if (effort) args.push('--effort', effort);
  if (model) args.push('--model', model);
  if (write) args.push('--write');
  if (tree) args.push('--cwd', tree);
  return companion(found.path, args, 120000, { ...workerWaitEnv(), ...(tree ? { CLAUDE_PROJECT_DIR: tree } : {}) });
}

const newIntent = () => `${Date.now().toString(36)}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

// One of the sandbox check's two jobs, started and waited on as any seat job is: its intent and id lines,
// the tree as its folder, the write option, its own limit.
function checkJob(found, name, dir, promptFile) {
  const intent = newIntent();
  const at = new Date();
  const limitMs = seatCheck.JOB_MINUTES * 60000;
  appendRecord({
    type: 'intent', intent, label: `seat-check ${name}`, kind: SEAT_KIND, model: null, at: at.toISOString(),
    deadline: new Date(at.getTime() + limitMs).toISOString(), tree: dir, seat: null, unit: 'seat-check', write: true,
  });
  const startedAt = new Date();
  const res = launchTask(found, { promptFile, effort: 'low', model: null, tree: dir, write: true });
  const jobId = res.json && res.json.jobId;
  if (!res.ok || !jobId) {
    const reason = res.ok ? 'the Codex companion returned no job id' : res.reason;
    appendRecord({ type: 'unstarted', intent, reason });
    return { state: 'unavailable', reason };
  }
  const deadline = startedAt.getTime() + limitMs;
  appendRecord({ type: 'job', intent, jobId, startedAt: startedAt.toISOString(), deadline: new Date(deadline).toISOString() });
  jobTree = dir;
  try {
    const out = watched({ job: jobId, deadline, started: startedAt.getTime(), found, kind: SEAT_KIND }, SEAT_KIND);
    return { state: out.state, reason: out.reason || null };
  } finally {
    jobTree = null;
  }
}

// Runs the check's two jobs and records what the repository shows, whole. Never throws.
function runCheck(facts) {
  const record = { result: 'fail', reason: null, ...facts, at: null, layouts: {} };
  const finish = (reason) => {
    Object.assign(record, { result: reason ? 'fail' : 'pass', reason, at: new Date().toISOString() });
    try { seatCheck.writeRecord(record); } catch (err) { record.recordError = `the check's record could not be written: ${err.message}`; }
    return record;
  };
  const found = findCompanion(process.cwd());
  if (found.unavailable) return finish(`the check could not run: ${found.unavailable}`);
  let layouts;
  const brief = path.join(seatCheck.checkDir(), 'brief.md');
  try {
    layouts = seatCheck.prepare();
    fs.writeFileSync(brief, seatCheck.BRIEF);
  } catch (err) {
    return finish(`the check could not run: ${err.message}`);
  }
  const failed = [];
  for (const { name, dir } of layouts) {
    let before;
    try { before = seatCheck.setUp(dir); } catch (err) { return finish(`the check could not run: ${err.message}`); }
    seatCheck.refreshLock();
    const job = checkJob(found, name, dir, brief);
    const read = seatCheck.judge(name, dir, before);
    record.layouts[name] = { ...read.reading, job: job.state, ...(job.reason ? { jobReason: job.reason } : {}) };
    failed.push(...read.failed);
  }
  for (const { dir } of layouts) {
    try { closeAndRecord('seat-release', null, dir, true); } catch { /* the next check's start tries again */ }
  }
  return finish(failed.length ? failed.join('; ') : null);
}

// The machine's sandbox check (lib/seat-check.js): a standing pass is reused; one check runs at a time,
// and a caller that finds one running waits for its record.
function cmdSeatCheck() {
  let facts;
  try {
    facts = seatCheck.machineFacts();
    const now = seatCheck.standing(process.env, facts);
    if (now.state === 'pass') return print({ ...now.record, reused: true });
    const waitStart = Date.now();
    for (;;) {
      if (seatCheck.takeLock().taken) break;
      sleepUntil(Date.now() + 250);
      while (seatCheck.lockHeld()) sleepUntil(Date.now() + 250);
      const after = seatCheck.standing(process.env, facts);
      if (after.record && after.state !== 'owed' && Date.parse(after.record.at) >= waitStart) return print({ ...after.record, waited: true });
    }
  } catch (err) {
    return print({ result: 'fail', reason: `the check could not run: ${err.message}`, ...(facts || {}) });
  }
  try {
    return print(runCheck(facts));
  } finally {
    seatCheck.releaseLock();
  }
}

// Whether a role's seat runs on Codex now, and why not; never runs the check and never refuses.
function cmdSeat(opts) {
  for (const flag of ['role', 'slug']) {
    if (typeof opts[flag] !== 'string' || !opts[flag].trim()) return usage(`seat needs --${flag}`);
  }
  const role = opts.role;
  const root = process.cwd();
  const tree = typeof opts.tree === 'string' && path.isAbsolute(opts.tree) ? path.resolve(opts.tree) : root;
  const decided = seats.seatDecision({ role, root, tree, slug: opts.slug, spawned: opts.spawned === true });
  const setting = decided.setting || null;
  const model = setting ? seatModel(setting, role) : null;
  const effort = setting ? resolveEffort(readCodexConfig(root), {}, root, () => seatEffort(setting, role)) : null;
  const claude = (reason, extra = {}) => {
    const own = decided.gear ? { model: decided.gear.model, effort: null } : seats.claudeSeat(role, root);
    const from = decided.gear ? `, from the campaign gear ${decided.gear.gear}` : '';
    const named = own.model ? ` (${own.model}${own.effort ? `, effort ${own.effort}` : ''}${from})` : '';
    return print({
      role, engine: 'claude', model: own.model, effort: own.effort, ...(setting ? { codexModel: model, codexEffort: effort } : {}),
      reason, ...extra, disclosure: `${role} seat: Claude${named} — ${reason}`, read: SEAT_SECTION,
    });
  };
  if (!decided.codex) return claude(decided.reason, decided.gear ? { gear: decided.gear.gear, claudeModel: decided.gear.model } : {});
  const found = findCompanion(root);
  if (found.unavailable) return claude(`Codex is not available: ${found.unavailable}`);
  if (seatCheck.lockHeld()) return claude('a sandbox check is running on this machine — call seat again once it has ended', { checkRunning: true });
  const machine = seatCheck.standing();
  if (machine.state === 'owed') {
    return claude(machine.reason, { checkOwed: true, check: `node "${__filename}" seat-check` });
  }
  if (machine.state !== 'pass') return claude(machine.reason);
  const sent = `${model || 'the user\'s default Codex model'}${effort ? `, effort ${effort}` : ''}`;
  return print({ role, engine: 'codex', model, effort, disclosure: `${role} seat: Codex (${sent}) — the repo's seat entry, the sandbox check passed on this machine`, read: SEAT_SECTION });
}

// A seat start's own flags, or `{usage}` naming what is missing.
function seatArgs(opts) {
  for (const flag of ['seat', 'unit', 'tree', 'slug']) {
    if (typeof opts[flag] !== 'string' || !opts[flag].trim()) return { usage: `a seat job needs --${flag} — no job started` };
  }
  if ('label' in opts) return { usage: 'a seat job\'s label is built from --slug, --seat and --unit, so --label is not taken — no job started' };
  if (!seats.isUnit(opts.unit)) return { usage: `--unit is ${JSON.stringify(opts.unit)}, not one of: ${seats.UNIT_TEXT} — no job started` };
  let isDir = false;
  try { isDir = path.isAbsolute(opts.tree) && fs.statSync(opts.tree).isDirectory(); } catch { /* not a folder */ }
  if (!isDir) return { usage: `--tree is ${JSON.stringify(opts.tree)}, not the absolute path of a folder that exists — no job started` };
  let otherWork = [];
  if ('other-work' in opts) {
    try {
      otherWork = fs.readFileSync(path.resolve(String(opts['other-work'])), 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    } catch (err) {
      return { usage: `--other-work names a file that cannot be read (${err.message}) — no job started` };
    }
  }
  const skills = typeof opts.skills === 'string' ? opts.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
  return {
    role: opts.seat, unit: opts.unit, tree: path.resolve(opts.tree), slug: opts.slug, write: opts.questions !== true,
    spawned: opts.spawned === true, skills, otherWork,
  };
}

function heldText(tree, held) {
  const by = held.jobId ? `seat job ${held.jobId}` : 'a seat job still starting';
  const label = held.label ? ` (${held.label})` : '';
  const from = held.sessionRoot ? `, started from ${held.sessionRoot}` : '';
  return `the tree ${tree} is held by ${by}${label}${from}`;
}

// After a writing seat job: the safety copy's look for gone files (lib/seat-copy.js), recorded as one
// `copy` line where it found any. Its outcome never changes the job's.
function safetyCopyAfter(jobId, dir) {
  let found;
  try {
    found = seatCopy.checkCopy(dir);
  } catch (err) {
    found = { restored: [], changed: [], featureGone: [], reason: `the safety copy could not be read: ${err.message}` };
  }
  const out = { copy: dir, ...found };
  if (found.restored.length || found.changed.length || found.featureGone.length || found.reason) {
    appendRecord({ type: 'copy', jobId, at: new Date().toISOString(), ...out });
  }
  return out;
}

// Ends a seat tree's Codex servers, the recorded one included, while no Codex job runs there. A tree still held is
// given back first where its end is confirmed, and its servers are ended only inside that confirmation, after the
// look that reads what runs under them, or once it is confirmed.
function cmdSeatRelease(opts) {
  if (typeof opts.tree !== 'string' || !path.isAbsolute(opts.tree)) return usage('seat-release needs --tree <the absolute path of the tree> [--close]');
  const tree = path.resolve(opts.tree);
  findCompanion(process.cwd());
  let res = null;
  const closeTree = () => {
    if (res) return res;
    try {
      res = closeAndRecord('seat-release', null, tree, true);
    } catch (err) {
      res = { closed: [], workspaces: [], reason: `the Codex server close failed: ${err.message}` };
    }
    return res;
  };
  const file = seats.reservationFile(tree);
  const reservation = seats.readReservation(tree);
  const unread = !reservation && fs.existsSync(file)
    ? { held: 'an unreadable reservation', heldReason: `the tree's reservation (${file}) cannot be read, so its holder cannot be told` }
    : null;
  const held = unread || (reservation ? releaseHeld(tree, reservation, closeTree) : {});
  if (!held.held) closeTree();
  const row = (res && res.workspaces[0]) || { kept: 0, why: [] };
  const goneHere = held.safetyCopy && held.safetyCopy.featureGone && held.safetyCopy.featureGone.length;
  const copiesDropped = opts.close === true && !goneHere && !fs.existsSync(file) ? seatCopy.dropAll(tree) : 0;
  const kept = opts.close === true && goneHere ? { copiesKept: 'this call found a gone feature file; its copy stays until it is put back or its removal committed' } : {};
  print({ tree, serversClosed: res ? res.closed.length : 0, kept: row.kept, why: row.why, ...held, copiesDropped, ...kept, ...(res && res.reason ? { reason: res.reason } : {}) });
}

// The job a reservation names, or — where its job id was never written — the job its intent got; `{unread}` where
// the record cannot say.
function jobOfReservation(held) {
  if (held.jobId) return { jobId: held.jobId };
  try {
    const job = readRecord().find((l) => l && l.type === 'job' && l.intent === held.intent);
    return { jobId: job ? job.jobId : null };
  } catch (err) {
    return { unread: `the Codex job record (${RECORD_REL}) cannot be read: ${err.message}` };
  }
}

// A tree still held by a seat job whose end was not confirmed, or by a start that got no job id: given back here
// once the end is confirmed — the safety copy's look and the checks run first, as the confirming collect runs them —
// else left held with why. A job still running keeps its tree.
function releaseHeld(tree, held, closeTree) {
  const ofHeld = jobOfReservation(held);
  if (ofHeld.unread) return { held: held.intent || 'a seat job', heldReason: ofHeld.unread };
  const jobId = ofHeld.jobId;
  if (!jobId) {
    const started = seatEndLib.confirmStart({ tree, closeTree, ...startEvidence(held) });
    if (started.end !== 'confirmed') {
      const kept = keepEvidence(tree, started) ? '' : '; what this look found could not be kept on the tree\'s reservation';
      return { held: 'a start that got no job id', heldReason: `${started.endReason}${kept}` };
    }
    seats.releaseTree(tree, { intent: held.intent });
    return { released: 'a start that got no job id' };
  }
  let end = null;
  try {
    end = readRecord().find((l) => l && l.type === 'end' && l.jobId === jobId) || null;
  } catch (err) {
    return { held: jobId, heldReason: `the Codex job record (${RECORD_REL}) cannot be read: ${err.message}` };
  }
  if (!end) return { held: jobId, heldReason: 'its job has not been collected as ended' };
  const plat = process.env.NEXUS_CODEX_PLATFORM || process.platform;
  const intent = recordedIntent(jobId);
  const thread = end.thread || end.codexSession || null;
  const confirmed = seatEndLib.confirmEnd({
    jobId, tree, byItself: end.state === 'completed', thread, since: intent && intent.at,
    workerPid: Number.isInteger(end.workerPid) ? end.workerPid : null, ...ownersOf(jobId, held),
    closeTree, kill: (pid) => require('./lib/codex-servers').defaultKill(pid, plat, process.env),
  });
  if (confirmed.end !== 'confirmed') {
    const lost = recordHeld(jobId, tree, confirmed);
    return { held: jobId, heldReason: lost ? `${confirmed.endReason}; ${lost}` : confirmed.endReason };
  }
  appendRecord({ type: 'confirm', jobId, at: new Date().toISOString(), end: 'confirmed', endReason: confirmed.endReason });
  const records = {};
  if (intent && intent.seat) {
    const root = process.cwd();
    const note = seatRecordsAt(() => {
      records.stepRunsCarried = seatRecords.carryStepRuns({ root, tree, role: intent.seat, since: intent.at, ...sessionMarks(root) });
    });
    if (note) records.recordsNote = note;
  }
  const done = finishSeat({ jobId, intent, state: end.state, output: thread ? `Codex session ID: ${thread}` : '', log: '' });
  seats.releaseTree(tree, { intent: held.intent });
  return { released: jobId, ...records, ...done };
}

// Ends forgotten Codex servers (lib/codex-servers.js) — this folder's, or with `workspace` null every
// folder's — and records one close line per folder where any ended. Whatever happens here, the job's
// own outcome stands: a failure, the module's loading included, is only a note beside it.
function closeAndRecord(trigger, excludeJob, workspace, all = false) {
  const { closeForgotten, defaultStateRoots } = require('./lib/codex-servers');
  const res = closeForgotten({ workspace, excludeJob, all, stateRoots: defaultStateRoots(codexDataDir) });
  const at = new Date().toISOString();
  for (const row of res.workspaces) {
    if (!row.closed) continue;
    const ages = res.closed.filter((c) => c.workspace === row.workspace).map((c) => c.ageMinutes);
    const wrote = appendRecord({ type: 'close', at, workspace: row.workspace, servers: row.closed, ages, trigger });
    if (wrote !== true && !res.reason) res.reason = wrote;
  }
  return res;
}

function cmdSweep() {
  findCompanion(process.cwd());
  let res;
  try {
    res = closeAndRecord('sweep', null, null);
  } catch (err) {
    res = { workspaces: [], reason: `the Codex server close failed: ${err.message}` };
  }
  const total = res.workspaces.reduce((t, w) => ({ closed: t.closed + w.closed, kept: t.kept + w.kept }), { closed: 0, kept: 0 });
  print(res.reason ? { workspaces: res.workspaces, total, reason: res.reason } : { workspaces: res.workspaces, total });
}

function closeServers(trigger, excludeJob, workspace = process.cwd()) {
  try {
    const res = closeAndRecord(trigger, excludeJob, workspace);
    return res.reason ? { serversClosed: res.closed.length, serversNote: res.reason } : { serversClosed: res.closed.length };
  } catch (err) {
    return { serversClosed: 0, serversNote: `the Codex server close failed: ${err.message}` };
  }
}

// The session root's record of Codex jobs, one JSON line each: an intent before the companion is
// called, then the job id — or `unstarted` where no companion was found — and a close line per folder
// whose forgotten servers were ended. Returns true, or why not.
function appendRecord(line) {
  const file = path.join(process.cwd(), RECORD_REL);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, `${JSON.stringify(line)}\n`);
    return true;
  } catch (err) {
    return `the Codex job record (${RECORD_REL}) could not be written: ${err.message}`;
  }
}

const readRecord = () => fs.readFileSync(path.join(process.cwd(), RECORD_REL), 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => JSON.parse(l));

function intentOf(lines, jobId) {
  const job = lines.filter((l) => l && l.type === 'job' && l.jobId === jobId).pop();
  return job ? lines.find((l) => l && l.type === 'intent' && l.intent === job.intent) : undefined;
}

// A record that cannot be read whole writes no end line: a collect never fails on its timing line. Returns
// the job's start and end times, `wrote` where this call appended the end line, or null where the record
// cannot say.
function recordEnd(jobId, state, reason, codexSession, extra = {}) {
  let lines;
  try {
    lines = readRecord();
  } catch {
    return null;
  }
  const intent = intentOf(lines, jobId);
  if (!intent) return null;
  const job = lines.filter((l) => l && l.type === 'job' && l.jobId === jobId).pop();
  const startedAt = job && job.startedAt;
  const before = lines.find((l) => l && l.type === 'end' && l.jobId === jobId);
  if (before) return { startedAt, endedAt: before.endedAt, wrote: false };
  const endedAt = new Date().toISOString();
  const why = reason && state !== 'completed' ? { reason } : {};
  const link = codexSession ? { codexSession } : {};
  const appended = appendRecord({ type: 'end', label: intent.label, jobId, endedAt, state, ...why, ...link, ...extra });
  return { startedAt, endedAt, wrote: appended === true, ...(appended === true ? {} : { writeError: appended }) };
}

// A seat job's end (lib/seat-end.js), while the job still holds its tree: confirmed or not, whether a fallback
// is owed, and the steps it finished. `fields` go to the collect's output, `line` onto its end line.
function seatEndOf(a, out, codexSession, s, log) {
  const intent = a.intent;
  const tree = intent.tree;
  const held = seats.readReservation(tree);
  const holds = holdsTree(held, a.job, intent);
  let before = null;
  try { before = readRecord().find((l) => l && l.type === 'end' && l.jobId === a.job) || null; } catch { /* read as none */ }
  const cut = out.reason === PARTIAL_REASON || out.reason === STALL_REASON;
  const plat = process.env.NEXUS_CODEX_PLATFORM || process.platform;
  const thread = seatChecks.threadIdOf(out.output, out.partial, codexSession ? `Codex session ID: ${codexSession}` : '', log())
    || (before && before.thread) || null;
  const recordPid = s.record && Number.isInteger(s.record.pid) ? s.record.pid : null;
  const workerPid = recordPid !== null ? recordPid : before && Number.isInteger(before.workerPid) ? before.workerPid : null;
  const confirmed = holds ? seatEndLib.confirmEnd({
    jobId: a.job, tree, byItself: out.state === 'completed', workerPid, cancel: cancelReply, thread, since: intent.at,
    ...ownersOf(a.job, held),
    closeTree: () => closeAndRecord('collect', a.job, tree, true),
    kill: (pid) => require('./lib/codex-servers').defaultKill(pid, plat, process.env),
  }) : { end: 'confirmed', endReason: (before && before.end === 'confirmed' && before.endReason) || 'the tree was already given back' };
  if (holds && before && confirmed.end === 'unconfirmed') {
    const lost = recordHeld(a.job, tree, confirmed);
    if (lost) confirmed.endReason = `${confirmed.endReason}; ${lost}`;
  }
  const fallback = seatEndLib.fallbackOf({ role: intent.seat, state: out.state, reason: out.reason, output: out.output, cut, questions: intent.write === false });
  let finishedSteps = [];
  try { finishedSteps = seatEndLib.finishedSteps({ tree, slug: intent.slug, role: intent.seat, since: intent.at }); } catch { /* none proven */ }
  const line = { end: confirmed.end, endReason: confirmed.endReason, ...fallback };
  const owners = confirmed.end === 'unconfirmed'
    ? { workerPid, writers: confirmed.writers === undefined ? null : confirmed.writers, sessions: confirmed.sessions || [] }
    : {};
  const finalize = holds && confirmed.end === 'confirmed';
  return {
    fields: { ...line, finishedSteps, ...(holds && !finalize ? { checksWait: true } : {}) },
    line: { ...line, ...(thread ? { thread } : {}), ...owners },
    newlyConfirmed: finalize && Boolean(before),
    finalize,
  };
}

// The tree's reservation is this job's: it names the job, or — where its job id was never written — the job's intent.
const holdsTree = (held, jobId, intent) => Boolean(held && (held.jobId === jobId || (!held.jobId && intent && held.intent === intent.intent)));

// What every earlier look at a held end found — the end line's, each later `held` line's, and what the tree's
// reservation kept where the record could not take it: the processes still running, the owned sessions, and whether
// the first look could list none. A first look that listed nothing never drops what a later look found. A record that
// cannot be read is `ownersUnread`, never an empty set.
function ownersOf(jobId, reservation) {
  let lines;
  try {
    lines = readRecord().filter((l) => l && l.jobId === jobId);
  } catch (err) {
    return { ownersUnread: `the Codex job record (${RECORD_REL}) cannot be read: ${err.message}` };
  }
  const endLine = lines.find((l) => l.type === 'end');
  const kept = reservation && reservation.evidence && typeof reservation.evidence === 'object' ? [reservation.evidence] : [];
  const looks = [...(endLine && endLine.end === 'unconfirmed' ? [endLine, ...lines.filter((x) => x.type === 'held')] : []), ...kept];
  if (!looks.length) return {};
  const known = new Map();
  const sessions = new Set();
  for (const l of looks) {
    for (const w of Array.isArray(l.writers) ? l.writers : []) if (w && Number.isInteger(w.pid)) known.set(`${w.pid} ${w.started ?? w.cmd}`, w);
    for (const s of Array.isArray(l.sessions) ? l.sessions : []) if (typeof s === 'string' && s) sessions.add(s);
  }
  const blind = endLine && endLine.end === 'unconfirmed' && !Array.isArray(endLine.writers);
  return { known: [...known.values()], sessions: [...sessions], ...(blind ? { ownersKnown: false } : {}) };
}

// A later look that leaves a held end unconfirmed keeps what it found, so the next look counts it as the job's.
// Returns null, or why the record could not take it.
function recordHeld(jobId, tree, confirmed) {
  const writers = Array.isArray(confirmed.writers) ? confirmed.writers : [];
  const sessions = Array.isArray(confirmed.sessions) ? confirmed.sessions : [];
  if (!writers.length && !sessions.length) return null;
  const wrote = appendRecord({ type: 'held', jobId, at: new Date().toISOString(), end: 'unconfirmed', endReason: confirmed.endReason, writers, sessions });
  return wrote === true ? null : lostLine(tree, { writers, sessions }, `what this look found could not be written: ${wrote}`);
}

// The tree's reservation keeps a look's evidence beside the holder — a start that got no job id has no other home
// for it, and a job's look whose record line could not be written uses it too — so the next look still counts it.
function keepEvidence(tree, confirmed) {
  const writers = Array.isArray(confirmed.writers) ? confirmed.writers : [];
  const sessions = Array.isArray(confirmed.sessions) ? confirmed.sessions : [];
  const was = ((seats.readReservation(tree) || {}).evidence) || {};
  const evidence = {
    writers: [...(Array.isArray(was.writers) ? was.writers : []), ...writers],
    sessions: [...new Set([...(Array.isArray(was.sessions) ? was.sessions : []), ...sessions])],
  };
  return seats.updateReservation(seats.reservationFile(tree), { evidence });
}

const lostLine = (tree, confirmed, why) => (keepEvidence(tree, confirmed)
  ? `${why}; the tree's reservation keeps it instead`
  : `${why}, nor could the tree's reservation keep it`);

// What earlier looks at a start that got no job id kept on the tree's reservation.
function startEvidence(reservation) {
  const e = reservation && reservation.evidence && typeof reservation.evidence === 'object' ? reservation.evidence : {};
  return { known: Array.isArray(e.writers) ? e.writers : [], sessions: Array.isArray(e.sessions) ? e.sessions : [] };
}

// Once a seat job's end is confirmed, and once only: the safety copy's look, then the checks a hook would have made.
function finishSeat({ jobId, intent, state, output, log }) {
  const root = process.cwd();
  const out = {};
  if (intent && typeof intent.copy === 'string') out.safetyCopy = safetyCopyAfter(jobId, intent.copy);
  if (intent && intent.seat) out.seatChecks = seatChecks.afterJob({ root, intent, jobId, state, output, log, marks: sessionMarks(root) });
  return out;
}

// After a seat job has ended: its hand-back row once, with the end line; its step-run records carried from the
// tree; and its minutes, for the coordinator's message table. A sandbox check's job has no seat and gets none.
function seatEnd(a, end) {
  const intent = a.intent;
  if (!intent || !intent.seat || typeof intent.tree !== 'string') return {};
  const root = process.cwd();
  const out = {};
  const marks = sessionMarks(root);
  const note = seatRecordsAt(() => {
    if (end && end.wrote) seatRecords.writeEndRow({ root, role: intent.seat, jobId: a.job, ...marks });
    out.stepRunsCarried = seatRecords.carryStepRuns({ root, tree: intent.tree, role: intent.seat, since: intent.at, ...marks });
  });
  if (note) out.recordsNote = note;
  const from = end && Date.parse(end.startedAt);
  const to = end && Date.parse(end.endedAt);
  if (Number.isFinite(from) && Number.isFinite(to)) out.minutes = Math.round(Math.max(0, to - from) / 6000) / 10;
  return out;
}

// The reason on the end line of a job this helper cut, at its limit or at a stall, else null. Its log
// still holds the partial, so a later `collect` can return it.
function cutReason(jobId) {
  try {
    const end = readRecord().find((l) => l && l.type === 'end' && l.jobId === jobId);
    return end && (end.reason === PARTIAL_REASON || end.reason === STALL_REASON) ? end.reason : null;
  } catch {
    return null;
  }
}

// The intent `start` recorded for a job, or null where the record cannot say.
function recordedIntent(jobId) {
  try {
    return intentOf(readRecord(), jobId) || null;
  } catch {
    return null;
  }
}

// Every job recorded under exactly this label, newest first. A record that cannot be read whole is
// `unreadable`: a lost line might have been the one asked for, so it never answers `none`.
function cmdJobs(opts) {
  if (typeof opts.label !== 'string' || !opts.label.trim()) return usage('jobs needs --label <text>');
  const label = opts.label;
  const file = path.join(process.cwd(), RECORD_REL);
  let lines;
  try {
    lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
  } catch (err) {
    if (err.code === 'ENOENT') return print({ label, result: 'none' });
    return print({ label, result: 'unreadable', reason: `the Codex job record (${RECORD_REL}) could not be read: ${err.message}` });
  }
  const jobs = [];
  for (const line of lines) {
    if (!line || line.type !== 'intent' || line.label !== label) continue;
    if (lines.some((l) => l && l.type === 'unstarted' && l.intent === line.intent)) continue;
    const job = lines.find((l) => l && l.type === 'job' && l.intent === line.intent);
    const where = line.kind === SEAT_KIND ? { tree: line.tree, unit: line.unit } : {};
    jobs.unshift(job
      ? { jobId: job.jobId, kind: line.kind, startedAt: job.startedAt, deadline: job.deadline, status: 'recorded', ...where }
      : { jobId: null, kind: line.kind, startedAt: line.at, deadline: line.deadline, status: 'started, id not recorded', ...where });
  }
  return print(jobs.length ? { label, result: 'found', jobs } : { label, result: 'none' });
}

function jobArgs(opts, sub) {
  if (!opts.job || opts.job === true) return usage(`${sub} needs --job <id>`);
  const deadline = Date.parse(opts.deadline);
  if (!opts.deadline || opts.deadline === true || Number.isNaN(deadline)) return usage(`${sub} needs --deadline <iso time>`);
  const parsed = typeof opts.started === 'string' ? Date.parse(opts.started) : NaN;
  const started = Number.isNaN(parsed) ? null : parsed;
  const found = findCompanion(process.cwd());
  const intent = recordedIntent(String(opts.job));
  jobTree = intent && intent.kind === SEAT_KIND && typeof intent.tree === 'string' ? intent.tree : null;
  const copy = intent && typeof intent.copy === 'string' ? intent.copy : null;
  return { job: String(opts.job), deadline, started, found, kind: intent ? intent.kind || null : null, copy, intent };
}

// A job failure seen before the start plus the window (plus `extraMs`) is early.
function flagEarly(out, a, extraMs = 0) {
  if (a.started === null) return out;
  return Date.now() < a.started + windowMs(a.deadline - a.started) + extraMs ? { ...out, earlyFailure: true } : out;
}

const isJobFailure = (out) => out.state === 'failed' || out.state === 'cancelled' || (out.state === 'completed' && Boolean(out.reason));

function readStatus(script, job, waitMs, timeoutMs = waitMs + STATUS_GRACE_MS) {
  const args = waitMs > 0
    ? ['status', job, '--wait', '--timeout-ms', String(waitMs), '--json']
    : ['status', job, '--json'];
  const res = companion(script, args, timeoutMs);
  const record = res.json && res.json.job;
  if (!res.ok || !record || typeof record.status !== 'string') {
    return { state: 'unknown', readError: true, reason: res.ok ? 'the Codex companion returned no job state' : res.reason };
  }
  return { state: record.status, record };
}

// The time quiet is counted from: the newest timestamped log line, or --started for an empty log.
// Null where the log cannot be used, which never makes a stall.
function quietFrom(record, started) {
  if (!record || !record.logFile) return null;
  let text;
  try { text = fs.readFileSync(record.logFile, 'utf8'); } catch { return null; }
  if (text === '') return started;
  let newest = null;
  for (const line of text.split(/\r?\n/)) {
    const m = LOG_TIME.exec(line);
    const t = m ? Date.parse(m[1]) : NaN;
    if (!Number.isNaN(t) && (newest === null || t > newest)) newest = t;
  }
  return newest;
}

// A helper or seat job has no stall: silence is judged by its worker alone.
function stallOf(record, started, kind) {
  if (SILENT_KINDS.has(kind)) return null;
  const from = quietFrom(record, started);
  if (from === null) return null;
  const now = Date.now();
  return { due: from + QUIET_LIMIT_MS, stalled: now >= from + QUIET_LIMIT_MS, quietMinutes: Math.round((now - from) / 6000) / 10 };
}

function waitOnce(a, maxMs, kind) {
  const t0 = Date.now();
  const waitMs = t0 >= a.deadline ? maxMs : Math.min(maxMs, a.deadline - t0);
  const budgetEnd = t0 + waitMs + STATUS_GRACE_MS;

  const report = (s) => {
    if (s.readError) {
      sleepUntil(t0 + waitMs);
      const out = { state: s.state, readError: true, reason: s.reason };
      if (Date.now() >= a.deadline) out.deadlinePassed = true;
      return out;
    }
    if (TERMINAL.has(s.state)) {
      const out = s.reason ? { state: s.state, reason: s.reason } : { state: s.state };
      return isJobFailure(out) ? flagEarly(out, a) : out;
    }
    const out = { state: s.state };
    const stall = stallOf(s.record, a.started, kind);
    if (stall && stall.stalled) Object.assign(out, { stalled: true, quietMinutes: stall.quietMinutes });
    if (Date.now() >= a.deadline) out.deadlinePassed = true;
    return out;
  };

  const first = lostWorker(a.found.path, readStatus(a.found.path, a.job, 0, waitMs + STATUS_GRACE_MS), a.job, kind, budgetEnd - Date.now());
  if (first.readError || TERMINAL.has(first.state)) return report(first);
  const stall = stallOf(first.record, a.started, kind);
  if (stall && stall.stalled) return report(first);
  const timeLeft = budgetEnd - Date.now();
  const untilStall = stall ? Math.max(WAIT_FLOOR_MS, stall.due - Date.now()) : Infinity;
  const companionWait = Math.floor(Math.min(waitMs, untilStall, timeLeft - READ_SLACK_MS));
  if (companionWait < 1) return report(first);
  return report(lostWorker(a.found.path, readStatus(a.found.path, a.job, companionWait, timeLeft), a.job, kind, budgetEnd - Date.now()));
}

function cmdWait(opts) {
  const a = jobArgs(opts, 'wait');
  if (!a) return;
  if (a.found.unavailable) return print(flagEarly({ state: 'failed', reason: a.found.unavailable }, a));
  const max = Number(opts['max-seconds']);
  return print(waitOnce(a, (isPositive(max) ? max : DEFAULT_MAX_SECONDS) * 1000, a.kind));
}

// The last line naming the verdict wins: a reply that reconsiders ends on its final word. Only where no
// line names it, a first non-empty line that is one whole bold verdict counts (`**NO-GO — Round 1.**`).
function findVerdict(text) {
  const re = /^[-#>*\s]*verdict\s*:?[*\s]*(NO-GO|GO)\b/gim;
  let verdict = null;
  for (let m = re.exec(text); m; m = re.exec(text)) verdict = m[1].toUpperCase();
  if (verdict) return verdict;
  const first = String(text).split(/\r?\n/).find((l) => l.trim() !== '');
  const bold = first === undefined ? null : BOLD_VERDICT.exec(first);
  return bold ? bold[1] : null;
}

// A done-check body is usable with exactly one of the layout's verdict lines.
function doneCheckVerdict(text) {
  const found = String(text).split(/\r?\n/).map((l) => DONE_CHECK_VERDICT.exec(l)).filter(Boolean);
  return found.length === 1 ? found[0][1] || found[0][2] : null;
}

function readLog(record) {
  try {
    return fs.readFileSync(record.logFile, 'utf8');
  } catch {
    return '';
  }
}

function logTail(record) {
  const lines = dropWarnings(readLog(record || {})).split(/\r?\n/).map((l) => l.replace(LOG_TIME, '').trim()).filter(Boolean);
  const tail = lines.slice(-TAIL_LINES).join(' | ');
  return tail.length > TAIL_CHARS ? `…${tail.slice(-(TAIL_CHARS - 1))}` : tail;
}

function endedReason(s) {
  const tail = logTail(s.record);
  return tail ? `the job ended ${s.state} — its log ends: ${tail}` : `the job ended ${s.state}`;
}

// The companion's page for a completed job it holds no result for: a title, the `Job:` and `Status:`
// lines, and no report.
function isStatusPage(text, job) {
  const lines = String(text).split(/\r?\n/);
  return lines.length > 3 && lines[0].startsWith('# ') && lines[1] === '' && lines[2] === `Job: ${job}` && lines[3].startsWith('Status: ');
}

// The result's text where it holds a report, else ''. The session lines the companion appends, and its
// line for an empty final message, are not one.
function reportOf(text, job) {
  if (isStatusPage(text, job)) return '';
  const body = String(text).replace(SESSION_TRAILER, '').trim();
  return body === '' || body === NO_FINAL_MESSAGE ? '' : text;
}

// The last one named: the companion prints its own after the report, which may quote another.
function sessionOf(text) {
  const all = [...String(text).matchAll(SESSION_LINE)];
  return all.length ? all[all.length - 1][1] : null;
}

function finished(script, job, s, kind) {
  if (s.state === 'completed') {
    const res = companion(script, ['result', job], 60000);
    if (!res.ok) return { state: 'completed', output: '', verdict: null, reason: res.reason };
    const session = sessionOf(res.stdout);
    const link = session ? { codexSession: session } : {};
    if (ANY_OUTPUT_KINDS.has(kind)) {
      const report = reportOf(res.stdout, job);
      return report
        ? { state: 'completed', output: report, verdict: null, ...link }
        : { state: 'completed', output: report, verdict: null, reason: NO_OUTPUT, ...link };
    }
    const verdict = kind === 'done-check' ? doneCheckVerdict(res.stdout) : findVerdict(res.stdout);
    return verdict
      ? { state: 'completed', output: res.stdout, verdict, ...link }
      : { state: 'completed', output: res.stdout, verdict: null, reason: NO_VERDICT, ...link };
  }
  const reason = s.reason || dropWarnings(s.record && s.record.errorMessage) || endedReason(s);
  return { state: s.state, output: '', verdict: null, reason };
}

// Windows: 'gone', { commandLine }, or null when no try could run or every command line was empty.
// A busy machine can push one query past its limit, so a try with no answer is asked once more.
function commandOverride(name) {
  try {
    const v = JSON.parse(process.env[name] || 'null');
    return Array.isArray(v) && v.length && v.every((x) => typeof x === 'string') ? v : null;
  } catch {
    return null;
  }
}

function lookupProcess(pid) {
  for (let i = 1; ; i++) {
    const found = lookupOnce(pid);
    if (found !== null || i >= LOOKUP_TRIES) return found;
  }
}

// Get-CimInstance errors are non-terminating: without Stop a denied query prints 'none'.
function lookupOnce(pid) {
  const override = commandOverride('NEXUS_CODEX_LOOKUP');
  let exe;
  let args;
  if (override) {
    [exe, ...args] = override;
    args.push(String(pid));
  } else {
    const cls = /^\w+$/.test(process.env.NEXUS_CODEX_LOOKUP_CLASS || '') ? process.env.NEXUS_CODEX_LOOKUP_CLASS : 'Win32_Process';
    const script = "$ErrorActionPreference = 'Stop'; " +
      `try { $p = Get-CimInstance ${cls} -Filter 'ProcessId=${pid}' -ErrorAction Stop; ` +
      "if ($p) { [Console]::Out.Write('found:' + $p.CommandLine) } else { [Console]::Out.Write('none') } } catch { exit 1 }";
    exe = 'powershell.exe';
    args = ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')];
  }
  const res = spawnSync(exe, args, { encoding: 'utf8', timeout: LOOKUP_MS, windowsHide: true });
  if (res.error || res.status !== 0) return null;
  const out = String(res.stdout || '').trim();
  if (out === 'none') return 'gone';
  const commandLine = out.startsWith('found:') ? out.slice('found:'.length) : '';
  return commandLine.trim() ? { commandLine } : null;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isWorkerOf = (commandLine, jobId) => /(?:^|[\s"])task-worker(?=[\s"]|$)/.test(commandLine)
  && new RegExp(`--job-id\\s+"?${escapeRe(jobId)}"?(?=\\s|$)`).test(commandLine);

// 'gone', 'other' (Windows: another program holds the pid), 'worker' (Windows: this job's), 'alive',
// or null (no answer).
function workerState(pid, jobId) {
  const platform = process.env.NEXUS_CODEX_PLATFORM || process.platform;
  if (platform !== 'win32') {
    try { process.kill(pid, 0); return 'alive'; } catch (e) { return e.code === 'EPERM' ? 'alive' : e.code === 'ESRCH' ? 'gone' : null; }
  }
  const found = lookupProcess(pid);
  if (found === null || found === 'gone') return found;
  return isWorkerOf(found.commandLine, jobId) ? 'worker' : 'other';
}

const isStopped = (state) => state === 'gone' || state === 'other';

// A queued job whose worker is gone never runs, and a helper or seat job's worker gone mid-run never
// ends. Returns the status as a failed one, `pidFree` saying that no process holds the pid, or the
// status unchanged. Such a worker exits once it has saved the job's end, so a running job is read
// again before its worker counts as lost; a re-read that fails is a read error, never a failure.
function lostWorker(script, s, jobId, kind, rereadMs = COLLECT_STATUS_MS) {
  if (s.state !== 'queued' && !(s.state === 'running' && SILENT_KINDS.has(kind))) return s;
  const pid = s.record && s.record.pid;
  if (!(Number.isInteger(pid) && pid > 0)) return s;
  const state = workerState(pid, jobId);
  if (!isStopped(state)) return s;
  if (s.state === 'running') {
    const again = readStatus(script, jobId, 0, Math.max(WAIT_FLOOR_MS, rereadMs));
    if (TERMINAL.has(again.state)) return again;
    if (again.readError) return { ...again, record: s.record };
  }
  return { state: 'failed', reason: s.state === 'queued' ? LOST_WORKER_REASON : GONE_WORKER_REASON, record: s.record, pidFree: state === 'gone' };
}

function killTree(pid, jobId) {
  const [exe, ...lead] = commandOverride('NEXUS_CODEX_KILL') || ['taskkill'];
  spawnSync(exe, [...lead, '/PID', String(pid), '/T', '/F'], { encoding: 'utf8', timeout: KILL_MS, windowsHide: true });
  const end = Date.now() + RECHECK_MS;
  for (;;) {
    const state = workerState(pid, jobId);
    if (isStopped(state)) return true;
    if (state === null || Date.now() >= end) return false;
    sleepUntil(Date.now() + 250);
  }
}

// Cancels a running job at the limit, or at a stall (`stall` set). The stall's early flag is decided
// before this runs, since the cancel appends lines to the job's log.
function cut(script, job, s, kind, stall) {
  const extra = stall ? { stalled: true } : {};
  const readError = s.readError ? { readError: true } : {};
  const stopped = () => ({
    state: 'cancelled', output: '', verdict: null, reason: stall ? STALL_REASON : PARTIAL_REASON,
    ...extra, partial: readLog(s.record || {}), ...readError, ...(stall && stall.early ? { earlyFailure: true } : {}),
  });
  const cancel = companion(script, ['cancel', job, '--json'], CANCEL_MS);
  if (cancel.ok) cancelReply = cancel.json;
  if (cancel.ok) return stopped();
  const again = readStatus(script, job, 0, COLLECT_STATUS_MS);
  if (TERMINAL.has(again.state)) {
    const out = finished(script, job, again, kind);
    return stall && stall.early && isJobFailure(out) ? { ...out, earlyFailure: true } : out;
  }
  const cancelFailed = () => ({
    state: again.state, output: '', verdict: null, reason: `cancel failed: ${cancel.reason}`,
    partial: readLog(again.record || {}), ...extra, ...(again.readError ? { readError: true } : {}),
  });
  const pid = again.record && again.record.pid;
  if (again.readError || !(Number.isInteger(pid) && pid > 0)) return cancelFailed();
  const state = workerState(pid, job);
  if (isStopped(state)) return stopped();
  if (state === 'worker' && killTree(pid, job)) return stopped();
  return cancelFailed();
}

function collectOnce(a, kind) {
  if (a.found.unavailable) return flagEarly({ state: 'failed', output: '', verdict: null, reason: a.found.unavailable }, a);
  const script = a.found.path;
  const s = lostWorker(script, readStatus(script, a.job, 0, COLLECT_STATUS_MS), a.job, kind);
  if (s.pidFree) {
    const cancel = companion(script, ['cancel', a.job, '--json'], CANCEL_MS);
    if (cancel.ok) cancelReply = cancel.json;
  }
  const ended = ({ codexSession, ...out }) => {
    if (!TERMINAL.has(out.state)) return out;
    const log = () => readLog(s.record || {});
    const seatOut = a.intent && a.intent.seat && jobTree ? seatEndOf(a, out, codexSession, s, log) : null;
    const end = recordEnd(a.job, out.state, out.reason, codexSession, seatOut ? seatOut.line : {});
    if (seatOut && end && end.writeError && seatOut.line.end === 'unconfirmed') {
      const lost = lostLine(jobTree, seatOut.line, `the end line could not be written: ${end.writeError}`);
      seatOut.fields.endReason = `${seatOut.fields.endReason}; ${lost}`;
    }
    if (seatOut && end && !end.wrote && seatOut.newlyConfirmed) {
      appendRecord({ type: 'confirm', jobId: a.job, at: new Date().toISOString(), end: 'confirmed', endReason: seatOut.fields.endReason });
    }
    const records = seatEnd(a, end);
    const output = [out.output, out.partial, codexSession ? `Codex session ID: ${codexSession}` : ''].join('\n');
    const done = seatOut && seatOut.finalize ? finishSeat({ jobId: a.job, intent: a.intent, state: out.state, output, log: log() }) : {};
    if (seatOut && seatOut.finalize) seats.releaseTree(jobTree, { intent: a.intent.intent });
    // A tree still held keeps its servers: they are ended only inside the confirmation, after its look.
    const stillHeld = seatOut && seatOut.fields.checksWait === true;
    return {
      ...out, ...(seatOut ? seatOut.fields : {}), ...done, ...records,
      ...(stillHeld ? {} : closeServers('collect', a.job, jobTree || process.cwd())),
    };
  };
  if (TERMINAL.has(s.state)) {
    const finishedOut = finished(script, a.job, s, kind);
    const cutBefore = s.state === 'cancelled' ? cutReason(a.job) : null;
    const out = cutBefore ? { ...finishedOut, reason: cutBefore, partial: readLog(s.record || {}) } : finishedOut;
    return ended(isJobFailure(out) ? flagEarly(out, a) : out);
  }
  if (Date.now() >= a.deadline) return ended(cut(script, a.job, s, kind, null));
  const stall = s.readError ? null : stallOf(s.record, a.started, kind);
  if (stall && stall.stalled) {
    const early = flagEarly({}, a, SETUP_ALLOWANCE_MS).earlyFailure === true;
    return ended(cut(script, a.job, s, kind, { early }));
  }
  const out = { state: s.state, output: '', verdict: null, reason: 'still running — wait until the deadline' };
  return s.readError ? { ...out, readError: true } : out;
}

function cmdCollect(opts) {
  const a = jobArgs(opts, 'collect');
  if (!a) return;
  const kind = opts.kind === undefined ? (a.kind === SEAT_KIND ? SEAT_KIND : 'review') : opts.kind;
  if (!KINDS.includes(kind)) return usage(`--kind is ${JSON.stringify(kind)}, not one of ${KINDS.join(', ')}`);
  return print(collectOnce(a, kind));
}

// Waits as a `wait` loop does, and collects when a `wait` would have told its caller to.
function watched(a, kind) {
  for (;;) {
    const passStart = Date.now();
    const seen = Date.now() >= a.deadline ? { deadlinePassed: true } : waitOnce(a, DEFAULT_MAX_SECONDS * 1000, kind);
    if (TERMINAL.has(seen.state) || seen.stalled || seen.deadlinePassed) {
      const out = collectOnce(a, kind);
      if (TERMINAL.has(out.state) || 'partial' in out) return out;
    }
    sleepUntil(passStart + WAIT_FLOOR_MS);
  }
}

// Null, or why the report could not be written.
function writeReport(file, text) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
    return null;
  } catch (err) {
    return `the report could not be written to ${file}: ${err.message} — collect still returns the job's result, or a cut job's partial`;
  }
}

function cmdWatch(opts) {
  if (typeof opts.out !== 'string' || !opts.out.trim()) return usage('watch needs --out <path>');
  const a = jobArgs(opts, 'watch');
  if (!a) return;
  const kind = opts.kind === undefined ? a.kind || 'review' : opts.kind;
  if (!KINDS.includes(kind)) return usage(`--kind is ${JSON.stringify(kind)}, not one of ${KINDS.join(', ')}`);
  const file = path.resolve(opts.out);
  const out = a.found.unavailable ? collectOnce(a, kind) : watched(a, kind);
  const cutOff = 'partial' in out;
  const text = out.output || (cutOff ? out.partial : '') || '';
  const writeError = writeReport(file, text);
  const reason = [out.reason, writeError].filter(Boolean).join('; ');
  print({
    state: out.state, path: file, size: writeError ? 0 : Buffer.byteLength(text),
    ...(reason ? { reason } : {}),
    ...(out.earlyFailure ? { earlyFailure: true } : {}),
    ...(cutOff ? { partial: true } : {}),
  });
}

function main() {
  const [sub, ...rest] = process.argv.slice(2);
  const opts = parseArgs(rest);
  if (sub === 'start') return cmdStart(opts);
  if (sub === 'wait') return cmdWait(opts);
  if (sub === 'collect') return cmdCollect(opts);
  if (sub === 'watch') return cmdWatch(opts);
  if (sub === 'jobs') return cmdJobs(opts);
  if (sub === 'sweep') return cmdSweep();
  if (sub === 'seat-release') return cmdSeatRelease(opts);
  if (sub === 'seat-check') return cmdSeatCheck();
  if (sub === 'seat') return cmdSeat(opts);
  return usage(`unknown subcommand ${JSON.stringify(sub || '')} — use start, wait, collect, watch, jobs, sweep, seat, seat-check or seat-release`);
}

main();
