#!/usr/bin/env node
/**
 * Nexus verify-run: the runner for a declared verify role (F81, KH feedback item 2).
 *
 *   node verify-run.js --profile fast [--files <test file>...] [--timeout-ms N] [--tree <path>] [--session <id>]
 *   node verify-run.js --profile complete --slug <slug> [--timeout-ms N] [--tree <path>] [--session <id>]
 *   node verify-run.js --role <name> [--slug <slug>] …   (the same runs, addressed by role)
 *
 * PROFILES ARE ALIASES, NEVER NEW KEYS: `fast` runs roles.unit (the step close, 90 s default) and
 * `complete` runs roles.full (the close gate's suite, 30 min default, --slug required). `--files`
 * runs only the named test files, composed by lib/compose-test-command.js for `slow.runner`, else for
 * the runner the declared unit invokes — never spliced into the declared unit string. The named files
 * run WHOLE, slow tests included: a developer names a file to see its tests, the tagged one it is
 * editing among them.
 *
 * EVERY RECORD CARRIES `tree_hash` (lib/tree-hash.js), and a `full` record adds `filtered` (its command
 * carries a filter clause) and `fast_green` (the latest whole fast record's verdict on the same tree at
 * the same hash, else `none`). The close gate reuses a passing record only while the hash still matches.
 *
 * WHY NOT A HOOK. The close gate has to run the repo's full suite, and that suite cannot live in
 * verify-gate.js: that hook caps each command at 120 s (hooks.json's outer cap is 180 s) and a
 * measured consuming-repo suite takes ~7 minutes. It must not be a SUBAGENT's op either — the
 * platform's 600 s no-output watchdog kills a subagent mid-suite, and the Bash tool's own hard cap
 * is 600,000 ms. So the full suite runs HERE, from the main session, where neither limit applies.
 *
 * WHY IT RECORDS RATHER THAN RETURNS. "The suite passed" has to survive the turn that ran it: the
 * team lead reads the record at close, and pipeline-gate.js refuses a summary.md write without one
 * (Step 4). A verdict that exists only as console output is a claim; a verdict on disk is evidence.
 * Enforcement by CONSUMING a record is ADR-31's shape, reused rather than reinvented.
 *
 * ONE AUDIT FILE, ONE GRAMMAR. Records are appended to .claude/audit/verify-verdict.json in
 * verify-gate's shape (JSON line per record, same `ts`/`session`/`token`/`tree` fields) plus `role`,
 * `source: "verify-run"` and `duration_ms`. The team lead already parses that file line by line; a
 * second file or a second shape would need a second reader for no gain.
 *
 * AN UNDECLARED ROLE IS RECORDED, NEVER SILENT. If the repo declared no such role the run writes
 * verdict:"undeclared" and exits 0. That is the honest outcome — nothing ran, and the close gate
 * discloses it in summary.md — and it is deliberately distinguishable from a pass. A silent skip
 * here would be the false-green the whole verdict substrate exists to prevent.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolveDeclaredTree } = require('./lib/worktree-target');
const { filesCommand, inferRunner, isFilteredFull } = require('./lib/compose-test-command');
const { treeHash, sameTree } = require('./lib/tree-hash');

// Above any measured suite (7.2 min in the consuming repo that prompted this) and above the Bash
// tool's 600,000 ms cap, because this runs in the main session where that cap does not apply.
// Overridable per run; the point is that the DEFAULT never truncates a legitimate suite.
const DEFAULT_TIMEOUT_MS = 1800000;
// The fast profile's default: below the Bash tool's 120 s so the `timeout` record lands before the
// caller's own watchdog kills the call, and 3× the 30 s step bound.
const FAST_TIMEOUT_MS = 90000;
// verify-gate's bound, and for its reason: a big suite's output clears 1 MB exactly when the
// excerpt matters most, and an ENOBUFS kill would turn a green run into a recorded red.
const MAX_OUTPUT_BYTES = 32 * 1024 * 1024;
const EXCERPT_HEAD = 400;
const EXCERPT_TAIL = 1200;

function excerpt(text) {
  const s = String(text || '');
  if (s.length <= EXCERPT_HEAD + EXCERPT_TAIL) return s;
  const dropped = s.length - EXCERPT_HEAD - EXCERPT_TAIL;
  return `${s.slice(0, EXCERPT_HEAD)}\n… [${dropped} chars elided] …\n${s.slice(-EXCERPT_TAIL)}`;
}

// The no-output failure classes are the ones a reader cannot otherwise diagnose: a timeout throws
// ETIMEDOUT with empty stdout/stderr, an over-buffer throws ENOBUFS while stdout holds megabytes of
// healthy output. Naming the cause is what keeps a red attributable.
function failureCause(e) {
  if (!e) return 'unknown error';
  if (e.code) return String(e.code);
  if (e.signal) return `killed by ${e.signal}`;
  if (typeof e.status === 'number') return `exit status ${e.status}`;
  return 'unknown error';
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!flag.startsWith('--')) continue;
    if (flag === '--files') {
      const files = [];
      while (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) files.push(argv[++i]);
      out.files = files;
      continue;
    }
    out[flag.slice(2)] = argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

const PROFILE_ROLES = { fast: 'unit', complete: 'full' };

// "Was this tree fast-green when the complete run saw it?" — the latest whole-suite fast record on the
// same tree at the same hash. A named-files record is a partial run, never a fast-green. Both hashes are
// post-run, so this reads `none` forever in a repo whose complete suite rewrites a tracked file outside
// docs/ and .claude/ that the fast run leaves alone: a `0 / 0` tally is diagnosed there first.
function fastGreen(root, tree, hash) {
  if (!hash) return 'none';
  let lines = [];
  try { lines = fs.readFileSync(path.join(root, '.claude', 'audit', 'verify-verdict.json'), 'utf8').split('\n'); } catch { return 'none'; }
  let latest = null;
  for (const line of lines) {
    let rec;
    try { rec = JSON.parse(line); } catch { continue; }
    if (!rec || rec.profile !== 'fast' || rec.files !== undefined) continue;
    if (!sameTree(rec.tree, tree) || rec.tree_hash !== hash) continue;
    latest = rec;
  }
  return latest && (latest.verdict === 'pass' || latest.verdict === 'fail') ? latest.verdict : 'none';
}

// `--timeout-ms` with no value parses to `true`, and Number(true) === 1 — which would cap a healthy
// suite at ONE millisecond and record a green run as `reason: "timeout"`, a false red that then
// blocks the close. Require an actual string before trusting the number.
function timeoutFor(profile, rawTimeout) {
  if (typeof rawTimeout === 'string' && Number(rawTimeout) > 0) return Number(rawTimeout);
  return profile === 'fast' ? FAST_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const profile = typeof args.profile === 'string' ? args.profile : '';
  if (args.profile !== undefined && !PROFILE_ROLES[profile]) {
    process.stderr.write('verify-run: --profile is fast or complete\n');
    return 2;
  }
  if (profile && args.role !== undefined) {
    process.stderr.write('verify-run: pass --profile or --role, not both\n');
    return 2;
  }
  const role = profile ? PROFILE_ROLES[profile] : (typeof args.role === 'string' ? args.role : '');
  if (!role) {
    // Names the four conventional roles as a hint, but any key the repo declares under `roles` runs —
    // the roster is the repo's, not this script's, so an unlisted role is `undeclared`, not rejected.
    process.stderr.write('verify-run: --role <name> is required (conventionally build|unit|full|mutation)\n');
    return 2;
  }
  const files = args.files || null;
  if (files && profile !== 'fast') {
    process.stderr.write('verify-run: --files <test file>... runs only with --profile fast\n');
    return 2;
  }
  if (files && files.length === 0) {
    process.stderr.write('verify-run: --files names no test file (the list is empty)\n');
    return 2;
  }

  // THE ROUND KEY. A token-or-session match alone is not round-scoped: a session outlives a feature,
  // and a repo with no .pipeline-state has no token at all, so two closes in one session could
  // discharge each other. Required for `full` because `full` is the role the close gate consumes — a
  // full record that cannot name its round is worse than an absent one, because it still reads as
  // evidence. Optional for every other role: only `full` is consumed at close, and demanding a slug
  // for a step-close `unit` run would add ceremony to the loop this feature exists to shorten.
  // Checked BEFORE anything is resolved or run, and nothing is written when it fails — an unscoped
  // full record must never reach the log at all.
  const slug = typeof args.slug === 'string' ? args.slug : '';
  if (role === 'full' && !slug) {
    process.stderr.write("verify-run: --slug <slug> is required for --role full (the record's round key)\n");
    return 2;
  }

  // Root resolution mirrors the hooks' (CLAUDE_PROJECT_DIR || cwd), then honours a session-matching
  // .worktree-target line. --tree is the explicit override for a caller that already knows.
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  // The harness exports CLAUDE_CODE_SESSION_ID (verified against a live environment). The shorter
  // CLAUDE_SESSION_ID is accepted as a secondary name only — do NOT rely on it alone: an env-var
  // name that is merely plausible yields an empty `session` on every run, which silently removes one
  // of the two scoping paths the close gate matches on.
  const session = typeof args.session === 'string'
    ? args.session
    : String(process.env.CLAUDE_CODE_SESSION_ID || process.env.CLAUDE_SESSION_ID || '');
  const tree = typeof args.tree === 'string' ? args.tree : resolveDeclaredTree(root, session);

  let token = '';
  try { token = fs.readFileSync(path.join(tree, '.claude', '.pipeline-state'), 'utf8').trim(); } catch { /* no token */ }

  let cfg = null;
  try { cfg = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8')); }
  catch { /* absent or malformed → undeclared, recorded below */ }
  const declared = cfg && cfg.roles && cfg.roles[role];
  let commands = typeof declared === 'string' && declared.trim() !== '' ? [declared.trim()] : [];

  let relFiles = null;
  if (files) {
    const slow = cfg && cfg.slow && typeof cfg.slow.runner === 'string' && cfg.slow.runner ? cfg.slow : null;
    const runner = slow ? slow.runner : inferRunner(commands[0] || '');
    if (!runner) {
      process.stderr.write('verify-run: --files needs a runner — no slow.runner in .claude/verify.json and no recognised test invocation in roles.unit; declare verify roles first\n');
      return 2;
    }
    relFiles = files.map((f) => path.relative(tree, path.resolve(tree, f)).split(path.sep).join('/'));
    try {
      commands = filesCommand({ runner, files: relFiles, exclude: false, cwd: tree, note: (line) => process.stderr.write(`verify-run: ${line}\n`) });
    } catch (e) {
      process.stderr.write(`verify-run: ${e.message}\n`);
      return 2;
    }
  }
  const command = commands.join(' && ');

  // `slug` is omitted rather than written empty when absent: the gate treats a record with no slug as
  // undischargeable, and an explicit `slug: ""` would be one `=== ''` bug away from matching.
  const base = {
    ts: new Date().toISOString(), source: 'verify-run', role,
    ...(profile ? { profile } : {}), ...(relFiles ? { files: relFiles } : {}), ...(slug ? { slug } : {}),
    session, token, tree,
  };

  // The audit file is the RESOLVED ROOT's, even when the command ran in a redirected tree — same
  // split verify-gate makes (measure there, write here), so the token-scoped round queries keep
  // working against one log home.
  // The hash is taken when the record is written, AFTER the command exits: a suite that rewrites a
  // tracked file records the tree it left behind, which is the tree the close gate will hash.
  const write = (fields) => {
    const record = { ...base, tree_hash: treeHash(tree), ...fields };
    if (role === 'full') {
      record.filtered = isFilteredFull(record.command || '');
      record.fast_green = fastGreen(root, tree, record.tree_hash);
    }
    try {
      fs.mkdirSync(path.join(root, '.claude', 'audit'), { recursive: true });
      fs.appendFileSync(path.join(root, '.claude', 'audit', 'verify-verdict.json'), JSON.stringify(record) + '\n');
    } catch { /* an unwritable audit dir must not also lose the stdout record below */ }
    process.stdout.write(JSON.stringify(record) + '\n');
  };

  if (!command) {
    write({ verdict: 'undeclared', reason: `no roles.${role} declared in .claude/verify.json` });
    return 0; // visible, never silent — and never a blocker: a repo may legitimately declare no suite
  }

  const timeoutMs = timeoutFor(profile, args['timeout-ms']);
  const started = Date.now();
  try {
    for (const cmd of commands) {
      const remaining = Math.max(1, timeoutMs - (Date.now() - started));
      execSync(cmd, { cwd: tree, stdio: ['ignore', 'pipe', 'pipe'], timeout: remaining, maxBuffer: MAX_OUTPUT_BYTES });
    }
    write({ command, verdict: 'pass', duration_ms: Date.now() - started });
    return 0;
  } catch (e) {
    const captured = `${String((e && e.stdout) || '')}${String((e && e.stderr) || '')}`;
    const cause = failureCause(e);
    write({
      command,
      verdict: 'fail',
      duration_ms: Date.now() - started,
      // ETIMEDOUT is surfaced as a plain `reason: "timeout"` as well as in the excerpt: the close
      // gate distinguishes "the suite is red" from "the suite never finished", and a reader should
      // not have to pattern-match an errno to tell them apart.
      reason: cause === 'ETIMEDOUT' ? 'timeout' : cause,
      output_excerpt: excerpt(`${captured}\n[verify-run] command failed: ${cause}\n`),
    });
    return 1;
  }
}

module.exports = { timeoutFor };

if (require.main === module) process.exit(main());
