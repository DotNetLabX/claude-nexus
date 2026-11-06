#!/usr/bin/env node
/**
 * Nexus label-tests: labels the tests a step close timed, from that run's record alone — it never re-times a
 * test. The one run it makes is a check: each node file it labelled runs its two legs apart once (below), never
 * for a developer's step run.
 *
 *   node label-tests.js --run <run_id> [--reason "<text>" --test <file>:<line>]…
 *
 * The run is the verify-run record carrying `run_id` (verify-run.js prints it); a step close — `--files` or
 * `--tied` — records each executed test's time (`test_times`) and the content hash of every file it timed
 * (`timed_hashes`). Any run records the tests it timed out (`timed_out`): each is over the slow line by
 * definition, and is found by its line when the run gave no column; a run with no `timed_hashes` (a complete
 * run) is read against its `file_hashes`. For each timed test file, every timed test at or over the repo's slow line
 * (`slow.thresholdMs` in .claude/verify.json, 2000 ms when unset) gets the slow label and every one under it
 * loses it, along with a kept-slow reason above it. The label is the file's runner's own form, written by that
 * runner (`labelSource`, with any project file it needs beside it, `labelCompanions` — the contract in
 * lib/test-runners.js); a file whose runner no installed plugin serves is skipped and named. `--reason`
 * with `--test {file}:{line}` (the line as the run reported it) writes that reason as a `// slow: {reason}`
 * comment above a test kept slow.
 *
 * A FILE IS THE RUN'S only while its content is the run's: its hash is the run's `timed_hashes` entry, or the
 * `after` of this run's own latest label record for it. Any other file is skipped and named. Every file it
 * edits gets one label record line in .claude/audit/verify-verdict.json — `{source: "label-tests", run_id,
 * tree, files: {path: {before, after, shifts}}}`, `before` the run's hash, `after` the labelled file's,
 * `shifts` the lines reason comments added (+1) or removed (-1) at a run line, so a later call maps the run's
 * positions. The close readers (pipeline-gate.js, lib/gear-close.js) accept such a record as covering the
 * labelled file for its run: the content differs from the run's by labels and reason comments alone — unless
 * the newest two-leg check kept at that content (below) failed, which also takes back any green record of that
 * content older than it.
 *
 * A STEP CLOSE LABELS ONLY THE STEP'S OWN FILES. A run that names files (`files`, or a tied run's `changed`)
 * labels a timed file only when it is among them and differs from HEAD in the run's tree now — staged,
 * unstaged or untracked, read by one `git status` per file; where git cannot answer, the file counts as
 * changed. Any other timed file whose labels would change is named as a slow candidate and left as it is, and
 * so is a file whose label needs a project file outside that set (a label and the project file it needs).
 * Inside such a file only a test the step changed gets or loses a label, every other one keeps its own: a line
 * that differs from HEAD (`git diff -U0`; a deleted run counts at its new-side position) belongs to the nearest
 * timed test below it when it sits in the block of attribute, comment and blank lines directly above that test's
 * line — an attribute or decorator running to the line that closes its brackets, a block comment to its end —
 * else to the nearest timed test at or above it; every test of an untracked file is changed, and where git
 * cannot answer every test counts as changed. A `--reason` for a test the step did not change is not written.
 * A run with no such set — a complete run, a whole-unit run — labels every file it timed.
 *
 * A RUN ON A BUSY MACHINE LABELS NOTHING. A record reading `busy_machine: true` (verify-run.js — another heavy
 * run shared the machine) timed its tests under someone else's load: the call writes no label, no reason
 * comment and no record, says why, and exits 0.
 *
 * A LABELLED TEST MUST STAND ALONE. The complete run runs a node file's labelled tests and its other tests in
 * separate processes (lib/compose-test-command.js nodeLegs), while a step close runs the file whole. So each
 * node file whose labels this run wrote — in this call or an earlier one — runs its two legs once, apart, each
 * by name, both under the repo's slow stop (the check is for dependence, not speed) and with the child-call
 * preload, apart from any outer run's events file; a leg that fails is named, and the call exits 1. The labels
 * stay written. Each check is kept in the label record (`checks: {path: {hash, passed}}`): a check passed at
 * the file's content now is not run again, and a file whose check failed that has since changed keeps the run
 * failing — every call for that run exits 1 until a new step close labels it.
 *
 * A DEVELOPER'S STEP RUN IS LABELLED, NEVER CHECKED. For a record of verify-run.js `--step` (`step_run`) the
 * call labels from that run and runs no leg, whatever flags it gets: a developer's step has two capped runs and
 * a check would be a third; the complete run runs a file's labelled and other tests apart, so a test leaning on
 * another's state fails there.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const { fileHash } = require('./lib/tree-hash');
const { loadRunner, runnerOfFile, mapLine } = require('./lib/test-runners');
const { nodeLegs, nodeSupportsSkipPattern, PRELOAD_URL } = require('./lib/compose-test-command');
const { testSettings } = require('./verify-run');

const DEFAULT_SLOW_MS = 2000;
const SLOW_LABEL = '@slow';
const LEG_LIMIT_MS = 10 * 60 * 1000;
const LOG = ['.claude', 'audit', 'verify-verdict.json'];

function parseArgs(argv) {
  const out = { reasons: [] };
  let reason = null;
  for (let i = 0; i < argv.length; i++) {
    const value = argv[i + 1];
    if (argv[i] === '--run') { out.run = value; i++; }
    else if (argv[i] === '--reason') { reason = value; i++; }
    else if (argv[i] === '--test') { out.reasons.push({ at: value, reason }); i++; }
  }
  return out;
}

function readLog(root) {
  let text = '';
  try { text = fs.readFileSync(path.join(root, ...LOG), 'utf8'); } catch { return []; }
  const records = [];
  for (const line of text.split('\n')) {
    try { const r = JSON.parse(line); if (r && typeof r === 'object') records.push(r); } catch { /* a torn or blank line */ }
  }
  return records;
}

function slowLine(tree) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8'));
    const ms = cfg && cfg.slow && cfg.slow.thresholdMs;
    return typeof ms === 'number' && ms > 0 ? ms : DEFAULT_SLOW_MS;
  } catch {
    return DEFAULT_SLOW_MS;
  }
}

// The files a run's step named, or null for a run that names none.
function stepFiles(run) {
  const lists = [run.files, run.changed].filter(Array.isArray);
  if (lists.length === 0) return null;
  return new Set(lists.flat().filter((f) => typeof f === 'string').map((f) => f.replace(/\\/g, '/')));
}

// Whether `file` differs from HEAD in `tree`; null when git cannot say.
function changedFromHead(tree, file) {
  try {
    return childProcess.execFileSync('git', ['status', '--porcelain', '-z', '--untracked-files=all', '--', file], {
      cwd: tree, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true,
    }).length > 0;
  } catch {
    return null;
  }
}

// Where `file` differs from HEAD in `tree`, by its lines now (`git diff -U0`): each added or changed line as
// `{ at: n, from: n }`, and each deleted run at its new-side position `n` — between line n and the next — as
// `{ at: n, from: n + 1 }`. `all` for an untracked file, null when git cannot say.
function changedLines(tree, file) {
  const git = (args) => childProcess.execFileSync('git', args, { cwd: tree, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
  try {
    if (git(['status', '--porcelain', '-z', '--untracked-files=all', '--', file]).startsWith('??')) return 'all';
    const changes = [];
    for (const m of git(['diff', '-U0', '--no-color', '--no-ext-diff', 'HEAD', '--', file]).matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
      const start = Number(m[1]);
      const count = m[2] === undefined ? 1 : Number(m[2]);
      if (count === 0) changes.push({ at: start, from: start + 1 });
      for (let i = 0; i < count; i++) changes.push({ at: start + i, from: start + i });
    }
    return changes;
  } catch {
    return null;
  }
}

// A line that opens or is an attribute, comment or blank line of the block above a test.
const ABOVE_TEST = /^\s*(?:$|\/\/|\/\*|\*|#|\[|@)/;
const bracketDepth = (line) => {
  const bare = line.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '');
  return (bare.match(/[[(]/g) || []).length - (bare.match(/[\])]/g) || []).length;
};

// Which lines belong to an attribute, comment or blank-line block: an attribute or decorator runs to the line that
// closes its brackets, a block comment to its `*/`.
function blockLines(text) {
  const out = [];
  let depth = 0;
  let comment = false;
  for (const line of text) {
    if (comment) { out.push(true); comment = !line.includes('*/'); continue; }
    if (depth > 0) { out.push(true); depth = Math.max(0, depth + bracketDepth(line)); continue; }
    const block = ABOVE_TEST.test(line);
    out.push(block);
    if (block && /^\s*\/\*/.test(line) && !line.includes('*/')) comment = true;
    else if (block && /^\s*[[@]/.test(line)) depth = Math.max(0, bracketDepth(line));
  }
  return out;
}

// The tests a change touched: a change belongs to the nearest test below it when every line from it to that
// test's line is an attribute, comment or blank line, else to the nearest test at or above it.
function touchedTests(tests, changes, source, shifts) {
  const text = String(source).split('\n');
  const block = blockLines(text.map((l) => l.replace(/\r$/, '')));
  const at = (t) => mapLine(shifts, t.line);
  const positions = [...new Set(tests.filter((t) => Number.isInteger(t.line)).map(at))].sort((a, b) => a - b);
  const owners = new Set();
  for (const change of changes) {
    const below = positions.find((p) => p > change.at);
    let owner = null;
    if (below !== undefined) {
      let inBlock = true;
      for (let l = change.from; l < below && inBlock; l++) inBlock = block[l - 1] ?? true;
      if (inBlock) owner = below;
    }
    if (owner === null) owner = positions.findLast((p) => p <= change.at) ?? null;
    if (owner !== null) owners.add(owner);
  }
  return tests.filter((t) => Number.isInteger(t.line) && owners.has(at(t)));
}

// A timed-out test is recorded by its line alone; its call starts at the line's first non-blank column.
function firstColumn(source, line) {
  const text = String(source).split('\n')[line - 1];
  const at = text === undefined ? -1 : text.search(/\S/);
  return at < 0 ? 1 : at + 1;
}

// One leg of a labelled file, run with this node; its exit status, null when it could not finish.
function spawnLeg(args, { cwd, env }) {
  return childProcess.spawnSync(process.execPath, args, { cwd, env, stdio: 'ignore', windowsHide: true, timeout: LEG_LIMIT_MS }).status;
}

// A leg runs on its own — no events file of an outer run, no outer test runner's context — with the child-call
// preload every run's legs carry, so a hung child call ends at the stop.
function legEnv(extra) {
  const env = { ...process.env, ...extra };
  delete env.NEXUS_TEST_EVENTS;
  delete env.NODE_TEST_CONTEXT;
  const options = String(env.NODE_OPTIONS || '');
  if (nodeSupportsSkipPattern(process.versions.node) && !options.includes(PRELOAD_URL)) env.NODE_OPTIONS = `${options} --import=${PRELOAD_URL}`.trim();
  return env;
}

function readConfig(tree) {
  try { return JSON.parse(fs.readFileSync(path.join(tree, '.claude', 'verify.json'), 'utf8')); } catch { return null; }
}

function main(argv = process.argv.slice(2), { env = process.env, out = (s) => process.stdout.write(s), cwd = process.cwd(), runLeg = spawnLeg } = {}) {
  const args = parseArgs(argv);
  if (typeof args.run !== 'string' || !args.run) {
    out('usage: label-tests.js --run <run_id> [--reason "<text>" --test <file>:<line>]...\n');
    return 2;
  }
  const root = env.CLAUDE_PROJECT_DIR || cwd;
  const records = readLog(root);
  const run = records.find((r) => r.source === 'verify-run' && r.run_id === args.run);
  if (!run) {
    out(`label-tests: no record of run ${args.run} in .claude/audit/verify-verdict.json\n`);
    return 2;
  }
  if (run.busy_machine === true) {
    out(`label-tests: run ${args.run} ran on a busy machine — another heavy run shared it, so its times are not the tests' own — nothing is labelled\n`);
    return 0;
  }
  const tree = typeof run.tree === 'string' && run.tree ? run.tree : root;
  // A timed-out test is over the slow line by definition: it ran at least its stop.
  const timedOut = (Array.isArray(run.timed_out) ? run.timed_out : [])
    .filter((t) => t && typeof t.file === 'string' && Number.isInteger(t.line))
    .map((t) => ({ ...t, ms: Infinity }));
  const timed = [...(Array.isArray(run.test_times) ? run.test_times : []), ...timedOut];
  const hashes = run.timed_hashes && typeof run.timed_hashes === 'object' ? run.timed_hashes
    : run.file_hashes && typeof run.file_hashes === 'object' ? run.file_hashes : null;
  if (timed.length === 0 || !hashes) {
    out(`label-tests: run ${args.run} timed no test — a fast call (--step, --files or --tied) times its tests, and any run records the ones it timed out\n`);
    return 2;
  }
  const threshold = slowLine(tree);
  const ownLabels = records.filter((r) => r.source === 'label-tests' && r.run_id === args.run && r.files && typeof r.files === 'object');
  const wanted = args.reasons.map(({ at, reason }) => {
    const m = /^(.*):(\d+)$/.exec(String(at || ''));
    return m ? { file: m[1].replace(/\\/g, '/'), line: Number(m[2]), reason, done: false } : { file: String(at), line: 0, reason, done: false };
  });

  const files = {};
  const runners = new Map();
  const runnerFor = (kind) => {
    if (!runners.has(kind)) runners.set(kind, { ...loadRunner(kind, { root, env: { ...process.env, ...env } }), slowFiles: [] });
    return runners.get(kind);
  };
  const priorCheck = (file) => ownLabels.filter((r) => r.checks && r.checks[file]).map((r) => r.checks[file]).at(-1);
  const step = stepFiles(run);
  const inStep = (file) => !step || (step.has(file) && changedFromHead(tree, file) !== false);
  const pending = [];
  const unproven = [];
  const untouched = new Set();
  const timedFiles = [...new Set([...Object.keys(run.timed_hashes || {}), ...timedOut.map((t) => t.file)])];
  for (const file of timedFiles.sort()) {
    const kind = runnerOfFile(file);
    if (!kind) continue;
    const labeller = runnerFor(kind);
    if (!labeller.runner) {
      out(`label-tests: skipped ${file} — ${labeller.reason}\n`);
      continue;
    }
    if (labeller.runner.takesNoLabels) continue;
    const before = hashes[file];
    const current = fileHash(tree, file);
    const prior = ownLabels.filter((r) => r.files[file]).map((r) => r.files[file]).at(-1);
    let shifts;
    if (current !== null && current === before) shifts = [];
    else if (prior && current !== null && prior.after === current) shifts = Array.isArray(prior.shifts) ? [...prior.shifts] : [];
    else {
      out(`label-tests: skipped ${file} — changed since run ${args.run}, so its timed positions no longer hold\n`);
      const check = priorCheck(file);
      if (check && !check.passed) unproven.push(file);
      continue;
    }
    const original = fs.readFileSync(path.join(tree, file), 'utf8');
    // A test located by its line alone gets its line's first column; the runner picks the tests it labels by.
    let tests = timed.filter((t) => t.file === file)
      .map((t) => (!Number.isInteger(t.line) || Number.isInteger(t.column) ? t : { ...t, column: firstColumn(original, mapLine(shifts, t.line)) }));
    if (!inStep(file)) {
      const probe = labeller.runner.labelSource({ file, source: original, tests, threshold, wanted: wanted.map((w) => ({ ...w })), shifts, out: () => {} });
      if (probe.text !== original) out(`label-tests: ${file} — a slow candidate, left unlabelled: the step did not change it\n`);
      continue;
    }
    // Inside the step's own file, only the tests the step changed; every runner edits only the tests it is handed.
    const changes = step ? changedLines(tree, file) : null;
    if (Array.isArray(changes)) {
      const kept = touchedTests(tests, changes, original, shifts);
      for (const t of tests) if (!kept.includes(t)) untouched.add(`${file}:${t.line}`);
      tests = kept;
    }
    const { text, slow } = labeller.runner.labelSource({ file, source: original, tests, threshold, wanted, shifts, out });
    pending.push({ file, text, original, before, current, shifts, slow, labeller });
  }
  // A label whose project file lies outside the step is not written, and neither is that project file.
  for (const p of pending) {
    if (!step || !p.slow || !p.labeller.runner.labelCompanions) continue;
    const blocked = p.labeller.runner.labelCompanions({ tree, files: [p.file] }).filter(({ file: companion, merge }) => {
      const was = fs.existsSync(path.join(tree, companion)) ? fs.readFileSync(path.join(tree, companion), 'utf8') : null;
      const merged = merge(was);
      return merged !== null && merged !== was && !inStep(companion);
    });
    if (blocked.length) {
      p.blocked = true;
      out(`label-tests: ${[p.file, ...blocked.map((c) => c.file)].join(' and ')} — a slow candidate, left unlabelled: the label needs ${blocked.map((c) => c.file).join(', ')}, which the step did not change\n`);
    }
  }
  const split = [];
  for (const { file, text, original, before, current, shifts, slow, labeller, blocked } of pending) {
    if (blocked) continue;
    if (slow) labeller.slowFiles.push(file);
    let hash = current;
    if (text !== original) {
      fs.writeFileSync(path.join(tree, file), text);
      hash = fileHash(tree, file);
      files[file] = { before, after: hash, shifts };
      out(`label-tests: ${file} — labelled from run ${args.run} (slow line ${threshold} ms)\n`);
    }
    if (runnerOfFile(file) !== 'node' || !text.includes(SLOW_LABEL) || (text === original && current === before)) continue;
    const check = priorCheck(file);
    if (check && check.passed && check.hash === hash) out(`label-tests: ${file} — its two legs passed run apart at this content\n`);
    else split.push({ file, hash });
  }
  // The complete run runs a node file's labelled tests and its other tests in separate processes: each file
  // this run labelled runs its two legs apart once, so a test that leans on another's state is found now.
  let apart = true;
  const checks = {};
  for (const file of unproven) {
    apart = false;
    out(`label-tests: ${file} — its two legs failed run apart for run ${args.run} and it changed since: time it again with a new fast call and label from that run\n`);
  }
  if (split.length && run.step_run !== true) {
    // Both legs take the slow stop: the check is for a test leaning on another, never for its speed.
    const { slowMs } = testSettings(readConfig(tree));
    for (const { file, hash } of split) {
      const legs = nodeLegs({ targets: [file], stop: { fastMs: slowMs, slowMs }, labelled: true, cwd: tree, slowFiles: [file] });
      const failed = legs.map((leg, i) => ({ name: i === 0 ? 'fast' : 'slow', status: runLeg(leg.args, { cwd: tree, env: legEnv(leg.env) }) }))
        .filter((l) => l.status !== 0);
      checks[file] = { hash, passed: failed.length === 0 };
      if (failed.length === 0) { out(`label-tests: ${file} — its two legs run apart: both pass\n`); continue; }
      apart = false;
      for (const l of failed) {
        out(`label-tests: ${file} — its ${l.name} leg failed run apart (exit ${l.status}): a labelled test must stand alone — the complete run runs a file's labelled tests and its other tests in separate processes, so each sets up what it needs itself\n`);
      }
    }
  }
  // A project file the new labels need beside them, such as the declaration of the tag they carry.
  const companions = [...runners.values()]
    .filter((r) => r.runner && r.runner.labelCompanions && r.slowFiles.length)
    .flatMap((r) => r.runner.labelCompanions({ tree, files: r.slowFiles }));
  for (const { file: yaml, merge, refused } of companions) {
    const was = fs.existsSync(path.join(tree, yaml)) ? fs.readFileSync(path.join(tree, yaml), 'utf8') : null;
    const merged = merge(was);
    if (merged === null) { out(`label-tests: ${refused}\n`); continue; }
    if (merged === was) continue;
    const before = was === null ? null : fileHash(tree, yaml);
    fs.writeFileSync(path.join(tree, yaml), merged);
    files[yaml] = { before, after: fileHash(tree, yaml), shifts: [] };
    out(`label-tests: ${yaml} — the slow tag declared\n`);
  }
  for (const w of wanted.filter((x) => !x.done)) {
    const kind = runnerOfFile(w.file);
    if (kind && runnerFor(kind).runner && runnerFor(kind).runner.takesNoLabels) {
      w.done = true;
      out(`label-tests: ${w.file} — this runner's tests take no slow label, so no reason is written\n`);
      continue;
    }
    out(untouched.has(`${w.file}:${w.line}`)
      ? `label-tests: ${w.file}:${w.line} is a test the step did not change — its label stands, no reason written\n`
      : `label-tests: ${w.file}:${w.line} is no test run ${args.run} timed — no reason written\n`);
  }
  if (Object.keys(files).length || Object.keys(checks).length) {
    try {
      fs.mkdirSync(path.join(root, '.claude', 'audit'), { recursive: true });
      const record = { ts: new Date().toISOString(), source: 'label-tests', run_id: args.run, tree, files, ...(Object.keys(checks).length ? { checks } : {}) };
      fs.appendFileSync(path.join(root, ...LOG), `${JSON.stringify(record)}\n`);
    } catch { out('label-tests: the label record could not be written — the labelled files will read as changed since the run\n'); }
  }
  return wanted.some((w) => !w.done) || !apart ? 1 : 0;
}

module.exports = { main };

if (require.main === module) process.exit(main());
